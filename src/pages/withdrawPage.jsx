// ─── WithdrawPage ─────────────────────────────────────────────────────────────
// Paste ini sebagai pengganti komponen WithdrawPage di DashboardStreamer.jsx

import { CheckCircle2, Clock, XCircle, ArrowRight, CreditCard, Smartphone, Wallet, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const fetchProfile     = async () => (await axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })).data;
const postWithdraw     = async (d) => (await axios.post(`${BASE_URL}/api/midtrans/withdraw`, d, { headers: authHeader() })).data;
const fetchWDHistory   = async ({ page = 1 } = {}) =>
  (await axios.get(`${BASE_URL}/api/midtrans/withdraw/history?page=${page}&limit=10`, { headers: authHeader() })).data;

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Menunggu',
    icon: <Clock size={14} />,
    className: 'bg-amber-50 text-amber-600 border border-amber-200',
    dot: 'bg-amber-400',
  },
  COMPLETED: {
    label: 'Berhasil',
    icon: <CheckCircle2 size={14} />,
    className: 'bg-green-50 text-green-600 border border-green-200',
    dot: 'bg-green-500',
  },
  FAILED: {
    label: 'Ditolak',
    icon: <XCircle size={14} />,
    className: 'bg-red-50 text-red-500 border border-red-200',
    dot: 'bg-red-400',
  },
};

