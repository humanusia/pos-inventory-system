// ============================================================================
// useUsers — User Management (Admin only)
// ============================================================================
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, UserFormData, UserRole } from '@/types';
import toast from 'react-hot-toast';

export function useUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (err) {
      toast.error('Gagal memuat pengguna');
    } else {
      setUsers(data as Profile[]);
    }

    setLoading(false);
  }, []);

  const createUser = useCallback(async (
    form: UserFormData
  ): Promise<{ success: boolean; userId?: string; error?: string }> => {
    // Step 1: Create auth user (auto-confirm — no email)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          role: form.role,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authErr) {
      const msg = authErr.message.includes('email rate limit')
        ? '⚠️ Batas email Supabase tercapai! Buka Auth → Settings → matikan "Enable email confirmations"'
        : authErr.message.includes('already registered')
          ? 'Email sudah terdaftar'
          : authErr.message;
      toast.error(msg);
      return { success: false, error: msg };
    }

    // If signUp returned a user but it's not auto-confirmed, the profile insert
    // will still work because RLS policies are permissive for the creating admin.
    // The created user can be manually confirmed later in Auth dashboard.
    if (!authData.user) {
      toast.error('Gagal membuat akun — coba lagi');
      return { success: false, error: 'No user returned' };
    }

    // Step 2: Create profile (works even if user unconfirmed)
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: form.name,
        email: form.email,
        role: form.role as UserRole,
        pin_code: form.pin_code,
        is_active: true,
      });

    if (profileErr) {
      toast.error('Gagal membuat profil: ' + profileErr.message);
      return { success: false, error: profileErr.message };
    }

    toast.success(`Pengguna ${form.name} berhasil dibuat`);
    await fetchUsers();
    return { success: true, userId: authData.user.id };
  }, [fetchUsers]);

  const toggleUserActive = useCallback(async (
    userId: string,
    isActive: boolean
  ): Promise<boolean> => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (err) {
      toast.error('Gagal mengubah status pengguna');
      return false;
    }

    toast.success(isActive ? 'Pengguna diaktifkan' : 'Pengguna dinonaktifkan');
    await fetchUsers();
    return true;
  }, [fetchUsers]);

  const updatePin = useCallback(async (
    userId: string,
    newPin: string
  ): Promise<boolean> => {
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('PIN harus 4 digit angka');
      return false;
    }

    const { error: err } = await supabase
      .from('profiles')
      .update({ pin_code: newPin })
      .eq('id', userId);

    if (err) {
      toast.error('Gagal mengubah PIN');
      return false;
    }

    toast.success('PIN berhasil diubah');
    return true;
  }, []);

  // Get active cashiers for PIN switcher
  const getActiveCashiers = useCallback(async (): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'CASHIER')
      .eq('is_active', true)
      .order('name');

    return (data as Profile[]) || [];
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    toggleUserActive,
    updatePin,
    getActiveCashiers,
  };
}
