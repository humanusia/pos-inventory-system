-- ============================================================================
-- MEMBERSHIP & POIN SYSTEM — Migration Script
-- Run this AFTER the main schema.sql
-- ============================================================================

-- 1. New Enum: point_transaction_type
-- ============================================================================
CREATE TYPE public.point_transaction_type AS ENUM ('EARN', 'REDEEM');


-- 2. members table
-- ============================================================================
CREATE TABLE public.members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL CHECK (char_length(name) >= 2),
    phone           TEXT UNIQUE CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{8,15}$'),
    total_points    INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_members_phone ON public.members(phone);
CREATE INDEX idx_members_name ON public.members(name);

CREATE TRIGGER set_updated_at_members
    BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. point_transactions table (audit trail)
-- ============================================================================
CREATE TABLE public.point_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    transaction_id  UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    type            public.point_transaction_type NOT NULL,
    points          INTEGER NOT NULL CHECK (points > 0),
    description     TEXT NOT NULL CHECK (char_length(description) >= 3),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pt_member ON public.point_transactions(member_id);
CREATE INDEX idx_pt_transaction ON public.point_transactions(transaction_id);
CREATE INDEX idx_pt_created_at ON public.point_transactions(created_at DESC);


-- 4. Add member_id to transactions (nullable)
-- ============================================================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS member_id UUID
    REFERENCES public.members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_member ON public.transactions(member_id);


-- 5. RLS: members
-- ============================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY members_admin_all ON public.members
    FOR ALL TO authenticated
    USING (public.get_current_user_role() = 'ADMIN')
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Everyone authenticated can read active members (for POS lookup)
CREATE POLICY members_read_active ON public.members
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Cashier can insert new members (walk-in registration at POS)
CREATE POLICY members_cashier_insert ON public.members
    FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'CASHIER'));


-- 6. RLS: point_transactions
-- ============================================================================
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY pt_admin_all ON public.point_transactions
    FOR ALL TO authenticated
    USING (public.get_current_user_role() = 'ADMIN')
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Everyone authenticated can read (needed for POS member lookup)
CREATE POLICY pt_read_all ON public.point_transactions
    FOR SELECT TO authenticated
    USING (true);


