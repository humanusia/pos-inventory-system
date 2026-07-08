// ============================================================================
// InventoryDashboard — Warehouse view with low-stock alerts & product table
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Pencil,
  ArrowUpDown,
  Filter,
  PackageCheck,
  PackageX,
  BarChart3,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatRupiah, getStockStatus, cn } from '@/utils/helpers';
import type { StockStatus } from '@/types';

export default function InventoryDashboard() {
  const { products, loading, fetchProducts, toggleActive } = useProducts();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'low' | 'critical' | 'safe'>('All');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derived
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert && p.is_active
      ),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stock_quantity <= 0 && p.is_active),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (statusFilter !== 'All') {
      list = list.filter((p) => {
        const s = getStockStatus(p.stock_quantity, p.min_stock_alert);
        return s === statusFilter;
      });
    }
    return list;
  }, [products, search, categoryFilter, statusFilter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: products.filter((p) => p.is_active).length,
      low: lowStockProducts.length,
      out: outOfStockProducts.length,
      totalValue: products
        .filter((p) => p.is_active)
        .reduce((sum, p) => sum + p.stock_quantity * p.cost_price, 0),
    }),
    [products, lowStockProducts, outOfStockProducts]
  );

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventaris Gudang</h2>
          <p className="text-sm text-slate-500">
            Kelola produk, stok masuk/keluar, & audit
          </p>
        </div>
        <button onClick={() => navigate('/inventory/add')} className="btn-primary gap-2">
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Package size={20} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Produk Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Stok Rendah</p>
              <p className="text-xl font-extrabold text-warning-700">{stats.low}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center">
              <PackageX size={20} className="text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Stok Habis</p>
              <p className="text-xl font-extrabold text-danger-700">{stats.out}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-success-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Nilai Inventaris</p>
              <p className="text-lg font-extrabold text-slate-800">
                {formatRupiah(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Low Stock Alert Banner ────────────────────────────────────── */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning-500" />
            Peringatan Stok
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {outOfStockProducts.map((p) => (
              <div
                key={p.id}
                className="card p-3 border-danger-200 bg-danger-50/50 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sku}</p>
                </div>
                <span className="badge bg-danger-100 text-danger-700 flex-shrink-0">HABIS</span>
              </div>
            ))}
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="card p-3 border-warning-200 bg-warning-50/50 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.sku} • Sisa{' '}
                    <span className="font-bold text-warning-700">{p.stock_quantity}</span>
                  </p>
                </div>
                <span className="badge bg-warning-100 text-warning-700 flex-shrink-0">RENDAH</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="input pl-9 text-sm"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Filter size={14} className="text-slate-400" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
              }`}
            >
              {cat === 'All' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="input w-auto text-sm py-2"
        >
          <option value="All">Semua Status</option>
          <option value="safe">Tersedia</option>
          <option value="low">Stok Rendah</option>
          <option value="critical">Habis</option>
        </select>
      </div>

      {/* ── Product Table ────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Package size={40} strokeWidth={1.5} />
            <p className="font-medium">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Kategori</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Harga Jual</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Harga Modal</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Stok</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((product) => {
                  const status = getStockStatus(product.stock_quantity, product.min_stock_alert);
                  const statusConfig: Record<StockStatus, string> = {
                    safe: 'bg-success-100 text-success-700',
                    low: 'bg-warning-100 text-warning-700',
                    critical: 'bg-danger-100 text-danger-700',
                  };
                  const statusLabel: Record<StockStatus, string> = {
                    safe: 'Tersedia',
                    low: 'Rendah',
                    critical: 'Habis',
                  };
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {product.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{product.name}</td>
                      <td className="py-3 px-4 text-slate-500">{product.category}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatRupiah(product.selling_price)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatRupiah(product.cost_price)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{product.stock_quantity}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn('badge text-[10px]', statusConfig[status])}>
                          {statusLabel[status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/inventory/edit/${product.id}`)}
                            className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                            title="Edit produk"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/inventory/stock/${product.id}`)}
                            className="p-1.5 rounded-lg hover:bg-warning-50 text-slate-400 hover:text-warning-600 transition-colors"
                            title="Mutasi stok"
                          >
                            <ArrowUpDown size={14} />
                          </button>
                          <button
                            onClick={() => toggleActive(product.id, !product.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              product.is_active
                                ? 'hover:bg-danger-50 text-slate-400 hover:text-danger-600'
                                : 'hover:bg-success-50 text-slate-300 hover:text-success-600'
                            }`}
                            title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {product.is_active ? <PackageX size={14} /> : <PackageCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
