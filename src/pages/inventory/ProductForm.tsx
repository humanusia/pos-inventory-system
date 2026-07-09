// ============================================================================
// ProductForm — Add / Edit Product (Logistics & Admin)
// ============================================================================
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Package,
  Image,
  X,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/lib/supabase';
import type { Product, ProductFormData } from '@/types';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/utils/helpers';

const EMPTY_FORM: ProductFormData = {
  sku: '',
  name: '',
  category: 'Uncategorized',
  selling_price: 0,
  cost_price: 0,
  stock_quantity: 0,
  min_stock_alert: 5,
  image_url: '',
  is_active: true,
};

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { products, createProduct, updateProduct } = useProducts();
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      // Load product from local state or fetch
      const existing = products.find((p) => p.id === id);
      if (existing) {
        setForm({
          sku: existing.sku,
          name: existing.name,
          category: existing.category,
          selling_price: existing.selling_price,
          cost_price: existing.cost_price,
          stock_quantity: existing.stock_quantity,
          min_stock_alert: existing.min_stock_alert,
          image_url: existing.image_url || '',
          is_active: existing.is_active,
        });
        setLoading(false);
      } else {
        // Fetch from server
        supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
          .then(({ data }) => {
            if (data) {
              const p = data as Product;
              setForm({
                sku: p.sku,
                name: p.name,
                category: p.category,
                selling_price: p.selling_price,
                cost_price: p.cost_price,
                stock_quantity: p.stock_quantity,
                min_stock_alert: p.min_stock_alert,
                image_url: p.image_url || '',
                is_active: p.is_active,
              });
            }
            setLoading(false);
          });
      }
    }
  }, [id, isEdit]);

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.sku.trim()) {
      toast.error('Nama & SKU wajib diisi');
      return;
    }

    if (form.cost_price > form.selling_price) {
      toast.error('Harga modal tidak boleh lebih besar dari harga jual');
      return;
    }

    setSaving(true);

    let success: boolean;
    if (isEdit && id) {
      success = await updateProduct(id, form);
    } else {
      success = await createProduct(form);
    }

    setSaving(false);

    if (success) {
      navigate('/inventory');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <p className="text-sm text-slate-500">
            {isEdit ? `Mengedit: ${form.name}` : 'Tambahkan produk ke inventaris'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* SKU & Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              SKU <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
              placeholder="PRD-0001"
              className="input font-mono"
              required
              minLength={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nama Produk <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nama produk..."
              className="input"
              required
              minLength={2}
            />
          </div>
        </div>

        {/* Category & Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Kategori
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              placeholder="Uncategorized"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              URL Gambar
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => updateField('image_url', e.target.value)}
                placeholder="https://..."
                className="input flex-1"
              />
              {form.image_url ? (
                <button
                  type="button"
                  onClick={() => updateField('image_url', '')}
                  className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-danger-50 hover:text-danger-500 transition-colors"
                >
                  <X size={18} />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Image size={18} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Harga Modal <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              value={form.cost_price}
              onChange={(e) => updateField('cost_price', parseInt(e.target.value) || 0)}
              className="input"
              required
              min={0}
            />
            {form.cost_price > 0 && (
              <p className="text-xs text-slate-400 mt-1">{formatRupiah(form.cost_price)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Harga Jual <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              value={form.selling_price}
              onChange={(e) => updateField('selling_price', parseInt(e.target.value) || 0)}
              className="input"
              required
              min={0}
            />
            {form.selling_price > 0 && (
              <div>
                <p className="text-xs text-slate-400 mt-1">{formatRupiah(form.selling_price)}</p>
                {form.cost_price > 0 && form.selling_price > 0 && (
                  <p className={`text-xs mt-0.5 font-semibold ${
                    form.selling_price - form.cost_price >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  }`}>
                    Margin: {formatRupiah(form.selling_price - form.cost_price)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Stok Awal
            </label>
            <input
              type="number"
              value={form.stock_quantity}
              onChange={(e) => updateField('stock_quantity', parseInt(e.target.value) || 0)}
              className="input"
              min={0}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-warning-600 mt-1">
                ⚠ Stok tidak bisa diubah di form ini — gunakan menu Mutasi Stok
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Alert Stok Minimum
            </label>
            <input
              type="number"
              value={form.min_stock_alert}
              onChange={(e) => updateField('min_stock_alert', parseInt(e.target.value) || 0)}
              className="input"
              min={0}
            />
            <p className="text-xs text-slate-400 mt-1">
              Notifikasi muncul saat stok ≤ {form.min_stock_alert}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <button
              type="button"
              onClick={() => updateField('is_active', !form.is_active)}
              className={`w-full px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                form.is_active
                  ? 'border-success-300 bg-success-50 text-success-700'
                  : 'border-slate-300 bg-slate-50 text-slate-500'
              }`}
            >
              {form.is_active ? '✓ Aktif' : '✕ Nonaktif'}
            </button>
          </div>
        </div>

        {/* Preview card */}
        <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={24} className="text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">
              {form.name || 'Nama Produk'}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              {form.sku || 'SKU'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-brand-700">
                {formatRupiah(form.selling_price)}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">Stok: {form.stock_quantity}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="flex-1 btn-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </div>
      </form>
    </div>
  );
}
