// ============================================================================
// POSTerminal — Touch-Friendly POS with Barcode Scanner & Tile Grid
// ============================================================================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Printer,
  X,
  Package,
  TrendingDown,
  UserPlus,
  Users,
  Gift,
  Star,
  Scan,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useTransactions } from '@/hooks/useTransactions';
import { useMembers } from '@/hooks/useMembers';
import type { Product, CartItem, PaymentMethod, StockStatus, Member } from '@/types';
import { formatRupiah, getStockStatus, cn } from '@/utils/helpers';
import { openReceiptWindow } from '@/utils/receiptPrinter';
import toast from 'react-hot-toast';
import { PAYMENT_LABELS } from '@/types';

// ── Stock style helper ───────────────────────────────────────────────────────
const stockDot: Record<StockStatus, string> = {
  safe: 'bg-success-400',
  low: 'bg-warning-400',
  critical: 'bg-danger-400',
};



// ── Component ────────────────────────────────────────────────────────────────
export default function POSTerminal() {
  const { profile } = useAuth();
  const { products, loading: loadingProducts, fetchProducts } = useProducts();
  const { processSale } = useTransactions();
  const { searchMembers } = useMembers();

  // ── Search / Barcode / Filter ────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const barcodeRef = useRef<HTMLInputElement>(null);

  // ── Cart ─────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Payment modal ────────────────────────────────────────────────────
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);

  // ── Receipt ──────────────────────────────────────────────────────────
  const [receipt, setReceipt] = useState<{
    receipt_number: string;
    total: number;
    payment: PaymentMethod;
    change: number;
    points_earned?: number;
    items: CartItem[];
  } | null>(null);

  // ── Membership ───────────────────────────────────────────────────────
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchingMember, setSearchingMember] = useState(false);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Member search debounce
  useEffect(() => {
    if (!memberSearch.trim()) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingMember(true);
      setMemberResults(await searchMembers(memberSearch));
      setSearchingMember(false);
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch, searchMembers]);

  // ── Derived ──────────────────────────────────────────────────────────
  const activeProducts = useMemo(() => products.filter(p => p.is_active), [products]);

  const categories = useMemo(() => {
    const cats = new Set(activeProducts.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    let list = activeProducts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'All') {
      list = list.filter(p => p.category === categoryFilter);
    }
    return list;
  }, [activeProducts, search, categoryFilter]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.subtotal, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const pointsPreview = useMemo(() =>
    selectedMember ? Math.floor(cartTotal / 1000) : 0,
    [cartTotal, selectedMember]
  );

  // ── Barcode handler ──────────────────────────────────────────────────
  const handleBarcode = useCallback((code: string) => {
    const found = activeProducts.find(p =>
      p.sku.toUpperCase() === code.toUpperCase() ||
      p.name.toLowerCase().includes(code.toLowerCase())
    );
    if (found) {
      addToCart(found);
      toast.success(found.name);
      setBarcode('');
    }
    // If not found, keep the input — user can press Enter again after typing full name
    // Focus stays on barcode input
    barcodeRef.current?.focus();
  }, [activeProducts]);

  // ── Cart actions ─────────────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Stok "${product.name}" tidak cukup`);
          return prev;
        }
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i
        );
      }
      if (product.stock_quantity <= 0) {
        toast.error(`"${product.name}" habis`);
        return prev;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        price: product.selling_price,
        quantity: 1,
        subtotal: product.selling_price,
        current_stock: product.stock_quantity,
      }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.current_stock) { toast.error(`Stok tidak cukup (tersedia: ${i.current_stock})`); return i; }
      return { ...i, quantity: newQty, subtotal: newQty * i.price };
    }).filter(Boolean) as CartItem[]);
  }, []);

  // ── Payment ──────────────────────────────────────────────────────────
  const cashChange = useMemo(() => {
    const received = parseInt(cashReceived) || 0;
    return received - cartTotal;
  }, [cashReceived, cartTotal]);

  const handleProcessPayment = async () => {
    if (!profile || cart.length === 0) return;
    setProcessing(true);
    const result = await processSale(
      profile.id, paymentMethod,
      paymentMethod === 'CASH' ? parseInt(cashReceived) || 0 : cartTotal,
      cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_sale: item.price,
        subtotal: item.subtotal,
      })),
      selectedMember?.id
    );
    setProcessing(false);
    if (result.success) {
      setReceipt({
        receipt_number: result.receipt_number || '',
        total: cartTotal,
        payment: paymentMethod,
        change: result.change_given ?? 0,
        points_earned: result.points_earned,
        items: [...cart],
      });
      setCart([]);
      setShowPayment(false);
      setCashReceived('');
    }
  };

  const quickAmounts = useMemo(() => {
    if (cartTotal <= 0) return [];
    const roundUp = (n: number, to: number) => Math.ceil(n / to) * to;
    return [...new Set([1000, 5000, 10000, 50000, 100000].map(to => roundUp(cartTotal, to)))]
      .sort((a, b) => a - b).slice(0, 4);
  }, [cartTotal]);

  // Auto-focus barcode on mount & after payment
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Ignore inside payment modal
      if (showPayment || receipt) return;
      // Any keypress → refocus barcode
      if (e.key.length === 1 || e.key === 'Backspace') {
        barcodeRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPayment, receipt]);

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-3">
      {/* ════════════════ LEFT: Product Catalog (Touch Tiles) ════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top bar: Barcode + Search + Categories ─────────────────── */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          {/* Barcode scanner input */}
          <div className="relative flex-1 max-w-xs">
            <Scan size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            <input
              ref={barcodeRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBarcode(barcode); }}
              placeholder="Scan barcode / SKU..."
              className="input pl-10 text-sm font-mono bg-brand-50/50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 focus:border-brand-500"
              autoFocus
            />
            {barcode && (
              <button onClick={() => handleBarcode(barcode)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-brand-600 text-white rounded-md text-xs font-bold hover:bg-brand-700">
                Go
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="input pl-9 text-sm"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto flex-shrink-0">
            {categories.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                }`}
              >
                {cat === 'All' ? 'Semua' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Product Tiles Grid ──────────────────────────────────────── */}
        {loadingProducts ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Package size={48} strokeWidth={1.5} />
            <p className="font-medium">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 content-start pr-1">
            {filteredProducts.map(product => {
              const status = getStockStatus(product.stock_quantity, product.min_stock_alert);
              const isOut = product.stock_quantity <= 0;
              return (
                <button
                  key={product.id}
                  onClick={() => !isOut && addToCart(product)}
                  disabled={isOut}
                  className={cn(
                    'relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center',
                    'hover:shadow-md active:scale-[0.96] select-none min-h-[110px]',
                    isOut
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-40 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer'
                  )}
                >
                  {/* Stock dot indicator */}
                  <div className={cn('absolute top-2 right-2 w-2.5 h-2.5 rounded-full', stockDot[status])} />

                  {/* Icon area */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-1.5',
                    isOut
                      ? 'bg-slate-100 dark:bg-slate-700'
                      : 'bg-brand-50 dark:bg-brand-900/30'
                  )}>
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Tag size={18} className={isOut ? 'text-slate-300' : 'text-brand-500'} />
                    )}
                  </div>

                  {/* Name + Price */}
                  <p className={cn(
                    'text-xs font-semibold leading-tight line-clamp-2 mb-1',
                    isOut ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'
                  )}>
                    {product.name}
                  </p>
                  <p className={cn(
                    'text-sm font-extrabold',
                    isOut ? 'text-slate-300' : 'text-brand-700 dark:text-brand-400'
                  )}>
                    {formatRupiah(product.selling_price)}
                  </p>

                  {/* Stock badge */}
                  <span className={cn(
                    'mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                    status === 'safe' && 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400',
                    status === 'low' && 'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
                    status === 'critical' && 'bg-danger-50 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
                  )}>
                    {isOut ? 'HABIS' : `Stok: ${product.stock_quantity}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════ RIGHT: Cart Panel ════════════════ */}
      <div className="w-[350px] flex-shrink-0 flex flex-col">
        <div className="card flex-1 flex flex-col overflow-hidden dark:bg-slate-800">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-brand-600" />
              <h3 className="font-bold text-slate-800 dark:text-white">Pesanan</h3>
              {cartItemCount > 0 && (
                <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 text-xs">
                  {cartItemCount} item
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])}
                className="text-xs text-danger-500 hover:text-danger-700 font-medium">
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart items */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-6">
              <TrendingDown size={44} strokeWidth={1.5} />
              <div className="text-center">
                <p className="font-medium text-sm">Keranjang kosong</p>
                <p className="text-xs mt-1">Klik produk atau scan barcode</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.map(item => (
                <div key={item.product_id}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 animate-in">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.product_id, -1)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 transition-colors">
                      <Minus size={15} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                      {item.quantity}
                    </span>
                    <button onClick={() => updateQuantity(item.product_id, 1)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 transition-colors">
                      <Plus size={15} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 w-24 text-right">
                    {formatRupiah(item.subtotal)}
                  </p>
                  <button onClick={() => removeFromCart(item.product_id)}
                    className="p-1 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-slate-400 hover:text-danger-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
            {/* Member lookup */}
            <div className="space-y-2">
              {selectedMember ? (
                <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-900/30 rounded-xl p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Star size={16} className="text-brand-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-700 dark:text-brand-300 truncate">{selectedMember.name}</p>
                      <p className="text-xs text-brand-500 dark:text-brand-400">🎁 Dapat {pointsPreview} poin</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedMember(null); setMemberSearch(''); }}
                    className="text-xs text-brand-500 hover:text-danger-500 font-medium flex-shrink-0">Lepas</button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Cari member (nama/HP)..."
                      className="input pl-9 text-xs py-2" />
                    {searchingMember && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {memberResults.length > 0 && (
                    <div className="mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-lg max-h-36 overflow-y-auto animate-scale">
                      {memberResults.map(m => (
                        <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(''); setMemberResults([]); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                            <p className="text-xs text-slate-400">{m.phone || 'Tanpa HP'} • {m.total_points} poin</p>
                          </div>
                          <UserPlus size={14} className="text-brand-500 flex-shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Total</span>
              <span className="font-extrabold text-slate-800 dark:text-white text-xl">{formatRupiah(cartTotal)}</span>
            </div>
            <button onClick={() => setShowPayment(true)} disabled={cart.length === 0}
              className="btn-success w-full py-3 text-base gap-2">
              <CreditCard size={18} />
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════ Payment Modal ════════════════ */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Pembayaran</h3>
              <button onClick={() => setShowPayment(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{formatRupiah(cartTotal)}</p>
                <p className="text-xs text-slate-400 mt-1">{cartItemCount} item</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-2">
                  {([{ value: 'CASH' as PaymentMethod, icon: Banknote, label: PAYMENT_LABELS.CASH },
                     { value: 'QRIS' as PaymentMethod, icon: QrCode, label: PAYMENT_LABELS.QRIS },
                     { value: 'DEBIT' as PaymentMethod, icon: CreditCard, label: PAYMENT_LABELS.DEBIT }] as const
                  ).map(({ value, icon: Icon, label }) => (
                    <button key={value} onClick={() => { setPaymentMethod(value); setCashReceived(''); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === value
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-brand-300'
                      }`}>
                      <Icon size={22} />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod === 'CASH' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Uang Diterima</label>
                  <input type="number" value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Masukkan nominal uang..."
                    className="input text-lg font-bold" autoFocus />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {quickAmounts.map(amount => (
                      <button key={amount} onClick={() => setCashReceived(String(amount))}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 rounded-lg text-xs font-semibold transition-colors">
                        {formatRupiah(amount)}
                      </button>
                    ))}
                  </div>
                  {parseInt(cashReceived) > 0 && parseInt(cashReceived) >= cartTotal && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Kembalian:</span>
                      <span className="font-bold text-success-600">{formatRupiah(cashChange)}</span>
                    </div>
                  )}
                </div>
              )}
              {paymentMethod === 'QRIS' && (
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 text-center space-y-2">
                  <QrCode size={48} className="mx-auto text-sky-600 dark:text-sky-400" />
                  <p className="text-sm font-medium text-sky-700 dark:text-sky-300">Scan QR Code</p>
                  <p className="text-xs text-sky-500 dark:text-sky-400">Simulasi pembayaran QRIS — langsung sukses</p>
                </div>
              )}
              <button onClick={handleProcessPayment}
                disabled={processing || cart.length === 0 || (paymentMethod === 'CASH' && (parseInt(cashReceived) || 0) < cartTotal)}
                className="btn-success w-full py-3 text-base gap-2">
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Receipt size={18} />
                  {paymentMethod === 'CASH' ? `Bayar ${formatRupiah(cartTotal)}` : 'Konfirmasi Pembayaran'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Receipt Modal ════════════════ */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm animate-scale overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto">
                <Receipt size={28} className="text-success-600 dark:text-success-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Transaksi Berhasil</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{receipt.receipt_number}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total</span>
                  <span className="font-bold dark:text-white">{formatRupiah(receipt.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Metode</span>
                  <span className="font-medium dark:text-slate-300">{PAYMENT_LABELS[receipt.payment]}</span>
                </div>
                {receipt.change > 0 && (
                  <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-600 pt-2">
                    <span className="text-slate-500 dark:text-slate-400">Kembalian</span>
                    <span className="font-bold text-success-600">{formatRupiah(receipt.change)}</span>
                  </div>
                )}
                {receipt.points_earned != null && receipt.points_earned > 0 && (
                  <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-600 pt-2">
                    <span className="text-brand-600 dark:text-brand-400 flex items-center gap-1"><Gift size={14} /> Poin</span>
                    <span className="font-bold text-brand-700 dark:text-brand-300">+{receipt.points_earned} pts</span>
                  </div>
                )}
              </div>
              <div className="text-left text-xs text-slate-400 dark:text-slate-500 space-y-1 max-h-32 overflow-y-auto">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  openReceiptWindow({
                    receiptNumber: receipt.receipt_number,
                    cashierName: profile?.name || 'Kasir',
                    date: new Date().toISOString(),
                    items: receipt.items.map(item => ({
                      name: item.product_name, qty: item.quantity, price: item.price, subtotal: item.subtotal,
                    })),
                    total: receipt.total,
                    paymentMethod: PAYMENT_LABELS[receipt.payment],
                    cashReceived: receipt.payment === 'CASH' ? receipt.total + receipt.change : undefined,
                    changeGiven: receipt.payment === 'CASH' ? receipt.change : undefined,
                  });
                }} className="btn-secondary flex-1 gap-1">
                  <Printer size={16} />Cetak
                </button>
                <button onClick={() => setReceipt(null)} className="btn-primary flex-1">Selesai</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
