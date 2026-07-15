// ============================================================================
// Utility helpers — formatting, stock status, receipt generation
// ============================================================================
import type { StockStatus, CartItem } from '@/types';

// ── Currency Formatter (IDR) ────────────────────────────────────────────────

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount);
}

// ── Compact currency (e.g. "Rp 150K" for display) ──────────────────────────

export function formatCompactRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}K`;
  }
  return `Rp ${amount}`;
}

// ── Stock Status ────────────────────────────────────────────────────────────

export function getStockStatus(
  stockQuantity: number,
  minStockAlert: number
): StockStatus {
  if (stockQuantity <= 0) return 'critical';
  if (stockQuantity <= minStockAlert) return 'low';
  return 'safe';
}

export const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  safe: {
    label: 'Tersedia',
    bg: 'bg-success-100',
    text: 'text-success-700',
    dot: 'bg-success-500',
  },
  low: {
    label: 'Stok Rendah',
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    dot: 'bg-warning-500',
  },
  critical: {
    label: 'Habis',
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    dot: 'bg-danger-500',
  },
};

// ── Date / Time Formatters ──────────────────────────────────────────────────

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function formatTime(isoString: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Receipt Number Generator (client-side fallback) ────────────────────────

export function generateReceiptNumber(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `INV-${y}${m}${d}-${rand}`;
}

// ── Cart Totals ─────────────────────────────────────────────────────────────

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ── Change Calculation ──────────────────────────────────────────────────────

export function calculateChange(
  total: number,
  cashReceived: number
): { change: number; insufficient: boolean } {
  if (cashReceived < total) {
    return { change: 0, insufficient: true };
  }
  return { change: cashReceived - total, insufficient: false };
}

// ── SKU Generator ───────────────────────────────────────────────────────────

export function generateSKU(category: string, existingCount: number): string {
  const prefix = category
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const num = String(existingCount + 1).padStart(4, '0');
  return `${prefix}-${num}`;
}

// ── PIN Validator ───────────────────────────────────────────────────────────

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// ── Color helpers for charts ────────────────────────────────────────────────

export const CHART_COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  sky: '#0ea5e9',
  indigo: '#4f46e5',
};

// ── Classname merge (simple) ────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
