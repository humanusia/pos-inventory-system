-- MISSING FUNCTIONS FIX — Run if redeem_points or stock_movement fail
-- ============================================================================

-- Redeem Member Points (if not already exists)
CREATE OR REPLACE FUNCTION public.redeem_member_points(
    p_member_id UUID,
    p_points_to_redeem INTEGER,
    p_created_by UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_cur_pts INTEGER; v_mem_name TEXT;
BEGIN
    SELECT name, total_points INTO v_mem_name, v_cur_pts FROM public.members WHERE id = p_member_id AND is_active;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Member not found'); END IF;
    IF p_points_to_redeem > v_cur_pts THEN RETURN jsonb_build_object('success', false, 'error', 'Poin tidak cukup'); END IF;
    IF p_points_to_redeem <= 0 THEN RETURN jsonb_build_object('success', false, 'error', 'Jumlah tidak valid'); END IF;
    UPDATE public.members SET total_points = total_points - p_points_to_redeem WHERE id = p_member_id;
    INSERT INTO public.point_transactions (member_id, type, points, description) VALUES (p_member_id, 'REDEEM', p_points_to_redeem, 'Tukar ' || p_points_to_redeem || ' poin');
    RETURN jsonb_build_object('success', true, 'member_name', v_mem_name, 'points_redeemed', p_points_to_redeem, 'remaining_points', v_cur_pts - p_points_to_redeem);
END;
$$;

-- Process Stock Movement (if not already exists)
CREATE OR REPLACE FUNCTION public.process_stock_movement(
    p_product_id UUID, p_type public.stock_movement_type,
    p_quantity INTEGER, p_reason TEXT, p_created_by UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_prv INTEGER; v_new INTEGER; v_pname TEXT;
BEGIN
    SELECT name, stock_quantity INTO v_pname, v_prv FROM public.products WHERE id = p_product_id AND is_active;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Product not found'); END IF;
    IF p_type = 'IN' THEN v_new := v_prv + p_quantity;
    ELSIF p_type = 'OUT' THEN
        IF v_prv < p_quantity THEN RETURN jsonb_build_object('success', false, 'error', 'Stok tidak cukup'); END IF;
        v_new := v_prv - p_quantity;
    ELSE v_new := p_quantity; END IF;
    UPDATE public.products SET stock_quantity = v_new WHERE id = p_product_id;
    INSERT INTO public.stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, created_by)
    VALUES (p_product_id, p_type, p_quantity, v_prv, v_new, p_reason, p_created_by);
    RETURN jsonb_build_object('success', true, 'product_name', v_pname, 'previous_stock', v_prv, 'new_stock', v_new);
END;
$$;
