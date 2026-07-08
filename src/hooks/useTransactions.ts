// ============================================================================
// useTransactions — POS Transactions & Real-time Sales Feed
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionItem, PaymentMethod, DailySummary } from '@/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// Input type for the atomic POS transaction RPC
interface POSItemInput {
  product_id: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (limit = 50) => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('transactions')
      .select(`
        *,
        cashier:profiles!transactions_cashier_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (err) {
      setError(err.message);
    } else {
      setTransactions(
        (data as unknown[]).map((tx) => ({
          ...(tx as Transaction),
          cashier_name: (tx as { cashier?: { name: string } }).cashier?.name ?? 'Unknown',
        }))
      );
    }

    setLoading(false);
  }, []);

  // ── Atomic POS Transaction via RPC ─────────────────────────────────────
  const processSale = useCallback(async (
    cashierId: string,
    paymentMethod: PaymentMethod,
    cashReceived: number,
    items: POSItemInput[],
    memberId?: string,
  ): Promise<{ success: boolean; receipt_number?: string; change_given?: number; points_earned?: number; error?: string }> => {
    const { data, error: err } = await supabase
      .rpc('process_pos_transaction', {
        p_cashier_id: cashierId,
        p_payment_method: paymentMethod,
        p_cash_received: cashReceived,
        p_items: items,
        p_member_id: memberId || null,
      });

    if (err) {
      toast.error('Transaksi gagal: ' + err.message);
      return { success: false, error: err.message };
    }

    const result = data as {
      success: boolean;
      transaction_id?: string;
      receipt_number?: string;
      total_amount?: number;
      change_given?: number;
      item_count?: number;
      points_earned?: number;
      error?: string;
    };

    if (!result.success) {
      toast.error(result.error || 'Transaksi gagal');
      return { success: false, error: result.error };
    }

    toast.success(`Transaksi berhasil! ${result.receipt_number}`);
    await fetchTransactions();
    return {
      success: true,
      receipt_number: result.receipt_number,
      change_given: result.change_given,
      points_earned: result.points_earned,
    };
  }, [fetchTransactions]);

  // ── Fetch Transaction Items ────────────────────────────────────────────
  const fetchTransactionItems = useCallback(async (transactionId: string): Promise<TransactionItem[]> => {
    const { data, error: err } = await supabase
      .from('transaction_items')
      .select(`
        *,
        product:products!transaction_items_product_id_fkey(name, sku)
      `)
      .eq('transaction_id', transactionId);

    if (err) {
      toast.error('Gagal memuat detail transaksi');
      return [];
    }

    return (data as unknown[]).map((item) => ({
      ...(item as TransactionItem),
      product_name: (item as { product?: { name: string } }).product?.name ?? 'Unknown',
      product_sku: (item as { product?: { sku: string } }).product?.sku ?? '',
    }));
  }, []);

  // ── Daily Summary ──────────────────────────────────────────────────────
  const fetchDailySummary = useCallback(async (): Promise<DailySummary | null> => {
    const today = new Date().toISOString().split('T')[0];

    const { data: txs, error: err } = await supabase
      .from('transactions')
      .select(`
        total_amount,
        created_at,
        items:transaction_items(subtotal, product:products(cost_price, selling_price))
      `)
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    if (err) return null;

    const txList = txs as unknown as Array<{
      total_amount: number;
      created_at: string;
      items: Array<{
        subtotal: number;
        product: { cost_price: number; selling_price: number } | null;
      }>;
    }>;

    let totalRevenue = 0;
    let totalProfit = 0;
    let itemsSold = 0;

    for (const tx of txList) {
      totalRevenue += tx.total_amount;
      for (const item of tx.items || []) {
        itemsSold += 1;
        if (item.product) {
          totalProfit += item.product.selling_price - item.product.cost_price;
        }
      }
    }

    return {
      date: today,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      transaction_count: txList.length,
      items_sold: itemsSold,
    };
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload: RealtimePostgresChangesPayload<Transaction>) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    processSale,
    fetchTransactionItems,
    fetchDailySummary,
  };
}
