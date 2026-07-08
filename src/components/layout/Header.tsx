// ============================================================================
// Header — Clock + Theme Toggle + Export Menu
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Clock,
  Sun,
  Moon,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { exportTransactionsToCSV, exportInventoryToCSV, exportStockMovementsToCSV } from '@/utils/export';
import { cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

export function Header() {
  const { profile } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { transactions, fetchTransactionItems } = useTransactions();
  const { products } = useProducts();
  const { movements } = useStockMovements();
  const location = useLocation();

  const [time, setTime] = useState(new Date());
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  // Determine which exports are available based on current route
  const isInventoryPage = location.pathname.startsWith('/inventory');
  const isPosPage = location.pathname.startsWith('/pos');
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleExport = async (type: 'transactions' | 'inventory' | 'movements') => {
    setExporting(true);
    setExportOpen(false);

    try {
      switch (type) {
        case 'transactions': {
          if (transactions.length === 0) {
            toast.error('Tidak ada data transaksi untuk di-export');
            break;
          }
          const itemsMap = new Map();
          for (const tx of transactions.slice(0, 100)) {
            const items = await fetchTransactionItems(tx.id);
            itemsMap.set(tx.id, items);
          }
          exportTransactionsToCSV(transactions, itemsMap);
          toast.success('Laporan transaksi di-download');
          break;
        }
        case 'inventory': {
          if (products.length === 0) {
            toast.error('Tidak ada data produk untuk di-export');
            break;
          }
          exportInventoryToCSV(products);
          toast.success('Laporan inventaris di-download');
          break;
        }
        case 'movements': {
          if (movements.length === 0) {
            toast.error('Tidak ada data mutasi stok untuk di-export');
            break;
          }
          exportStockMovementsToCSV(movements);
          toast.success('Laporan mutasi stok di-download');
          break;
        }
      }
    } catch {
      toast.error('Gagal export laporan');
    } finally {
      setExporting(false);
    }
  };

  const canExportTrans = isPosPage || isAdminPage;
  const canExportInv = isInventoryPage || isAdminPage;
  const canExportMove = isInventoryPage || isAdminPage;

  return (
    <header className="h-16 bg-white border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: time */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
        <Clock size={16} />
        <span>{timeStr}</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">{dateStr}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Export menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            disabled={exporting}
            className={cn(
              'btn-ghost px-3 py-2 gap-1 text-sm',
              exportOpen && 'bg-slate-100 dark:bg-slate-700'
            )}
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={14} className={cn('transition-transform', exportOpen && 'rotate-180')} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 animate-scale">
              {canExportTrans && (
                <button
                  onClick={() => handleExport('transactions')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  📊 Export Transaksi (CSV)
                </button>
              )}
              {canExportInv && (
                <button
                  onClick={() => handleExport('inventory')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  📦 Export Inventaris (CSV)
                </button>
              )}
              {canExportMove && (
                <button
                  onClick={() => handleExport('movements')}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  🔄 Export Mutasi Stok (CSV)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
