// ============================================================================
// Export utilities — CSV report generation + download
// ============================================================================
import type { Transaction, TransactionItem, Product, StockMovement } from '@/types';
import { PAYMENT_LABELS, STOCK_MOVEMENT_LABELS } from '@/types';
import { formatDateTime } from '@/utils/helpers';

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsv).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsv).join(','));
  return '﻿' + [headerLine, ...dataLines].join('\n');
}

function downloadBlob(content: string, filename: string, mimeType = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  itemsMap: Map<string, TransactionItem[]>
) {
  const headers = [
    'Receipt', 'Tanggal', 'Kasir', 'Metode Pembayaran', 'Total',
    'Item', 'Qty Produk', 'Cash Received', 'Change Given',
  ];

  const rows = transactions.map((tx) => {
    const items = itemsMap.get(tx.id) || [];
    const itemList = items.map((i) => `${i.product_name} x${i.quantity}`).join('; ');
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);

    return [
      tx.receipt_number,
      formatDateTime(tx.created_at),
      tx.cashier_name || '',
      PAYMENT_LABELS[tx.payment_method],
      tx.total_amount.toString(),
      itemList,
      totalQty.toString(),
      tx.cash_received?.toString() || '',
      tx.change_given?.toString() || '',
    ];
  });

  downloadBlob(buildCsv(headers, rows), `transaksi-${today()}.csv`);
}

export function exportInventoryToCSV(products: Product[]) {
  const headers = [
    'SKU', 'Nama', 'Kategori', 'Harga Modal', 'Harga Jual',
    'Margin', 'Stok', 'Min Stok Alert', 'Status Stok', 'Nilai Inventaris',
    'Aktif', 'Terakhir Diupdate',
  ];

  const rows = products.map((p) => {
    const margin = p.selling_price - p.cost_price;
    const status =
      p.stock_quantity <= 0 ? 'HABIS'
        : p.stock_quantity <= p.min_stock_alert ? 'RENDAH'
        : 'Tersedia';
    return [
      p.sku, p.name, p.category, p.cost_price.toString(), p.selling_price.toString(),
      margin.toString(), p.stock_quantity.toString(), p.min_stock_alert.toString(),
      status, (p.stock_quantity * p.cost_price).toString(),
      p.is_active ? 'Ya' : 'Tidak', formatDateTime(p.updated_at),
    ];
  });

  downloadBlob(buildCsv(headers, rows), `inventaris-${today()}.csv`);
}

export function exportStockMovementsToCSV(movements: StockMovement[]) {
  const headers = [
    'Waktu', 'Produk', 'SKU', 'Tipe', 'Qty', 'Stok Sebelum',
    'Stok Sesudah', 'Alasan', 'Oleh',
  ];

  const rows = movements.map((m) => [
    formatDateTime(m.created_at), m.product_name || '', m.product_sku || '',
    STOCK_MOVEMENT_LABELS[m.type], m.quantity.toString(),
    m.previous_stock.toString(), m.new_stock.toString(),
    m.reason, m.creator_name || '',
  ]);

  downloadBlob(buildCsv(headers, rows), `mutasi-stok-${today()}.csv`);
}

function today() { return new Date().toISOString().split('T')[0]; }
