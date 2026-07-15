// ============================================================================
// TransactionHistory — Sales history + daily summary (Cashier / Admin)
// ============================================================================
import { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Banknote,
  QrCode,
  CreditCard,
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/context/AuthContext';
import type { Transaction, TransactionItem, PaymentMethod } from '@/types';
import { PAYMENT_LABELS } from '@/types';
import { formatRupiah, formatDateTime, cn } from '@/utils/helpers';

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  CASH: <Banknote size={14} />,
  QRIS: <QrCode size={14} />,
  DEBIT: <CreditCard size={14} />,
};

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  CASH: 'bg-success-100 text-success-700',
  QRIS: 'bg-sky-100 text-sky-700',
  DEBIT: 'bg-brand-100 text-brand-700',
};

export default function TransactionHistory() {
  const { profile } = useAuth();
  const { transactions, loading, fetchTransactions, fetchTransactionItems } =
    useTransactions();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTransactions(100);
  }, [fetchTransactions]);

  const filtered = transactions.filter((tx) =>
    tx.receipt_number.toLowerCase().includes(search.toLowerCase())
  );

  const viewDetails = useCallback(
    async (tx: Transaction) => {
      setSelectedTx(tx);
      setLoadingItems(true);
      const result = await fetchTransactionItems(tx.id);
      setItems(result);
      setLoadingItems(false);
    },
    [fetchTransactionItems]
  );

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Riwayat Transaksi</h2>
          <p className="text-sm text-slate-500">
            {profile?.role === 'CASHIER'
              ? 'Transaksi shift Anda'
              : 'Semua transaksi'}
          </p>
        </div>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. receipt..."
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Receipt size={40} strokeWidth={1.5} />
            <p className="font-medium">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Receipt</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Tanggal</th>
                  {profile?.role === 'ADMIN' && (
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Kasir</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Metode</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-brand-700 text-xs">
                        {tx.receipt_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-xs">{formatDateTime(tx.created_at)}</span>
                      </div>
                    </td>
                    {profile?.role === 'ADMIN' && (
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {tx.cashier_name}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'badge text-[10px] gap-1',
                          PAYMENT_COLORS[tx.payment_method]
                        )}
                      >
                        {PAYMENT_ICONS[tx.payment_method]}
                        {PAYMENT_LABELS[tx.payment_method]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-sm">
                      {formatRupiah(tx.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => viewDetails(tx)}
                        className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Detail Transaksi</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Receipt</p>
                  <p className="font-bold text-sm text-slate-800 font-mono">
                    {selectedTx.receipt_number}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Tanggal</p>
                  <p className="font-bold text-sm text-slate-800">
                    {formatDateTime(selectedTx.created_at)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Metode</p>
                  <span className={cn('badge gap-1 text-xs', PAYMENT_COLORS[selectedTx.payment_method])}>
                    {PAYMENT_ICONS[selectedTx.payment_method]}
                    {PAYMENT_LABELS[selectedTx.payment_method]}
                  </span>
                </div>
                {selectedTx.cashier_name && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Kasir</p>
                    <p className="font-bold text-sm text-slate-800">{selectedTx.cashier_name}</p>
                  </div>
                )}
              </div>

              {/* Cash details */}
              {selectedTx.payment_method === 'CASH' && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedTx.cash_received != null && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Uang Diterima</p>
                      <p className="font-bold text-slate-800">{formatRupiah(selectedTx.cash_received)}</p>
                    </div>
                  )}
                  {selectedTx.change_given != null && selectedTx.change_given > 0 && (
                    <div className="bg-success-50 rounded-xl p-3">
                      <p className="text-xs text-success-600">Kembalian</p>
                      <p className="font-bold text-success-700">{formatRupiah(selectedTx.change_given)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Item</p>
                {loadingItems ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-slate-400">Tidak bisa memuat item</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{item.product_name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} × {formatRupiah(item.price_at_sale)}
                          </p>
                        </div>
                        <p className="font-bold text-slate-700">{formatRupiah(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
                <span className="font-bold text-brand-700">Total</span>
                <span className="text-xl font-extrabold text-brand-800">
                  {formatRupiah(selectedTx.total_amount)}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setSelectedTx(null)}
                className="btn-primary w-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