-- 7. UPDATED: process_pos_transaction with membership support
-- Replaces the original function — accepts optional member_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_pos_transaction(
    p_cashier_id UUID,
    p_payment_method public.payment_method,
    p_cash_received INTEGER,
    p_items JSONB,
    p_member_id UUID DEFAULT NULL  -- NEW: optional member
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_transaction_id UUID;
    v_total_amount INTEGER := 0;
    v_change_given INTEGER := 0;
    v_item JSONB;
    v_product_record RECORD;
    v_previous_stock INTEGER;
    v_new_stock INTEGER;
    v_receipt TEXT;
    v_result JSONB;
    v_stock_error BOOLEAN := false;
    v_stock_error_msg TEXT := '';
    v_points_earned INTEGER := 0;
    v_member_name TEXT;
BEGIN
    -- Validate cashier
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_cashier_id
        AND role IN ('CASHIER', 'ADMIN')
        AND is_active = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive cashier');
    END IF;

    -- Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No items in transaction');
    END IF;

    -- Validate member if provided
    IF p_member_id IS NOT NULL THEN
        SELECT name INTO v_member_name
        FROM public.members
        WHERE id = p_member_id AND is_active = true;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Member not found or inactive');
        END IF;
    END IF;

    -- Calculate total & validate stock for all items FIRST
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT stock_quantity, name INTO v_product_record
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
        AND is_active = true
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Product not found or inactive: ' || (v_item->>'product_id')
            );
        END IF;

        IF v_product_record.stock_quantity < (v_item->>'quantity')::INTEGER THEN
            v_stock_error := true;
            v_stock_error_msg := 'Insufficient stock for "' || v_product_record.name
                || '" — available: ' || v_product_record.stock_quantity
                || ', requested: ' || (v_item->>'quantity');
            EXIT;
        END IF;

        v_total_amount := v_total_amount + (v_item->>'subtotal')::INTEGER;
    END LOOP;

    IF v_stock_error THEN
        RETURN jsonb_build_object('success', false, 'error', v_stock_error_msg);
    END IF;

    -- Validate payment
    IF p_payment_method = 'CASH' AND p_cash_received < v_total_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient cash: received ' || p_cash_received || ', total ' || v_total_amount
        );
    END IF;

    -- Calculate change
    IF p_payment_method = 'CASH' THEN
        v_change_given := p_cash_received - v_total_amount;
    END IF;

    -- ★ Membership: calculate points (total / 1000, rounded down)
    IF p_member_id IS NOT NULL THEN
        v_points_earned := floor(v_total_amount / 1000)::INTEGER;
    END IF;

    -- Create transaction
    INSERT INTO public.transactions (
        total_amount, payment_method, cash_received, change_given, cashier_id, member_id
    ) VALUES (
        v_total_amount, p_payment_method, p_cash_received, v_change_given, p_cashier_id, p_member_id
    ) RETURNING id, receipt_number INTO v_transaction_id, v_receipt;

    -- Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.transaction_items (
            transaction_id, product_id, quantity, price_at_sale, subtotal
        ) VALUES (
            v_transaction_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price_at_sale')::INTEGER,
            (v_item->>'subtotal')::INTEGER
        );

        SELECT stock_quantity INTO v_previous_stock
        FROM public.products WHERE id = (v_item->>'product_id')::UUID;

        UPDATE public.products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
        WHERE id = (v_item->>'product_id')::UUID
        RETURNING stock_quantity INTO v_new_stock;

        INSERT INTO public.stock_movements (
            product_id, type, quantity, previous_stock, new_stock, reason, created_by
        ) VALUES (
            (v_item->>'product_id')::UUID,
            'OUT',
            (v_item->>'quantity')::INTEGER,
            v_previous_stock,
            v_new_stock,
            'POS Sale — Receipt: ' || v_receipt,
            p_cashier_id
        );
    END LOOP;

    -- ★ Membership: award points & log
    IF p_member_id IS NOT NULL AND v_points_earned > 0 THEN
        UPDATE public.members
        SET total_points = total_points + v_points_earned
        WHERE id = p_member_id;

        INSERT INTO public.point_transactions (
            member_id, transaction_id, type, points, description
        ) VALUES (
            p_member_id,
            v_transaction_id,
            'EARN',
            v_points_earned,
            'Poin dari transaksi ' || v_receipt || ' — Total belanja ' || v_total_amount
        );
    END IF;

    -- Return success with transaction details
    SELECT jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'receipt_number', v_receipt,
        'total_amount', v_total_amount,
        'payment_method', p_payment_method,
        'change_given', v_change_given,
        'item_count', jsonb_array_length(p_items),
        'member_name', v_member_name,
        'points_earned', v_points_earned
    ) INTO v_result;

    RETURN v_result;
END;
$$;


-- 8. NEW RPC: redeem points
-- ============================================================================
CREATE OR REPLACE FUNCTION public.redeem_member_points(
    p_member_id UUID,
    p_points_to_redeem INTEGER,
    p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_current_points INTEGER;
    v_member_name TEXT;
BEGIN
    IF public.get_current_user_role() NOT IN ('ADMIN', 'CASHIER') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    SELECT name, total_points INTO v_member_name, v_current_points
    FROM public.members
    WHERE id = p_member_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Member not found');
    END IF;

    IF p_points_to_redeem > v_current_points THEN
        RETURN jsonb_build_object('success', false, 'error',
            'Poin tidak cukup: punya ' || v_current_points || ', ingin redeem ' || p_points_to_redeem);
    END IF;

    IF p_points_to_redeem <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Jumlah poin tidak valid');
    END IF;

    -- Deduct points
    UPDATE public.members
    SET total_points = total_points - p_points_to_redeem
    WHERE id = p_member_id;

    -- Log redemption
    INSERT INTO public.point_transactions (
        member_id, type, points, description
    ) VALUES (
        p_member_id,
        'REDEEM',
        p_points_to_redeem,
        'Tukar ' || p_points_to_redeem || ' poin — redeem by staff'
    );

    RETURN jsonb_build_object(
        'success', true,
        'member_name', v_member_name,
        'points_redeemed', p_points_to_redeem,
        'remaining_points', v_current_points - p_points_to_redeem
    );
END;
$$;


-- 9. Realtime for members + point_transactions
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;
