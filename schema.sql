-- ============================================================================
-- POS & REAL-TIME WAREHOUSE INVENTORY SYSTEM — Complete Supabase Schema
-- ============================================================================

-- 1. ENUMS
-- ============================================================================
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'CASHIER', 'LOGISTICS');

CREATE TYPE public.stock_movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

CREATE TYPE public.payment_method AS ENUM ('CASH', 'QRIS', 'DEBIT');


-- 2. TABLES
-- ============================================================================

-- 2a. Users (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    role            public.user_role NOT NULL DEFAULT 'CASHIER',
    pin_code        TEXT NOT NULL CHECK (pin_code ~ '^\d{4}$'),  -- exactly 4 digits
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable updated_at auto-tracking
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2b. Products
-- ============================================================================
CREATE TABLE public.products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku               TEXT NOT NULL UNIQUE CHECK (char_length(sku) >= 3),
    name              TEXT NOT NULL CHECK (char_length(name) >= 2),
    category          TEXT NOT NULL DEFAULT 'Uncategorized',
    selling_price     INTEGER NOT NULL CHECK (selling_price >= 0),  -- stored in smallest currency unit (e.g., Rupiah)
    cost_price        INTEGER NOT NULL CHECK (cost_price >= 0),
    stock_quantity    INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_alert   INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
    image_url         TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_stock ON public.products(stock_quantity, min_stock_alert);
CREATE INDEX idx_products_active ON public.products(is_active);

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2c. Stock Movements (Audit Trail)
-- ============================================================================
CREATE TABLE public.stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    type            public.stock_movement_type NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    previous_stock  INTEGER NOT NULL CHECK (previous_stock >= 0),
    new_stock       INTEGER NOT NULL CHECK (new_stock >= 0),
    reason          TEXT NOT NULL CHECK (char_length(reason) >= 3),
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX idx_stock_movements_created_by ON public.stock_movements(created_by);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);


-- 2d. Transactions (POS Sales)
-- ============================================================================
CREATE TABLE public.transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number  TEXT NOT NULL UNIQUE,
    total_amount    INTEGER NOT NULL CHECK (total_amount >= 0),
    payment_method  public.payment_method NOT NULL DEFAULT 'CASH',
    cash_received   INTEGER CHECK (cash_received IS NULL OR cash_received >= 0),
    change_given    INTEGER CHECK (change_given IS NULL OR change_given >= 0),
    cashier_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_cashier ON public.transactions(cashier_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_receipt ON public.transactions(receipt_number);


-- 2e. Transaction Items
-- ============================================================================
CREATE TABLE public.transaction_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    price_at_sale   INTEGER NOT NULL CHECK (price_at_sale >= 0),
    subtotal        INTEGER NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON public.transaction_items(product_id);


-- 3. TRIGGER — Auto-generate receipt number
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.receipt_seq
    START 1
    MINVALUE 1
    NO MAXVALUE
    CACHE 1;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val BIGINT;
    today_str TEXT;
BEGIN
    seq_val := nextval('public.receipt_seq');
    today_str := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD');
    NEW.receipt_number := 'INV-' || today_str || '-' || lpad(seq_val::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER set_receipt_number
    BEFORE INSERT ON public.transactions
    FOR EACH ROW
    WHEN (NEW.receipt_number IS NULL)
    EXECUTE FUNCTION public.generate_receipt_number();


-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper: get role of current authenticated user
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Helper: check if current user is active
CREATE OR REPLACE FUNCTION public.is_current_user_active()
RETURNS BOOLEAN AS $$
    SELECT is_active FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 4a. Profiles RLS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY profiles_admin_all ON public.profiles
    FOR ALL TO authenticated
    USING (public.get_current_user_role() = 'ADMIN')
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Everyone can read own profile
CREATE POLICY profiles_read_own ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Everyone can read active profiles (for PIN switcher / user lists)
CREATE POLICY profiles_read_active ON public.profiles
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Users can update their own PIN
CREATE POLICY profiles_update_own_pin ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));


-- 4b. Products RLS
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active products (needed for POS catalog)
CREATE POLICY products_read_all_active ON public.products
    FOR SELECT TO authenticated
    USING (is_active = true OR public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'));

-- Admin & Logistics: full CRUD
CREATE POLICY products_admin_logistics_all ON public.products
    FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'))
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'));

-- Admin & Logistics: insert
CREATE POLICY products_admin_logistics_insert ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'));

-- Admin & Logistics: update
CREATE POLICY products_admin_logistics_update ON public.products
    FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'))
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'));


-- 4c. Stock Movements RLS
-- ============================================================================
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Admin & Logistics: full CRUD
CREATE POLICY stock_movements_admin_logistics_all ON public.stock_movements
    FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'))
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'LOGISTICS'));

-- Admin can read all
CREATE POLICY stock_movements_admin_read ON public.stock_movements
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() = 'ADMIN');

-- Cashier can read own movements (auto-generated POS sales)
CREATE POLICY stock_movements_cashier_own ON public.stock_movements
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() = 'CASHIER'
        AND created_by = auth.uid()
    );


-- 4d. Transactions RLS
-- ============================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY transactions_admin_all ON public.transactions
    FOR ALL TO authenticated
    USING (public.get_current_user_role() = 'ADMIN')
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Cashier: create own transactions
CREATE POLICY transactions_cashier_insert ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_current_user_role() = 'CASHIER'
        AND cashier_id = auth.uid()
    );

