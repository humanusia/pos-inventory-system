// ============================================================================
// useStockMovements — Audit Trail & Stock Movement Operations
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  StockMovement,
  StockMovementFormData,
  StockMovementType,
} from '@/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export function useStockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async (limit = 100) => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products!stock_movements_product_id_fkey(name, sku),
        creator:profiles!stock_movements_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (err) {
      setError(err.message);
      toast.error('Gagal memuat riwayat stok');
    } else {
      setMovements(
        (data as unknown[]).map((m) => ({
          ...(m as StockMovement),
          product_name: (m as { product?: { name: string } }).product?.name ?? 'Unknown',
          product_sku: (m as { product?: { sku: string } }).product?.sku ?? '',
          creator_name: (m as { creator?: { name: string } }).creator?.name ?? 'System',
        }))
      );
    }

    setLoading(false);
  }, []);

  // ── Process Stock Movement via RPC ─────────────────────────────────────
  const processMovement = useCallback(async (
    form: StockMovementFormData,
    createdBy: string,
  ): Promise<boolean> => {
    const { data, error: err } = await supabase
      .rpc('process_stock_movement', {
        p_product_id: form.product_id,
        p_type: form.type as StockMovementType,
        p_quantity: form.quantity,
        p_reason: form.reason,
        p_created_by: createdBy,
      });

    if (err) {
      toast.error('Gagal memproses mutasi stok: ' + err.message);
      return false;
    }

    const result = data as { success: boolean; error?: string };

    if (!result.success) {
      toast.error(result.error || 'Gagal memproses mutasi stok');
      return false;
    }

    toast.success('Mutasi stok berhasil disimpan');
    await fetchMovements();
    return true;
  }, [fetchMovements]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('movements-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_movements' },
        (payload: RealtimePostgresChangesPayload<StockMovement>) => {
          setMovements((prev) => [payload.new as StockMovement, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    movements,
    loading,
    error,
    fetchMovements,
    processMovement,
  };
}
