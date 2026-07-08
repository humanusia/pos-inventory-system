// ============================================================================
// Receipt Printer — Thermal/standard receipt HTML generation + print
// ============================================================================
import { formatRupiah, formatDateTime } from '@/utils/helpers';

interface ReceiptData {
  receiptNumber: string;
  cashierName: string;
  date: string;
  items: {
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }[];
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  changeGiven?: number;
}

export function openReceiptWindow(data: ReceiptData): Window | null {
  const changeStr =
    data.cashReceived != null
      ? `
    <tr><td class="label">Uang Diterima</td><td class="val">${formatRupiah(data.cashReceived)}</td></tr>
    <tr><td class="label">Kembalian</td><td class="val">${formatRupiah(data.changeGiven ?? 0)}</td></tr>`
      : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Struk — ${data.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #1e293b;
      padding: 16px;
      max-width: 300px;
      margin: 0 auto;
    }
    .header { text-align: center; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; }
    .header h2 { font-size: 16px; margin-bottom: 2px; color: #6366f1; }
    .header p { font-size: 11px; color: #64748b; }
    .receipt-no { font-weight: bold; font-size: 14px; text-align: center; margin: 8px 0; }
    .divider { border: none; border-top: 1px dashed #cbd5e1; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    .items th { text-align: left; font-size: 11px; border-bottom: 1px solid #e2e8f0; padding: 4px 2px; }
    .items td { padding: 3px 2px; font-size: 12px; }
    .label { text-align: left; font-size: 12px; }
    .val { text-align: right; font-size: 12px; font-weight: bold; }
    .total-row td { font-size: 15px; font-weight: bold; padding-top: 6px; }
    .footer { text-align: center; margin-top: 14px; font-size: 11px; color: #94a3b8; }
    .footer p { margin-bottom: 2px; }
    @media print {
      body { padding: 4mm; }
      @page { margin: 2mm; size: 80mm 200mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🏪 POS Inventory</h2>
    <p>Jl. Contoh Alamat No. 123</p>
    <p>Telp: (021) 123-4567</p>
  </div>

  <div class="receipt-no">${data.receiptNumber}</div>

  <p style="font-size:11px;color:#64748b;margin-bottom:8px;">
    ${formatDateTime(data.date)}<br>
    Kasir: ${data.cashierName}<br>
    Pembayaran: ${data.paymentMethod}
  </p>

  <hr class="divider">

  <table class="items">
    <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Harga</th><th style="text-align:right;">Subtotal</th></tr>
    ${data.items
      .map(
        (item) => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:right;">${formatRupiah(item.price)}</td>
      <td style="text-align:right;">${formatRupiah(item.subtotal)}</td>
    </tr>`
      )
      .join('')}
  </table>

  <hr class="divider">

  <table>
    <tr class="total-row"><td class="label">TOTAL</td><td class="val">${formatRupiah(data.total)}</td></tr>
    ${changeStr}
  </table>

  <hr class="divider">

  <div class="footer">
    <p>🟢 Barang yang sudah dibeli</p>
    <p>tidak dapat dikembalikan</p>
    <br>
    <p>Terima kasih telah berbelanja!</p>
    <p style="margin-top:8px;">${new Date().toLocaleString('id-ID')}</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
      // Fallback: close after 60s if user cancels print
      setTimeout(function() { window.close(); }, 60000);
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=350,height=600');
  if (!w) return null;
  w.document.write(html);
  w.document.close();
  return w;
}
