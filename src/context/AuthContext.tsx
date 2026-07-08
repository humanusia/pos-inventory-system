// ============================================================================
// AuthContext — Authentication, RBAC, and User Session Management
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type {
  Profile,
  UserRole,
  LoginCredentials,
  PinLoginCredentials,
} from '@/types';

// ── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isCashier: boolean;
  isLogistics: boolean;

  login: (creds: LoginCredentials) => Promise<void>;
  loginWithPin: (pin: PinLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (pin: PinLoginCredentials) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ── Fetch profile by user ID ───────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (err || !data) {
      console.error('Failed to fetch profile:', err?.message);
      return null;
    }

    return data as Profile;
  }, []);

  // ── Refresh current profile ────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }

    const p = await fetchProfile(user.id);
    if (p) {
      setProfile(p);
    } else {
      // Session exists but no profile — sign out
      await supabase.auth.signOut();
      setProfile(null);
    }
  }, [fetchProfile]);

  // ── Role checks ────────────────────────────────────────────────────────
  const isAdmin = profile?.role === 'ADMIN';
  const isCashier = profile?.role === 'CASHIER';
  const isLogistics = profile?.role === 'LOGISTICS';

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!profile) return false;
      return roles.includes(profile.role);
    },
    [profile]
  );

  // ── Email + Password Login ─────────────────────────────────────────────
  const login = useCallback(
    async ({ email, password }: LoginCredentials) => {
      setLoading(true);
      setError(null);

      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr) {
          const msg = authErr.message === 'Invalid login credentials'
            ? 'Email atau password salah'
            : authErr.message;
          setError(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        if (!authData.user) {
          setError('Login gagal — user tidak ditemukan');
          toast.error('Login gagal');
          setLoading(false);
          return;
        }

        const p = await fetchProfile(authData.user.id);

        if (!p) {
          await supabase.auth.signOut();
          setError('Akun tidak ditemukan atau tidak aktif');
          toast.error('Akun tidak ditemukan atau tidak aktif');
          setLoading(false);
          return;
        }

        setProfile(p);
        toast.success(`Selamat datang, ${p.name}!`);

        // Navigate based on role
        const from = (location.state as { from?: string } | null)?.from;
        if (from) {
          navigate(from, { replace: true });
        } else {
          navigateToRoleHome(p.role, navigate);
        }
      } catch (err) {
        const msg = 'Terjadi kesalahan saat login';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile, navigate, location]
  );

  // ── PIN Quick Login ────────────────────────────────────────────────────
  const loginWithPin = useCallback(
    async ({ user_id, pin_code }: PinLoginCredentials) => {
      setLoading(true);
      setError(null);

      try {
        // Verify PIN locally against profiles table
        const { data: p, error: err } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user_id)
          .eq('pin_code', pin_code)
          .eq('is_active', true)
          .single();

        if (err || !p) {
          setError('PIN salah atau akun tidak aktif');
          toast.error('PIN salah atau akun tidak aktif');
          setLoading(false);
          return;
        }

        setProfile(p as Profile);

        navigateToRoleHome((p as Profile).role, navigate);
      } catch {
        setError('Terjadi kesalahan saat login');
        toast.error('Terjadi kesalahan saat login');
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  // ── Switch User (from PIN pad) — keeps auth session, switches profile ──
  const switchUser = useCallback(
    async ({ user_id, pin_code }: PinLoginCredentials) => {
      // Only ADMIN or during shift change
      const { data: p, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .eq('pin_code', pin_code)
        .eq('is_active', true)
        .single();

      if (err || !p) {
        toast.error('PIN salah atau akun tidak aktif');
        return;
      }

      setProfile(p as Profile);
      toast.success(`Beralih ke ${(p as Profile).name}`);
      navigateToRoleHome((p as Profile).role, navigate);
    },
    [navigate]
  );

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // ── Session Restoration on Mount ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | null = null;

    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && !cancelled) {
        const p = await fetchProfile(session.user.id);
        if (p) {
          setProfile(p);
          // On initial load, if at "/" or "/login", redirect to role home
          const path = window.location.pathname;
          if (path === '/' || path === '/login') {
            navigateToRoleHome(p.role, navigate);
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    restoreSession();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !cancelled) {
        const p = await fetchProfile(session.user.id);
        if (p) setProfile(p);
      } else if (event === 'SIGNED_OUT' && !cancelled) {
        setProfile(null);
        navigate('/login', { replace: true });
      }
    });
    sub = data.subscription;

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, [fetchProfile, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      loading,
      error,
      isAdmin,
      isCashier,
      isLogistics,
      login,
      loginWithPin,
      logout,
      switchUser,
      hasRole,
      refreshProfile,
    }),
    [
      profile, loading, error,
      isAdmin, isCashier, isLogistics,
      login, loginWithPin, logout, switchUser,
      hasRole, refreshProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}

// ── Route Guard Component ─────────────────────────────────────────────────────

interface RouteGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export function RouteGuard({
  allowedRoles,
  children,
  fallbackPath = '/login',
}: RouteGuardProps) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      navigate(fallbackPath, {
        state: { from: location.pathname },
        replace: true,
      });
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      toast.error('Anda tidak memiliki akses ke halaman ini');
      navigateToRoleHome(profile.role, navigate);
    }
  }, [profile, loading, allowedRoles, fallbackPath, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}

// ── Navigation Helper ─────────────────────────────────────────────────────────

function navigateToRoleHome(role: UserRole, navigate: ReturnType<typeof useNavigate>) {
  switch (role) {
    case 'CASHIER':
      navigate('/pos', { replace: true });
      break;
    case 'LOGISTICS':
      navigate('/inventory', { replace: true });
      break;
    case 'ADMIN':
      navigate('/admin', { replace: true });
      break;
    default:
      navigate('/login', { replace: true });
  }
}

export { navigateToRoleHome };
