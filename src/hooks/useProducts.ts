// ============================================================================
// useProducts — Product CRUD & Real-time Stock Tracking
// ============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductFormData } from '@/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (err) {
      setError(err.message);
      toast.error('Gagal memuat produk');
    } else {
      setProducts(data as Product[]);
    }

    setLoading(false);
  }, []);

  const createProduct = useCallback(async (form: ProductFormData): Promise<boolean> => {
    const { error: err } = await supabase
      .from('products')
      .insert({
        sku: form.sku.toUpperCase(),
        name: form.name,
        category: form.category,
        selling_price: form.selling_price,
        cost_price: form.cost_price,
        stock_quantity: form.stock_quantity,
        min_stock_alert: form.min_stock_alert,
        image_url: form.image_url || null,
        is_active: form.is_active,
      });

    if (err) {
      toast.error('Gagal menambah produk: ' + err.message);
      return false;
    }

    toast.success('Produk berhasil ditambahkan');
    await fetchProducts();
    return true;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (
    id: string,
    form: Partial<ProductFormData>
  ): Promise<boolean> => {
    const { error: err } = await supabase
      .from('products')
      .update({
        ...(form.sku && { sku: form.sku.toUpperCase() }),
        ...(form.name && { name: form.name }),
        ...(form.category && { category: form.category }),
        ...(form.selling_price !== undefined && { selling_price: form.selling_price }),
        ...(form.cost_price !== undefined && { cost_price: form.cost_price }),
        ...(form.min_stock_alert !== undefined && { min_stock_alert: form.min_stock_alert }),
        ...(form.image_url !== undefined && { image_url: form.image_url }),
        ...(form.is_active !== undefined && { is_active: form.is_active }),
      })
      .eq('id', id);

    if (err) {
      toast.error('Gagal update produk: ' + err.message);
      return false;
    }

    toast.success('Produk berhasil diupdate');
    await fetchProducts();
    return true;
  }, [fetchProducts]);

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    const { error: err } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id);

    if (err) {
      toast.error('Gagal mengubah status produk');
      return false;
    }

    toast.success(isActive ? 'Produk diaktifkan' : 'Produk dinonaktifkan');
    await fetchProducts();
    return true;
  }, [fetchProducts]);

  // Real-time subscription (guarded against StrictMode double-fire)
  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: RealtimePostgresChangesPayload<Product>) => {
          setProducts((prev) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...prev, payload.new as Product];
              case 'UPDATE':
                return prev.map((p) => (p.id === (payload.new as Product).id ? (payload.new as Product) : p));
              case 'DELETE':
                return prev.filter((p) => p.id !== payload.old.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscribedRef.current = false;
    };
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleActive,
  };
}