export const WithdrawPage = () => {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState('BANK');
  const [formData, setFormData] = useState({ amount: '', channelCode: 'BCA', accountNumber: '', accountName: '' });
  const [historyPage, setHistoryPage] = useState(1);

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile, refetchInterval: 30000 });
  const balance = profileData?.User?.walletBalance || profileData?.walletBalance || 0;

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['withdrawHistory', historyPage],
    queryFn: () => fetchWDHistory({ page: historyPage }),
    keepPreviousData: true,
    refetchInterval: 30000,
  });

  const withdrawals = historyData?.withdrawals || [];
  const pagination  = historyData?.pagination || {};

  const withdrawMutation = useMutation({
    mutationFn: postWithdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawHistory'] });
      setFormData({ amount: '', channelCode: method === 'BANK' ? 'BCA' : method, accountNumber: '', accountName: '' });
    },
    onError: (err) => alert(err.response?.data?.message || 'Terjadi kesalahan'),
  });

  // Hitung stats ringkas
  const totalPending   = withdrawals.filter(w => w.status === 'PENDING').length;
  const totalCompleted = withdrawals.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + w.amount, 0);
  const totalFailed    = withdrawals.filter(w => w.status === 'FAILED').length;

  return (
    <motion.div className="w-full mx-auto space-y-6 pb-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

      {/* ── Balance Card ── */}
      <div className="bg-indigo-600 py-7 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Wallet size={120} /></div>
        <div className="relative z-10">
          <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
          <h1 className="text-3xl font-black">Rp {parseFloat(balance).toLocaleString('id-ID')}</h1>
          <p className="text-indigo-200 text-xs font-medium mt-2">
            Penarikan diproses manual oleh admin dalam 1×24 jam hari kerja
          </p>
        </div>
        <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-[90%]' />
        <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[130px] w-[7%] rotate-25 opacity-[90%]' />
      </div>

      {/* ── Ringkasan Stats ── */}
      {withdrawals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Menunggu', value: totalPending, unit: 'request', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Berhasil Dicairkan', value: `Rp ${totalCompleted.toLocaleString('id-ID')}`, unit: '', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
            { label: 'Ditolak', value: totalFailed, unit: 'request', color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
              <p className={`font-black text-sm ${s.color}`}>{s.value} <span className="text-xs font-bold">{s.unit}</span></p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Form Penarikan ── */}
      <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <CreditCard className="text-indigo-600" size={20} /> Ajukan Penarikan Dana
        </h2>

        {/* Method selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
          {[
            { id: 'BANK',  label: 'Transfer Bank',  icon: <CreditCard size={18} /> },
            { id: 'DANA',  label: 'E-Wallet DANA',  icon: <Smartphone size={18} /> },
            { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18} /> },
          ].map(m => (
            <button key={m.id}
              onClick={() => { setMethod(m.id); setFormData({ ...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id }); }}
              className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all font-black text-sm ${method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {method === 'BANK' && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Bank</label>
                <select
                  className="w-full px-5 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
                  value={formData.channelCode}
                  onChange={(e) => setFormData({ ...formData, channelCode: e.target.value })}>
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="MANDIRI">Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                </select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {method === 'BANK' ? 'Nomor Rekening' : 'Nomor Handphone'}
              </label>
              <input
                value={formData.accountNumber}
                placeholder={method === 'BANK' ? '0000000000000' : '08xx-xxxx-xxxx'}
                className="w-full px-5 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap Pemilik Akun</label>
            <input
              value={formData.accountName}
              placeholder="Sesuaikan dengan Buku Tabungan / Nama di App"
              className="w-full px-5 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal yang Ingin Ditarik (IDR)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-white text-sm">Rp</span>
              <input
                type="number"
                value={formData.amount}
                placeholder="0"
                className="w-full px-6 py-4 pl-14 bg-slate-900 text-white rounded-xl font-bold text-xl outline-none focus:ring-4 ring-indigo-100 transition-all"
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold italic">
              *Biaya admin Rp 5.000 akan dipotong dari saldo. Total dipotong: Rp {formData.amount ? (parseFloat(formData.amount) + 5000).toLocaleString('id-ID') : '5.000'}
            </p>
          </div>

          <button
            onClick={() => {
              if (!formData.amount || parseFloat(formData.amount) <= 0) return alert('Masukkan nominal yang valid');
              if (parseFloat(formData.amount) < 10000) return alert('Minimal penarikan adalah Rp 10.000');
              if (parseFloat(formData.amount) + 5000 > parseFloat(balance)) return alert('Saldo tidak mencukupi (termasuk biaya admin Rp 5.000)');
              if (!formData.accountNumber || !formData.accountName) return alert('Lengkapi data rekening terlebih dahulu');
              withdrawMutation.mutate({ ...formData, paymentMethod: method });
            }}
            disabled={withdrawMutation.isPending}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70">
            {withdrawMutation.isPending
              ? <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
              : <><ArrowRight size={18} /> Ajukan Penarikan Dana</>
            }
          </button>

          {withdrawMutation.isSuccess && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="font-black text-green-700 text-sm">Pengajuan berhasil dikirim!</p>
                <p className="text-[11px] text-green-600 font-medium">Admin akan memproses dalam 1×24 jam hari kerja. Pantau status di riwayat di bawah.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Riwayat Withdrawal ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="font-black text-slate-800">Riwayat Penarikan</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {pagination.total || 0} total request
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold">Auto refresh 30s</span>
            <button onClick={() => refetchHistory()} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
              <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {historyLoading
          ? (
            <div className="flex items-center justify-center py-16 text-slate-400 font-bold gap-3">
              <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              Memuat riwayat...
            </div>
          )
          : withdrawals.length === 0
            ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-4xl mb-3">💸</p>
                <p className="font-black text-slate-500">Belum ada riwayat penarikan</p>
                <p className="text-sm font-medium mt-1">Ajukan penarikan pertamamu di atas</p>
              </div>
            )
            : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-50">
                  {withdrawals.map((wd) => {
                    const cfg = STATUS_CONFIG[wd.status] || STATUS_CONFIG.PENDING;
                    return (
                      <div key={wd._id} className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-slate-800 text-sm">
                              Rp {Number(wd.amount).toLocaleString('id-ID')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {wd.channelCode} • {wd.accountNumber}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.className}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400 font-medium">{wd.accountName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{formatDate(wd.createdAt)}</p>
                        </div>
                        {wd.status === 'FAILED' && wd.note && (
                          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                            <p className="text-[11px] text-red-600 font-bold">Alasan: {wd.note}</p>
                          </div>
                        )}
                        {wd.status === 'PENDING' && (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                            <p className="text-[11px] text-amber-600 font-bold">Menunggu diproses admin</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-6 py-4">Nominal</th>
                        <th className="px-6 py-4">Metode</th>
                        <th className="px-6 py-4">Rekening / No. HP</th>
                        <th className="px-6 py-4">Nama</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4">Waktu Pengajuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {withdrawals.map((wd) => {
                        const cfg = STATUS_CONFIG[wd.status] || STATUS_CONFIG.PENDING;
                        return (
                          <tr key={wd._id} className="hover:bg-slate-50/70 transition-all">
                            <td className="px-6 py-5">
                              <p className="font-black text-slate-800">Rp {Number(wd.amount).toLocaleString('id-ID')}</p>
                              <p className="text-[10px] text-slate-400 font-medium">+Rp 5.000 fee</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-600 text-sm">{wd.paymentMethod || 'BANK'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{wd.channelCode}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-600 text-sm font-mono">{wd.accountNumber}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-600 text-sm">{wd.accountName}</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="inline-flex flex-col items-center gap-1.5">
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.className}`}>
                                  {cfg.icon} {cfg.label}
                                </span>
                                {wd.status === 'PENDING' && (
                                  <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
                                    <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                                    Menunggu admin
                                  </span>
                                )}
                                {wd.status === 'FAILED' && wd.note && (
                                  <span className="text-[9px] text-red-400 font-medium max-w-[120px] text-center leading-tight">
                                    {wd.note}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{formatDate(wd.createdAt)}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      ← Sebelumnya
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      Halaman <span className="text-indigo-600 font-black">{historyPage}</span> dari {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={historyPage === pagination.totalPages}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      Berikutnya →
                    </button>
                  </div>
                )}
              </>
            )
        }
      </div>
    </motion.div>
  );
};