// ============================================================================
// Sidebar — Role-aware navigation
// Will be fleshed out fully in the next phase.
// ============================================================================
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  LogOut,
  Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/pos',
    icon: <ShoppingCart size={20} />,
    label: 'Point of Sale',
    roles: ['CASHIER', 'ADMIN'],
  },
  {
    to: '/inventory',
    icon: <Package size={20} />,
    label: 'Inventaris Gudang',
    roles: ['LOGISTICS', 'ADMIN'],
  },
  {
    to: '/admin',
    icon: <TrendingUp size={20} />,
    label: 'Dashboard Admin',
    roles: ['ADMIN'],
  },
  {
    to: '/admin/users',
    icon: <Users size={20} />,
    label: 'Manajemen Pengguna',
    roles: ['ADMIN'],
  },
];

export function Sidebar() {
  const { profile, logout, hasRole } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const filteredItems = NAV_ITEMS.filter((item) => hasRole(...item.roles));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
          <Store size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-sm">POS System</h1>
          <p className="text-xs text-slate-500">Inventory Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{profile.role.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:bg-danger-50 hover:text-danger-600 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
