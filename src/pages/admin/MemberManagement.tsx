// ============================================================================
// MemberManagement — Admin: CRUD members + view point history
// ============================================================================
import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Gift,
  Star,
  TrendingDown,
  TrendingUp,
  ArrowUp,
  Phone,
  Clock,
  X,
} from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/context/AuthContext';
import type { Member, PointTransaction, MemberFormData } from '@/types';
import { POINT_TYPE_LABELS } from '@/types';
import { formatDateTime, cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM: MemberFormData = { name: '', phone: '' };

export default function MemberManagement() {
  const { profile } = useAuth();
  const {
    members,
    loading,
    fetchMembers,
    createMember,
    toggleMemberActive,
    fetchPointTransactions,
    redeemPoints,
  } = useMembers();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MemberFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Point history drawer
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Redeem modal
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemPoints_, setRedeemPoints] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nama member wajib diisi');
      return;
    }
    if (!profile) return;

    setSaving(true);
    await createMember(form, profile.id);
    setSaving(false);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const openHistory = useCallback(async (member: Member) => {
    setSelectedMember(member);
    setLoadingHistory(true);
    const history = await fetchPointTransactions(member.id);
    setPointHistory(history);
    setLoadingHistory(false);
  }, [fetchPointTransactions]);

  const handleRedeem = async () => {
    if (!selectedMember || !profile) return;
    const pts = parseInt(redeemPoints_) || 0;
    if (pts <= 0) {
      toast.error('Jumlah poin tidak valid');
      return;
    }
    if (pts > selectedMember.total_points) {
      toast.error('Poin member tidak cukup');
      return;
    }

    setRedeeming(true);
    const result = await redeemPoints(selectedMember.id, pts, profile.id);
    setRedeeming(false);

    if (result.success) {
      setShowRedeem(false);
      setRedeemPoints('');
      // Refresh member data
      setSelectedMember((prev) =>
        prev ? { ...prev, total_points: result.remaining ?? prev.total_points } : null
      );
      fetchMembers();
      // Refresh history
      const history = await fetchPointTransactions(selectedMember.id);
      setPointHistory(history);
    }
  };

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Membership & Poin</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola member dan riwayat loyalitas
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary gap-2">
          <UserPlus size={18} />
          Tambah Member
        </button>
      </div>

      {/* ── Create Form ──────────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4 animate-scale dark:bg-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Daftarkan Member Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama member"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor HP (opsional)
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="0812xxxxxxxx"
                className="input font-mono"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-success gap-2">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              Daftarkan
            </button>
          </div>
        </form>
      )}

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari member..."
          className="input pl-9 text-sm"
        />
      </div>

      {/* ── Member Grid ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Users size={48} strokeWidth={1.5} className="mx-auto mb-3" />
          <p className="font-medium">Belum ada member</p>
          <p className="text-sm">Klik "Tambah Member" untuk mendaftarkan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className={cn(
                'card p-4 hover:shadow-md transition-all dark:bg-slate-800',
                !member.is_active && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate">
                      {member.name}
                    </p>
                    {member.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={10} />
                        {member.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
                    <Star size={16} fill="currentColor" />
                    <span className="text-lg font-extrabold">{member.total_points}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">poin</p>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => openHistory(member)}
                  className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Riwayat Poin
                </button>
                <button
                  onClick={() => {
                    setSelectedMember(member);
                    setRedeemPoints('');
                    setShowRedeem(true);
                  }}
                  disabled={member.total_points <= 0}
                  className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 hover:bg-danger-100 dark:hover:bg-danger-900/50 transition-colors disabled:opacity-30"
                >
                  Tukar
                </button>
                <button
                  onClick={() => toggleMemberActive(member.id, !member.is_active)}
                  className={cn(
                    'px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                    member.is_active
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-danger-50 hover:text-danger-600'
                      : 'bg-success-50 text-success-600 hover:bg-success-100'
                  )}
                >
                  {member.is_active ? '✕' : '✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Point History Drawer ──────────────────────────────────────── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedMember(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl animate-slide-up overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {selectedMember.name}
                </h3>
                <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
                  <Star size={16} fill="currentColor" />
                  <span className="font-extrabold">{selectedMember.total_points} poin</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Redeem button */}
            {selectedMember.total_points > 0 && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setRedeemPoints('');
                    setShowRedeem(true);
                  }}
                  className="btn-danger w-full gap-2"
                >
                  <Gift size={16} />
                  Tukar {selectedMember.total_points} Poin
                </button>
              </div>
            )}

            {/* History list */}
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Clock size={14} />
                Riwayat Transaksi Poin
              </h4>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pointHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada transaksi poin</p>
              ) : (
                <div className="space-y-2">
                  {pointHistory.map((pt) => (
                    <div
                      key={pt.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {pt.type === 'EARN' ? (
                            <TrendingUp size={14} className="text-success-500 flex-shrink-0" />
                          ) : (
                            <TrendingDown size={14} className="text-danger-500 flex-shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {POINT_TYPE_LABELS[pt.type]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {pt.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateTime(pt.created_at)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-extrabold flex-shrink-0 ml-2',
                          pt.type === 'EARN'
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400'
                        )}
                      >
                        {pt.type === 'EARN' ? '+' : '−'}
                        {pt.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Redeem Modal ──────────────────────────────────────────────── */}
      {showRedeem && selectedMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm animate-scale p-6 space-y-4">
            <div className="text-center">
              <Gift size={40} className="mx-auto text-brand-500 mb-2" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Tukar Poin</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedMember.name} • Saldo: {selectedMember.total_points} poin
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jumlah Poin Ditukar
              </label>
              <input
                type="number"
                value={redeemPoints_}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder={`Max: ${selectedMember.total_points}`}
                className="input text-lg font-bold text-center"
                min={1}
                max={selectedMember.total_points}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRedeem(false); setRedeemPoints(''); }}
                className="flex-1 btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 btn-danger gap-2"
              >
                {redeeming ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp size={16} />
                )}
                Tukar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
