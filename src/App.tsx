// ============================================================================
// App Router — Role-based routes
// ============================================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, RouteGuard } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Lazy-loaded pages
import LoginPage from '@/pages/LoginPage';
import POSTerminal from '@/pages/pos/POSTerminal';
import InventoryDashboard from '@/pages/inventory/InventoryDashboard';
import AdminDashboard from '@/pages/admin/Dashboard';
import UserManagement from '@/pages/admin/UserManagement';
import NotFound from '@/pages/NotFound';
import ProductForm from '@/pages/inventory/ProductForm';
import StockMovement from '@/pages/inventory/StockMovement';
import TransactionHistory from '@/pages/pos/TransactionHistory';

export default function App() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        profile ? <Navigate to={getHomePath(profile.role)} replace /> : <LoginPage />
      } />

      {/* CASHIER Routes */}
      <Route path="/pos" element={
        <RouteGuard allowedRoles={['CASHIER', 'ADMIN']}>
          <DashboardLayout />
        </RouteGuard>
      }>
        <Route index element={<POSTerminal />} />
        <Route path="history" element={<TransactionHistory />} />
      </Route>

      {/* LOGISTICS Routes */}
      <Route path="/inventory" element={
        <RouteGuard allowedRoles={['LOGISTICS', 'ADMIN']}>
          <DashboardLayout />
        </RouteGuard>
      }>
        <Route index element={<InventoryDashboard />} />
        <Route path="add" element={<ProductForm />} />
        <Route path="edit/:id" element={<ProductForm />} />
        <Route path="stock/:id" element={<StockMovement />} />
      </Route>

      {/* ADMIN Routes */}
      <Route path="/admin" element={
        <RouteGuard allowedRoles={['ADMIN']}>
          <DashboardLayout />
        </RouteGuard>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="transactions" element={<TransactionHistory />} />
        <Route path="inventory" element={<InventoryDashboard />} />
        <Route path="inventory/add" element={<ProductForm />} />
        <Route path="inventory/edit/:id" element={<ProductForm />} />
        <Route path="inventory/stock/:id" element={<StockMovement />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={
        profile
          ? <Navigate to={getHomePath(profile.role)} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────
import type { UserRole } from '@/types';

function getHomePath(role: UserRole): string {
  switch (role) {
    case 'CASHIER': return '/pos';
    case 'LOGISTICS': return '/inventory';
    case 'ADMIN': return '/admin';
    default: return '/login';
  }
}
