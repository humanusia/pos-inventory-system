// ============================================================================
// StockMovement — Log Stock In/Out/Adjustment + Audit Trail
// ============================================================================
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Save,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useStockMovements } from '@/hooks/useStockMovements';
import type {
  StockMovementType,
  StockMovementFormData,
} from '@/types';
import { STOCK_MOVEMENT_TYPES, STOCK_MOVEMENT_LABELS } from '@/types';
import {
  formatDateTime,
  cn,
} from '@/utils/helpers';
import toast from 'react-hot-toast';

const TYPE_ICONS: Record<StockMovementType, React.ReactNode> = {
  IN: <TrendingUp size={16} />,
  OUT: <TrendingDown size={16} />,
  ADJUSTMENT: <RotateCcw size={16} />,
};

const TYPE_COLORS: Record<StockMovementType, string> = {
  IN: 'bg-success-50 text-success-700 border-success-200',
  OUT: 'bg-danger-50 text-danger-700 border-danger-200',
  ADJUSTMENT: 'bg-brand-50 text-brand-700 border-brand-200',
};

export default function StockMovement() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { products, fetchProducts } = useProducts();
  const { movements, fetchMovements, processMovement } = useStockMovements();

  const [form, setForm] = useState<StockMovementFormData>({
    product_id: productId || '',
    type: 'IN',
    quantity: 1,
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, [fetchProducts, fetchMovements]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.product_id) || null,
    [products, form.product_id]
  );

  const productMovements = useMemo(
    () =>
      productId
        ? movements.filter((m) => m.product_id === productId)
        : movements,
    [movements, productId]
  );

  const previewStock =
    selectedProduct && form.quantity > 0
      ? form.type === 'IN'
        ? selectedProduct.stock_quantity + form.quantity
        : form.type === 'OUT'
          ? selectedProduct.stock_quantity - form.quantity
          : form.quantity // ADJUSTMENT sets absolute
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.product_id) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    if (form.quantity <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if (form.type === 'OUT' && selectedProduct && form.quantity > selectedProduct.stock_quantity) {
      toast.error('Stok tidak cukup');
      return;
    }
    if (!form.reason.trim() || form.reason.length < 3) {
      toast.error('Alasan mutasi wajib diisi (min. 3 karakter)');
      return;
    }
    if (!profile) return;

    setSaving(true);
    const success = await processMovement(form, profile.id);
    setSaving(false);

    if (success) {
      setForm((prev) => ({ ...prev, quantity: 1, reason: '' }));
    }
  };

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mutasi Stok</h2>
          <p className="text-sm text-slate-500">
            {selectedProduct
              ? `${selectedProduct.name} • Stok saat ini: ${selectedProduct.stock_quantity}`
              : 'Catat stok masuk, keluar, atau stok opname'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Form ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="card p-5 space-y-4">
            <h3 className="font-bold text-slate-800">Form Mutasi</h3>

            {/* Product selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Produk
              </label>
              <select
                value={form.product_id}
                onChange={(e) => setForm((prev) => ({ ...prev, product_id: e.target.value }))}
                className="input"
                required
              >
                <option value="">Pilih produk...</option>
                {products
                  .filter((p) => p.is_active)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Stok: {p.stock_quantity}
                    </option>
                  ))}
              </select>
            </div>

            {/* Movement type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tipe Mutasi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STOCK_MOVEMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, type }))}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      form.type === type
                        ? TYPE_COLORS[type] + ' border-current'
                        : 'border-slate-200 text-slate-500 hover:border-brand-300'
                    }`}
                  >
                    {TYPE_ICONS[type]}
                    {STOCK_MOVEMENT_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Jumlah
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))
                }
                className="input"
                min={1}
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alasan <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Contoh: Pengiriman supplier baru, Barang rusak, Stok opname bulanan..."
                className="input min-h-[80px] resize-none"
                required
                minLength={3}
              />
            </div>

            {/* Preview */}
            {selectedProduct && previewStock !== null && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Stok Saat Ini</span>
                  <span className="font-bold">{selectedProduct.stock_quantity}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>
                    {form.type === 'IN' ? '+' : form.type === 'OUT' ? '−' : '→'}{' '}
                    {STOCK_MOVEMENT_LABELS[form.type]}
                  </span>
                  <span
                    className={cn(
                      'font-bold',
                      form.type === 'IN'
                        ? 'text-success-600'
                        : form.type === 'OUT'
                          ? 'text-danger-600'
                          : 'text-brand-600'
                    )}
                  >
                    {form.type === 'IN' ? '+' : form.type === 'OUT' ? '−' : '='}
                    {form.quantity}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-semibold">Stok Baru</span>
                  <span
                    className={cn(
                      'font-extrabold',
                      previewStock < 0
                        ? 'text-danger-600'
                        : previewStock <= selectedProduct.min_stock_alert
                          ? 'text-warning-600'
                          : 'text-success-700'
                    )}
                  >
                    {previewStock < 0 ? '⚠ TIDAK VALID' : previewStock}
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || !form.product_id}
              className="btn-primary w-full gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Simpan Mutasi
            </button>
          </form>
        </div>

        {/* ── Audit Trail Table ──────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <h3 className="font-bold text-slate-800">
                Riwayat Mutasi{selectedProduct ? ` — ${selectedProduct.name}` : ''}
              </h3>
            </div>

            {productMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Package size={36} strokeWidth={1.5} />
                <p className="text-sm font-medium">Belum ada mutasi stok</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 text-xs">Waktu</th>
                      {!productId && (
                        <th className="text-left py-2.5 px-3 font-semibold text-slate-600 text-xs">Produk</th>
                      )}
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs">Tipe</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs">Qty</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs">Sebelum</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs">Sesudah</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 text-xs">Alasan</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 text-xs">Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {productMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(m.created_at)}
                        </td>
                        {!productId && (
                          <td className="py-2.5 px-3">
                            <p className="text-xs font-medium text-slate-800">{m.product_name}</p>
                            <p className="text-[10px] text-slate-400">{m.product_sku}</p>
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={cn(
                              'badge text-[10px] gap-1',
                              TYPE_COLORS[m.type]
                            )}
                          >
                            {TYPE_ICONS[m.type]}
                            {STOCK_MOVEMENT_LABELS[m.type]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-xs">
                          {m.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-500">
                          {m.previous_stock}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs font-bold">
                          {m.new_stock}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600 max-w-[180px] truncate">
                          {m.reason}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                          {m.creator_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
