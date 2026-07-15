// ============================================================================
// LoginPage — Email/Password + Quick PIN Switcher
// ============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { Store, KeyRound, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type Mode = 'password' | 'pin';

export default function LoginPage() {
  const { login, loginWithPin, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('password');

  // Email/password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [activeUsers, setActiveUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const selectedUserRef = useRef<Profile | null>(null);
  // Keep ref in sync with state
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Fetch active users for PIN pad
  const fetchActiveUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setActiveUsers(data as Profile[]);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    if (mode === 'pin') fetchActiveUsers();
  }, [mode, fetchActiveUsers]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    await login({ email: email.trim(), password });
  };

  const handlePinSubmit = useCallback(async () => {
    const user = selectedUserRef.current;
    if (!user || pin.length !== 4) return;
    await loginWithPin({ user_id: user.id, pin_code: pin });
    setPin('');
    setSelectedUser(null);
  }, [pin, loginWithPin]);

  const handlePinKey = useCallback((digit: string) => {
    setPin(prev => {
      if (prev.length >= 4) return prev;
      const newPin = prev + digit;
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        const user = selectedUserRef.current;
        if (user) {
          setTimeout(() => {
            loginWithPin({ user_id: user.id, pin_code: newPin });
            setPin('');
            setSelectedUser(null);
          }, 200);
        }
      }
      return newPin;
    });
  }, [loginWithPin]);

  const handlePinBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">POS & Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Point of Sale & Warehouse Management</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'password'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn size={16} />
            Email & Password
          </button>
          <button
            onClick={() => setMode('pin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'pin'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound size={16} />
            PIN Cepat
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-200/60 p-6">
          {mode === 'password' ? (
            /* ── Email/Password Form ── */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Masuk
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ── PIN Quick Login ── */
            <div className="space-y-5">
              {/* User selector */}
              {!selectedUser ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600">Pilih akun:</p>
                  {loadingUsers ? (
                    <div className="flex justify-center py-4">
                      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : activeUsers.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Tidak ada akun aktif</p>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {activeUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => { setSelectedUser(user); setPin(''); }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* PIN Entry */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg mx-auto mb-2">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-slate-800">{selectedUser.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{selectedUser.role.toLowerCase()}</p>
                  </div>

                  {/* PIN dots */}
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          i < pin.length
                            ? 'bg-brand-600 border-brand-600 scale-100'
                            : 'bg-slate-100 border-slate-300 scale-90'
                        }`}
                      />
                    ))}
                  </div>

                  {/* PIN keypad */}
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, idx) => {
                      if (key === '') {
                        return <div key={idx} />;
                      }
                      if (key === 'back') {
                        return (
                          <button
                            key={idx}
                            onClick={handlePinBackspace}
                            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium text-sm transition-colors"
                          >
                            ⌫
                          </button>
                        );
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePinKey(key)}
                          disabled={pin.length >= 4}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 hover:border-brand-300 text-slate-800 font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedUser(null); setPin(''); }}
                      className="flex-1 btn-ghost text-sm"
                    >
                      Ganti Akun
                    </button>
                    <button
                      onClick={handlePinSubmit}
                      disabled={pin.length !== 4 || loading}
                      className="flex-1 btn-primary text-sm"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          Masuk
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          POS & Inventory System v1.0 • <span className="font-medium text-slate-500">Supabase</span>
        </p>
      </div>
    </div>
  );
}
