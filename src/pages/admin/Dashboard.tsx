// ============================================================================
// AdminDashboard — Executive Analytics + Real-time Feed
// ============================================================================
import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useTransactions } from '@/hooks/useTransactions';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useUsers } from '@/hooks/useUsers';
import { formatRupiah, formatDateTime, cn } from '@/utils/helpers';
import type { DailySummary } from '@/types';
import { STOCK_MOVEMENT_LABELS } from '@/types';
import { PAYMENT_LABELS } from '@/types';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { products, fetchProducts } = useProducts();
  const { transactions, fetchTransactions, fetchDailySummary } = useTransactions();
  const { movements, fetchMovements } = useStockMovements();
  const { users, fetchUsers } = useUsers();
  const [summary, setSummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchTransactions(50);
    fetchMovements(50);
    fetchUsers();
    fetchDailySummary().then(setSummary);
  }, [fetchProducts, fetchTransactions, fetchMovements, fetchUsers, fetchDailySummary]);

  // Stats
  const stats = useMemo(() => {
    const lowStock = products.filter(
      (p) => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert
    ).length;
    const outOfStock = products.filter(
      (p) => p.is_active && p.stock_quantity <= 0
    ).length;
    const activeUsers = users.filter((u) => u.is_active).length;

    return {
      todayRevenue: summary?.total_revenue ?? 0,
      todayProfit: summary?.total_profit ?? 0,
      todayTxCount: summary?.transaction_count ?? 0,
      lowStock: lowStock + outOfStock,
      activeProducts: products.filter((p) => p.is_active).length,
      activeUsers,
    };
  }, [products, summary, users]);

  // Last 10 recent of each
  const recentTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);
  const recentMovements = useMemo(() => movements.slice(0, 10), [movements]);

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard Eksekutif</h2>
          <p className="text-sm text-slate-500">Overview bisnis & performa hari ini</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Selamat datang,</p>
          <p className="font-bold text-brand-700">{profile?.name}</p>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
              <DollarSign size={16} className="text-success-600" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Revenue</span>
          </div>
          <p className="text-lg font-extrabold text-slate-800">
            {formatRupiah(stats.todayRevenue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hari ini</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-brand-600" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Profit</span>
          </div>
          <p className="text-lg font-extrabold text-slate-800">
            {formatRupiah(stats.todayProfit)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Harga jual - modal</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <ShoppingCart size={16} className="text-sky-600" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Transaksi</span>
          </div>
          <p className="text-lg font-extrabold text-slate-800">{stats.todayTxCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hari ini</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning-600" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Alert Stok</span>
          </div>
          <p className={cn(
            'text-lg font-extrabold',
            stats.lowStock > 0 ? 'text-warning-700' : 'text-slate-800'
          )}>
            {stats.lowStock}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rendah / Habis</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
              <Package size={16} className="text-success-600" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Produk</span>
          </div>
          <p className="text-lg font-extrabold text-slate-800">{stats.activeProducts}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Aktif</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <Users size={16} className="text-brand-600" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pengguna</span>
          </div>
          <p className="text-lg font-extrabold text-slate-800">{stats.activeUsers}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Aktif</p>
        </div>
      </div>

      {/* ── Two-column feeds ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Sales */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-brand-600" />
              <h3 className="font-bold text-slate-800">Penjualan Terbaru</h3>
            </div>
            <ArrowUpRight size={14} className="text-slate-400" />
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              Belum ada transaksi hari ini
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-semibold text-brand-700">
                        {tx.receipt_number}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {PAYMENT_LABELS[tx.payment_method]} • {tx.cashier_name || 'Kasir'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {formatRupiah(tx.total_amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDateTime(tx.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Movements */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-warning-600" />
              <h3 className="font-bold text-slate-800">Mutasi Stok Terbaru</h3>
            </div>
            <ArrowUpRight size={14} className="text-slate-400" />
          </div>
          {recentMovements.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              Belum ada mutasi stok
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {recentMovements.map((m) => (
                <div key={m.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {m.product_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {STOCK_MOVEMENT_LABELS[m.type]} • Qty: {m.quantity} • {m.reason.slice(0, 40)}
                        {m.reason.length > 40 ? '...' : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[10px] font-semibold ${
                          m.type === 'IN'
                            ? 'text-success-600'
                            : m.type === 'OUT'
                              ? 'text-danger-600'
                              : 'text-brand-600'
                        }`}
                      >
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '→'}
                        {m.quantity}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {m.previous_stock} → {m.new_stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