-- Cashier: read own transactions
CREATE POLICY transactions_cashier_read_own ON public.transactions
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() = 'CASHIER'
        AND cashier_id = auth.uid()
    );


-- 4e. Transaction Items RLS
-- ============================================================================
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY transaction_items_admin_all ON public.transaction_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Cashier: can insert items into own transactions
CREATE POLICY transaction_items_cashier_insert ON public.transaction_items
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_current_user_role() IN ('CASHIER', 'ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = transaction_id
            AND transactions.cashier_id = auth.uid()
        )
    );

-- Cashier: can read items of own transactions
CREATE POLICY transaction_items_cashier_read ON public.transaction_items
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() IN ('CASHIER', 'ADMIN', 'LOGISTICS')
        AND EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = transaction_id
            AND (
                transactions.cashier_id = auth.uid()
                OR public.get_current_user_role() IN ('ADMIN', 'LOGISTICS')
            )
        )
    );


-- 5. ENABLE REALTIME SUBSCRIPTIONS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;


-- 6. HELPER FUNCTION — Atomic POS Transaction
-- Completes a sale: inserts transaction, deducts stock, logs stock movement
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_pos_transaction(
    p_cashier_id UUID,
    p_payment_method public.payment_method,
    p_cash_received INTEGER,
    p_items JSONB  -- [{product_id, quantity, price_at_sale, subtotal}]
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

    -- Calculate total & validate stock for all items FIRST
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT stock_quantity, name INTO v_product_record
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
        AND is_active = true
        FOR UPDATE; -- lock row

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Product not found or inactive: ' || (v_item->>'product_id')
            );
        END IF;

        IF v_product_record.stock_quantity < (v_item->>'quantity')::INTEGER THEN
            v_stock_error := true;
            v_stock_error_msg := 'Insufficient stock for "' || v_product_record.name || '" — available: ' || v_product_record.stock_quantity || ', requested: ' || (v_item->>'quantity');
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

    -- Create transaction
    INSERT INTO public.transactions (
        total_amount, payment_method, cash_received, change_given, cashier_id
    ) VALUES (
        v_total_amount, p_payment_method, p_cash_received, v_change_given, p_cashier_id
    ) RETURNING id, receipt_number INTO v_transaction_id, v_receipt;

    -- Process each item: insert transaction_item, deduct stock, log stock movement
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert transaction item
        INSERT INTO public.transaction_items (
            transaction_id, product_id, quantity, price_at_sale, subtotal
        ) VALUES (
            v_transaction_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price_at_sale')::INTEGER,
            (v_item->>'subtotal')::INTEGER
        );

        -- Get current stock before deduction
        SELECT stock_quantity INTO v_previous_stock
        FROM public.products WHERE id = (v_item->>'product_id')::UUID;

        -- Deduct stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
        WHERE id = (v_item->>'product_id')::UUID
        RETURNING stock_quantity INTO v_new_stock;

        -- Log stock movement
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

    -- Return success with transaction details
    SELECT jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'receipt_number', v_receipt,
        'total_amount', v_total_amount,
        'payment_method', p_payment_method,
        'change_given', v_change_given,
        'item_count', jsonb_array_length(p_items)
    ) INTO v_result;

    RETURN v_result;
END;
$$;


-- 7. HELPER FUNCTION — Process Stock Movement (IN / ADJUSTMENT)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_stock_movement(
    p_product_id UUID,
    p_type public.stock_movement_type,
    p_quantity INTEGER,
    p_reason TEXT,
    p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_previous_stock INTEGER;
    v_new_stock INTEGER;
    v_product_name TEXT;
BEGIN
    -- Only Admin & Logistics
    IF public.get_current_user_role() NOT IN ('ADMIN', 'LOGISTICS') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin or Logistics only');
    END IF;

    -- Get product
    SELECT name, stock_quantity INTO v_product_name, v_previous_stock
    FROM public.products WHERE id = p_product_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found or inactive');
    END IF;

    -- Calculate new stock
    IF p_type = 'IN' THEN
        v_new_stock := v_previous_stock + p_quantity;
    ELSIF p_type = 'OUT' THEN
        IF v_previous_stock < p_quantity THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
        END IF;
        v_new_stock := v_previous_stock - p_quantity;
    ELSE -- ADJUSTMENT
        v_new_stock := p_quantity; -- set absolute
    END IF;

    -- Update product stock
    UPDATE public.products SET stock_quantity = v_new_stock
    WHERE id = p_product_id;

    -- Log movement
    INSERT INTO public.stock_movements (
        product_id, type, quantity, previous_stock, new_stock, reason, created_by
    ) VALUES (
        p_product_id, p_type, p_quantity, v_previous_stock, v_new_stock, p_reason, p_created_by
    );

    RETURN jsonb_build_object(
        'success', true,
        'product_name', v_product_name,
        'previous_stock', v_previous_stock,
        'new_stock', v_new_stock,
        'type', p_type
    );
END;
$$;


-- 8. SEED DATA — Default Admin
-- ============================================================================
-- Create a helper function to seed initial admin (call AFTER creating first auth user)
CREATE OR REPLACE FUNCTION public.seed_admin(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, pin_code, is_active)
    VALUES (p_user_id, 'Admin', 'admin@pos.local', 'ADMIN', '0000', true)
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
