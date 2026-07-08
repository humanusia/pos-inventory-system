// ============================================================================
// useMembers — Membership & Loyalty Poin Management
// ============================================================================
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member, MemberFormData, PointTransaction } from '@/types';
import toast from 'react-hot-toast';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async (search = '') => {
    setLoading(true);

    let query = supabase
      .from('members')
      .select('*, creator:profiles!members_created_by_fkey(name)')
      .order('name');

    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Gagal memuat data member');
    } else {
      setMembers(
        (data as unknown[]).map((m) => ({
          ...(m as Member),
          creator_name:
            (m as { creator?: { name: string } }).creator?.name ?? 'System',
        }))
      );
    }

    setLoading(false);
  }, []);

  const createMember = useCallback(async (
    form: MemberFormData,
    createdBy: string
  ): Promise<Member | null> => {
    const { data, error } = await supabase
      .from('members')
      .insert({
        name: form.name,
        phone: form.phone || null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique')) {
        toast.error('Nomor telepon sudah terdaftar');
      } else {
        toast.error('Gagal mendaftarkan member: ' + error.message);
      }
      return null;
    }

    toast.success(`Member "${form.name}" berhasil didaftarkan`);
    await fetchMembers();
    return data as Member;
  }, [fetchMembers]);

  const toggleMemberActive = useCallback(async (
    memberId: string,
    isActive: boolean
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('members')
      .update({ is_active: isActive })
      .eq('id', memberId);

    if (error) {
      toast.error('Gagal mengubah status member');
      return false;
    }

    toast.success(isActive ? 'Member diaktifkan' : 'Member dinonaktifkan');
    await fetchMembers();
    return true;
  }, [fetchMembers]);

  // ── Point Transactions ──────────────────────────────────────────────
  const fetchPointTransactions = useCallback(async (
    memberId: string
  ): Promise<PointTransaction[]> => {
    const { data, error } = await supabase
      .from('point_transactions')
      .select(`
        *,
        member:members!point_transactions_member_id_fkey(name)
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Gagal memuat riwayat poin');
      return [];
    }

    return (data as unknown[]).map((pt) => ({
      ...(pt as PointTransaction),
      member_name:
        (pt as { member?: { name: string } }).member?.name ?? 'Unknown',
    }));
  }, []);

  // ── Redeem Points ──────────────────────────────────────────────────
  const redeemPoints = useCallback(async (
    memberId: string,
    points: number,
    createdBy: string
  ): Promise<{ success: boolean; remaining?: number; error?: string }> => {
    const { data, error } = await supabase.rpc('redeem_member_points', {
      p_member_id: memberId,
      p_points_to_redeem: points,
      p_created_by: createdBy,
    });

    if (error) {
      toast.error('Gagal redeem poin: ' + error.message);
      return { success: false, error: error.message };
    }

    const result = data as {
      success: boolean;
      member_name?: string;
      points_redeemed?: number;
      remaining_points?: number;
      error?: string;
    };

    if (!result.success) {
      toast.error(result.error || 'Gagal redeem poin');
      return { success: false, error: result.error };
    }

    toast.success(`${result.points_redeemed} poin berhasil ditukar! Sisa: ${result.remaining_points}`);
    await fetchMembers();
    return { success: true, remaining: result.remaining_points };
  }, [fetchMembers]);

  // ── Quick lookup for POS ───────────────────────────────────────────
  const searchMembers = useCallback(async (
    q: string
  ): Promise<Member[]> => {
    if (!q.trim()) return [];

    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .order('name')
      .limit(10);

    return (data as Member[]) || [];
  }, []);

  return {
    members,
    loading,
    fetchMembers,
    createMember,
    toggleMemberActive,
    fetchPointTransactions,
    redeemPoints,
    searchMembers,
  };
}
