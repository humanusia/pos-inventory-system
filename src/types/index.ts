// ============================================================================
// POS & Inventory System — Complete TypeScript Types
// ============================================================================

// ── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'CASHIER' | 'LOGISTICS';

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export type PaymentMethod = 'CASH' | 'QRIS' | 'DEBIT';

export const USER_ROLES: UserRole[] = ['ADMIN', 'CASHIER', 'LOGISTICS'];

export const STOCK_MOVEMENT_TYPES: StockMovementType[] = ['IN', 'OUT', 'ADJUSTMENT'];

export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'QRIS', 'DEBIT'];

// ── Role Labels (Bahasa Indonesia) ───────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  CASHIER: 'Kasir',
  LOGISTICS: 'Logistik / Gudang',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tunai',
  QRIS: 'QRIS',
  DEBIT: 'Kartu Debit',
};

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  IN: 'Stok Masuk',
  OUT: 'Stok Keluar',
  ADJUSTMENT: 'Stok Opname',
};

// ── Database Models ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  selling_price: number;   // integer, smallest currency unit (Rupiah)
  cost_price: number;       // integer
  stock_quantity: number;
  min_stock_alert: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_by: string;
  created_at: string;
  // Joined fields
  product_name?: string;
  product_sku?: string;
  creator_name?: string;
}

export interface Transaction {
  id: string;
  receipt_number: string;
  total_amount: number;
  payment_method: PaymentMethod;
  cash_received: number | null;
  change_given: number | null;
  cashier_id: string;
  created_at: string;
  // Joined fields
  cashier_name?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
  // Joined fields
  product_name?: string;
  product_sku?: string;
}

// ── POS Cart Types ───────────────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  price: number;          // selling_price at time of adding to cart
  quantity: number;
  subtotal: number;
  current_stock: number;  // for validation before checkout
}

// ── Form Input Types ─────────────────────────────────────────────────────────

export interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  image_url: string;
  is_active: boolean;
}

export interface StockMovementFormData {
  product_id: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  pin_code: string;
}

export interface POSPaymentData {
  payment_method: PaymentMethod;
  cash_received: number;
}

// ── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: Profile | null;
  session: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PinLoginCredentials {
  user_id: string;
  pin_code: string;
}

// ── Dashboard / Analytics Types ──────────────────────────────────────────────

export interface DailySummary {
  date: string;
  total_revenue: number;
  total_profit: number;
  transaction_count: number;
  items_sold: number;
}

export interface LowStockAlert extends Product {
  status: 'critical'; // stock = 0
}

export interface InventoryStatus {
  total_products: number;
  total_active: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface AdminDashboardData {
  today_revenue: number;
  today_profit: number;
  today_transaction_count: number;
  low_stock_products: Product[];
}

// ── Realtime Subscription Types ──────────────────────────────────────────────

export interface RealtimePayload<T> {
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  errors: string[] | null;
  schema: string;
  table: string;
}

// ── Component Prop Types ─────────────────────────────────────────────────────

export type StockStatus = 'safe' | 'low' | 'critical';

export interface RouteGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

// ── Helper: Format currency helper function signature ────────────────────────
export type CurrencyFormatter = (amount: number) => string;

// ── Table column definition ──────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}
