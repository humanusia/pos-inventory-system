// ============================================================================
// UserManagement — Admin: Create & manage users
// ============================================================================
import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import type { UserFormData, UserRole } from '@/types';
import { USER_ROLES, ROLE_LABELS } from '@/types';
import toast from 'react-hot-toast';
import { cn, isValidPin } from '@/utils/helpers';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  ADMIN: <ShieldAlert size={16} />,
  CASHIER: <Shield size={16} />,
  LOGISTICS: <ShieldCheck size={16} />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-brand-100 text-brand-700',
  CASHIER: 'bg-success-100 text-success-700',
  LOGISTICS: 'bg-sky-100 text-sky-700',
};

const EMPTY_FORM: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'CASHIER',
  pin_code: '1234',
};

export default function UserManagement() {
  const { profile: currentUser } = useAuth();
  const { users, loading, fetchUsers, createUser, toggleUserActive, updatePin } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Pin editing
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (!isValidPin(form.pin_code)) {
      toast.error('PIN harus 4 digit angka');
      return;
    }

    setSaving(true);
    const result = await createUser(form);
    setSaving(false);

    if (result.success) {
      setForm(EMPTY_FORM);
      setShowForm(false);
    }
  };

  const handleSavePin = async (userId: string) => {
    if (!isValidPin(newPin)) {
      toast.error('PIN harus 4 digit angka');
      return;
    }

    setSavingPin(true);
    await updatePin(userId, newPin);
    setSavingPin(false);
    setEditingPin(null);
    setNewPin('');
  };

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">Kelola akun kasir, logistik, dan admin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary gap-2"
        >
          <UserPlus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {/* ── Create User Form ────────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4 animate-scale">
          <h3 className="font-bold text-slate-800">Tambah Pengguna Baru</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama lengkap"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email <span className="text-danger-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="nama@perusahaan.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password <span className="text-danger-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 karakter"
                className="input"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                PIN (4 digit) <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={form.pin_code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setForm((p) => ({ ...p, pin_code: val }));
                }}
                placeholder="1234"
                className="input font-mono"
                maxLength={4}
                required
                pattern="\d{4}"
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
            <div className="flex gap-2">
              {USER_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role }))}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.role === role
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-500 hover:border-brand-300'
                  }`}
                >
                  {ROLE_ICONS[role]}
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-success gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              Buat Pengguna
            </button>
          </div>
        </form>
      )}

      {/* ── Users Table ─────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Users size={40} strokeWidth={1.5} />
            <p className="font-medium">Belum ada pengguna</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Email</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Role</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">PIN</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      'hover:bg-slate-50/50 transition-colors',
                      !user.is_active && 'opacity-50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{user.name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-[10px] text-brand-600 font-medium">(Anda)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{user.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('badge text-[10px] gap-1', ROLE_COLORS[user.role])}>
                        {ROLE_ICONS[user.role]}
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingPin === user.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="text"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="input w-16 text-center font-mono text-sm py-1.5"
                            maxLength={4}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePin(user.id)}
                            disabled={savingPin}
                            className="p-1.5 rounded-md bg-success-100 text-success-700 hover:bg-success-200"
                          >
                            {savingPin ? (
                              <div className="w-3 h-3 border-2 border-success-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingPin(null);
                              setNewPin('');
                            }}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <span className="font-mono text-sm font-medium text-slate-600">
                            {user.pin_code}
                          </span>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                setEditingPin(user.id);
                                setNewPin(user.pin_code);
                              }}
                              className="p-1 rounded-md hover:bg-brand-50 text-slate-400 hover:text-brand-600"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          'badge text-[10px]',
                          user.is_active
                            ? 'bg-success-100 text-success-700'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleUserActive(user.id, !user.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            user.is_active
                              ? 'bg-slate-100 text-slate-600 hover:bg-danger-50 hover:text-danger-600'
                              : 'bg-success-50 text-success-600 hover:bg-success-100 hover:text-success-700'
                          }`}
                        >
                          {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
