import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  ImageIcon,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Timer,
  Trash2,
  TrendingUp,
  User,
  Video,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../components/sidebar';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ─── API ──────────────────────────────────────────────────────────────────────

const fetchProfile    = async () => (await axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })).data;
const fetchHistory    = async ({ page = 1, limit = 50, status = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return (await axios.get(`${BASE_URL}/api/donations/history?${params}`, { headers: authHeader() })).data;
};
const fetchStats      = async () => (await axios.get(`${BASE_URL}/api/donations/stats`, { headers: authHeader() })).data;
const saveSettings    = async (s) => (await axios.put(`${BASE_URL}/api/overlay/settings`, s, { headers: authHeader() })).data;
const updateProfile   = async (d) => (await axios.put(`${BASE_URL}/api/auth/profile`, d, { headers: authHeader() })).data;
const changePassword  = async (d) => (await axios.put(`${BASE_URL}/api/auth/change-password`, d, { headers: authHeader() })).data;
const postWithdraw    = async (d) => (await axios.post(`${BASE_URL}/api/midtrans/withdraw`, d, { headers: authHeader() })).data;
const fetchAdminWDs   = async () => (await axios.get(`${BASE_URL}/api/midtrans/admin/withdrawals`, { headers: authHeader() })).data;
const updateWDStatus  = async ({ id, status }) => (await axios.put(`${BASE_URL}/api/midtrans/admin/withdrawals/${id}`, { status }, { headers: authHeader() })).data;

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  minDonate: 10000,
  maxDonate: 5000000,
  theme: 'modern',
  primaryColor: '#6366f1',
  textColor: '#ffffff',
  animation: 'bounce',
  maxWidth: 280,
  overlayPosition: 'bottom-right',
  baseDuration: 5,
  extraPerAmount: 10000,
  extraDuration: 1,
  durationTiers: [
    { minAmount: 0,     maxAmount: 4999,  duration: 5  },
    { minAmount: 5000,  maxAmount: 49999, duration: 10 },
    { minAmount: 50000, maxAmount: null,  duration: 20 },
  ],
  mediaTriggers: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDuration = (settings, amount) => {
  const tiers = settings.durationTiers || [];
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
    for (const t of sorted) {
      if (amount >= t.minAmount && (t.maxAmount === null || amount <= t.maxAmount)) {
        return t.duration;
      }
    }
  }
  const extras = Math.floor(amount / (settings.extraPerAmount || 10000));
  return (settings.baseDuration || 5) + extras * (settings.extraDuration || 1);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── WithdrawPage ─────────────────────────────────────────────────────────────

const WithdrawPage = () => {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState('BANK');
  const [formData, setFormData] = useState({ amount: '', channelCode: 'BCA', accountNumber: '', accountName: '' });

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile, refetchInterval: 30000 });
  const balance = profileData?.User?.walletBalance || profileData?.walletBalance || 0;

  const withdrawMutation = useMutation({
    mutationFn: postWithdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Permintaan penarikan berhasil dikirim!');
      setFormData({ amount: '', channelCode: method === 'BANK' ? 'BCA' : method, accountNumber: '', accountName: '' });
    },
    onError: (err) => alert(err.response?.data?.message || 'Terjadi kesalahan'),
  });

  return (
    <div className="w-full mx-auto space-y-6 pb-6">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Wallet size={120} /></div>
        <div className="relative z-10">
          <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
          <h1 className="text-3xl font-black italic">Rp {parseFloat(balance).toLocaleString('id-ID')}</h1>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <CreditCard className="text-indigo-600" /> Konfigurasi Pencairan
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { id: 'BANK',  label: 'Transfer Bank',  icon: <CreditCard size={18} /> },
            { id: 'DANA',  label: 'E-Wallet DANA',  icon: <Smartphone size={18} /> },
            { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18} /> },
          ].map(m => (
            <button key={m.id}
              onClick={() => { setMethod(m.id); setFormData({ ...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id }); }}
              className={`cursor-pointer active:scale-[0.97] hover:bg-blue-50 flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all font-black text-sm ${method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {method === 'BANK' && (
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bank</label>
                <select className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                  onChange={(e) => setFormData({ ...formData, channelCode: e.target.value })}>
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="MANDIRI">Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                </select>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {method === 'BANK' ? 'Nomor Rekening' : 'Nomor Handphone'}
              </label>
              <input value={formData.accountNumber} placeholder={method === 'BANK' ? '000-000-000' : '0812xxxx'}
                className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Pemilik Akun</label>
            <input value={formData.accountName} placeholder="Sesuaikan dengan Buku Tabungan / Nama di App"
              className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal yang Ingin Ditarik (IDR)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-white">Rp</span>
              <input type="number" value={formData.amount} placeholder="Contoh: 100000"
                className="w-full p-6 pl-14 bg-slate-900 text-white rounded-3xl font-black text-xl outline-none focus:ring-4 ring-indigo-100 transition-all"
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold ml-1 italic">*Biaya admin penarikan Rp 5.000 akan memotong saldo utama.</p>
          </div>
          <button
            onClick={() => {
              if (parseFloat(formData.amount) > parseFloat(balance)) return alert('Saldo tidak mencukupi!');
              if (parseFloat(formData.amount) < 10000) return alert('Minimal penarikan adalah Rp 10.000');
              withdrawMutation.mutate({ ...formData, paymentMethod: method });
            }}
            disabled={withdrawMutation.isPending}
            className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-4 disabled:opacity-70">
            {withdrawMutation.isPending
              ? <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Sedang Memproses...</>
              : <><ArrowRight size={20} /> Ajukan Pencairan Dana</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AdminWithdrawalPage ──────────────────────────────────────────────────────

const AdminWithdrawalPage = () => {
  const queryClient = useQueryClient();
  const { data: withdrawals = [], isLoading } = useQuery({ queryKey: ['adminWithdrawals'], queryFn: fetchAdminWDs, refetchInterval: 30000 });
  const updateMutation = useMutation({
    mutationFn: updateWDStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }),
    onError: (err) => alert(err.response?.data?.message || 'Gagal update status'),
  });

  return (
    <div className="space-y-6">
      <div className="bg-white w-full rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Semua Request Penarikan</p>
          <span className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Super Admin Only</span>
        </div>
        {isLoading
          ? <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3"><div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />Memuat data...</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    {['Streamer','Jumlah','Metode','Nama','Status','Aksi'].map(h => <th key={h} className="px-8 py-6">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {withdrawals.length === 0
                    ? <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-bold">Tidak ada request penarikan</td></tr>
                    : withdrawals.map(wd => (
                      <tr key={wd._id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-5 font-black text-slate-700">@{wd.userId?.username || '-'}<p className="text-[10px] text-slate-400 font-medium">{wd.userId?.email}</p></td>
                        <td className="px-8 py-5 text-indigo-600 font-black">Rp {Number(wd.amount).toLocaleString('id-ID')}</td>
                        <td className="px-8 py-5 font-bold text-slate-600">{wd.paymentMethod}</td>
                        <td className="px-8 py-5 font-bold text-slate-600">{wd.accountName}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${wd.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : wd.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                            {wd.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {wd.status === 'PENDING' && (
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => updateMutation.mutate({ id: wd._id, status: 'COMPLETED' })} disabled={updateMutation.isPending} className="cursor-pointer active:scale-[0.97] hover:brightness-95 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black hover:bg-green-700 transition-all disabled:opacity-50">Approve</button>
                              <button onClick={() => updateMutation.mutate({ id: wd._id, status: 'FAILED' })} disabled={updateMutation.isPending} className="cursor-pointer active:scale-[0.97] hover:brightness-95 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black hover:bg-red-700 transition-all disabled:opacity-50">Tolak</button>
                            </div>
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
};

// ─── DurationTiersEditor ──────────────────────────────────────────────────────

const DurationTiersEditor = ({ tiers, onChange }) => {
  const addTier    = () => onChange([...tiers, { minAmount: 0, maxAmount: null, duration: 10 }]);
  const removeTier = (i) => onChange(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i, key, val) => onChange(tiers.map((t, idx) => idx === i ? { ...t, [key]: val === '' ? null : Number(val) } : t));

  return (
    <div className="space-y-3">
      {tiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min (Rp)</label>
              <input type="number" value={tier.minAmount} onChange={e => updateTier(i, 'minAmount', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max (Rp, kosong=∞)</label>
              <input type="number" value={tier.maxAmount ?? ''} placeholder="∞" onChange={e => updateTier(i, 'maxAmount', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Durasi (detik)</label>
              <input type="number" value={tier.duration} onChange={e => updateTier(i, 'duration', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <button onClick={() => removeTier(i)} className="cursor-pointer active:scale-[0.97] text-red-400 hover:text-red-600 transition-colors flex-shrink-0 p-1">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button onClick={addTier}
        className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Ketentuan Durasi
      </button>
    </div>
  );
};

// ─── MediaTriggersEditor ──────────────────────────────────────────────────────

const MediaTriggersEditor = ({ triggers, onChange }) => {
  const add    = () => onChange([...triggers, { minAmount: 50000, mediaType: 'both', label: '' }]);
  const remove = (i) => onChange(triggers.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(triggers.map((t, idx) => idx === i ? { ...t, [key]: val } : t));

  const mediaTypeOptions = [
    { value: 'image', icon: <ImageIcon size={13} />, label: 'Gambar', desc: 'jpg, gif, png, webp' },
    { value: 'video', icon: <Video size={13} />, label: 'Video', desc: 'mp4, webm, mov' },
    {
      value: 'both',
      icon: <span className="flex items-center gap-0.5"><ImageIcon size={11} /><span className="text-[8px] font-black opacity-60">+</span><Video size={11} /></span>,
      label: 'Keduanya',
      desc: 'gambar & video',
    },
  ];

  return (
    <div className="space-y-4">
      {triggers.length === 0 && (
        <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 px-5 py-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <ImageIcon size={18} className="text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-500">Belum ada ketentuan media</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
            Tambahkan agar donor bisa menyertakan<br />gambar atau video saat donasi mencapai nominal tertentu.
          </p>
        </div>
      )}
      {triggers.map((t, i) => (
        <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {t.mediaType === 'video' ? <Video size={15} className="text-purple-500" />
                : t.mediaType === 'image' ? <ImageIcon size={15} className="text-indigo-500" />
                : <span className="flex gap-0.5 items-center"><ImageIcon size={13} className="text-indigo-500" /><Video size={13} className="text-purple-500" /></span>}
              <span className="font-black text-slate-700 text-sm">{t.label || `Media Alert ${i + 1}`}</span>
              {t.minAmount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">
                  ≥ Rp {Number(t.minAmount).toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <button onClick={() => remove(i)} className="cursor-pointer active:scale-[0.97] text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 size={15} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Label <span className="normal-case font-medium text-slate-300">(opsional)</span></label>
              <input value={t.label} placeholder="contoh: Sultan Alert, Fan Art Alert" onChange={e => update(i, 'label', e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all" />
              <p className="text-[9px] text-slate-400 font-medium ml-0.5">Nama ini yang dilihat donor saat donasi</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nominal Minimum (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                <input type="number" value={t.minAmount} onChange={e => update(i, 'minAmount', Number(e.target.value))}
                  className="w-full p-3 pl-9 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all" />
              </div>
              <p className="text-[9px] text-slate-400 font-medium ml-0.5">Input media muncul saat donasi ≥ nominal ini</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipe Media yang Diizinkan Donor</label>
            <div className="grid grid-cols-3 gap-2">
              {mediaTypeOptions.map(opt => (
                <button key={opt.value} onClick={() => update(i, 'mediaType', opt.value)}
                  className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 font-black text-xs transition-all ${t.mediaType === opt.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100' : 'border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-white'}`}>
                  <span className={t.mediaType === opt.value ? 'text-indigo-600' : 'text-slate-400'}>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span className={`text-[9px] font-medium ${t.mediaType === opt.value ? 'text-indigo-400' : 'text-slate-300'}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 px-4 py-3 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[9px] font-black">i</span>
            </div>
            <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
              Saat donor menginput nominal <strong>≥ Rp {Number(t.minAmount).toLocaleString('id-ID')}</strong>, akan muncul input{' '}
              <strong>{t.mediaType === 'image' ? 'link gambar' : t.mediaType === 'video' ? 'link video' : 'link gambar atau video'}</strong>{' '}
              di halaman donasi. Media yang dikirim donor akan tampil di overlay OBS kamu.
            </p>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Ketentuan Media Alert
      </button>
    </div>
  );
};

// ─── YouTubeLivePreview ───────────────────────────────────────────────────────

const YouTubeLivePreview = ({ settings, username }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [currentDonor, setCurrentDonor] = useState(null);
  const timerRef = useRef(null);
  const donorIdxRef = useRef(0);

  const donors = [
    { name: 'Budi Santoso', amount: 50000,  msg: 'Semangat terus ngodingnya bang!' },
    { name: 'Siti Rahayu',  amount: 150000, msg: 'Mantap kontennya, keep it up!'   },
    { name: 'Anonim',       amount: 10000,  msg: 'Good luck!'                       },
    { name: 'RizkyDev',     amount: 200000, msg: 'Dukung terus creator lokal!'      },
  ];

  const triggerDemo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const d = donors[donorIdxRef.current % donors.length];
    donorIdxRef.current++;
    setCurrentDonor(d);
    setShowAlert(false);
    setTimeout(() => { setAnimKey(k => k + 1); setShowAlert(true); }, 50);
    const dur = getDuration(settings, d.amount);
    timerRef.current = setTimeout(() => setShowAlert(false), dur * 1000 + 500);
  };

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const posMap = {
    'top-left':      { top: '14%', left: '2%' },
    'top-right':     { top: '14%', right: '2%' },
    'bottom-left':   { bottom: '18%', left: '2%' },
    'bottom-right':  { bottom: '18%', right: '2%' },
    'top-center':    { top: '14%', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '18%', left: '50%', transform: 'translateX(-50%)' },
  };

  const animVariants = {
    bounce:        { initial: { scale: 0.5, opacity: 0 }, animate: { scale: [0.5, 1.08, 1], opacity: 1, transition: { duration: 0.5 } }, exit: { scale: 0.8, opacity: 0, transition: { duration: 0.3 } } },
    'slide-left':  { initial: { x: -80, opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }, exit: { x: -60, opacity: 0, transition: { duration: 0.3 } } },
    'slide-right': { initial: { x: 80,  opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }, exit: { x:  60, opacity: 0, transition: { duration: 0.3 } } },
    fade:          { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0, y: -8, transition: { duration: 0.3 } } },
  };

  const anim  = animVariants[settings.animation] || animVariants.bounce;
  const pos   = posMap[settings.overlayPosition || 'bottom-right'];
  const bg    = settings.primaryColor || '#6366f1';
  const fg    = settings.textColor || '#ffffff';
  const maxW  = settings.maxWidth || 280;
  const theme = settings.theme || 'modern';
  const dur   = currentDonor ? getDuration(settings, currentDonor.amount) : 5;

  const renderAlert = () => {
    if (!currentDonor) return null;
    const inner = (
      <div>
        {theme === 'modern' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💜</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Donasi Masuk!</div>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>@{currentDonor.name} · Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
              <div style={{ fontSize: 9, opacity: 0.7, fontStyle: 'italic', marginTop: 2 }}>"{currentDonor.msg}"</div>
            </div>
          </div>
        )}
        {theme === 'classic' && (
          <div style={{ padding: '10px 14px', border: '2px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Donasi Masuk!</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 9, opacity: 0.6, fontStyle: 'italic', marginTop: 2 }}>"{currentDonor.msg}"</div>
          </div>
        )}
        {theme === 'minimal' && (
          <div style={{ padding: '8px 12px', borderLeft: '3px solid rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 9, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Donasi Masuk</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 9, opacity: 0.55, fontStyle: 'italic', marginTop: 1 }}>"{currentDonor.msg}"</div>
          </div>
        )}
      </div>
    );
    return (
      <div style={{ backgroundColor: theme === 'minimal' ? 'transparent' : bg, color: fg, maxWidth: `${maxW}px`, width: '100%', borderRadius: theme === 'modern' ? 14 : theme === 'classic' ? 4 : 0, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        {inner}
      </div>
    );
  };

  return (
    <div className="sticky top-12 space-y-3">
      <div className="relative overflow-hidden border-[10px] border-slate-800 rounded-2xl shadow-2xl" style={{ aspectRatio: '16/9', background: '#000' }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(155deg,#1a1a2e 0%,#0d0d1a 60%,#12121f 100%)' }}>
          <span style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.04)', letterSpacing: -3, userSelect: 'none' }}>LIVE</span>
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-2" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.65) 0%,transparent 100%)' }}>
          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[8px] font-black flex-shrink-0">YT</div>
          <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-wide">LIVE</span>
          <span className="text-white text-[9px] font-medium opacity-80 flex-1 truncate">Ngoding Bareng | Bikin Fitur Donasi dari 0</span>
          <span className="text-white text-[8px] opacity-50 flex-shrink-0">2.1K menonton</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-4" style={{ background: 'linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 100%)' }}>
          <div className="h-0.5 bg-white/20 rounded mb-2 relative"><div className="absolute left-0 top-0 h-full bg-red-600 rounded" style={{ width: '38%' }} /></div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs">⏸</span><span className="text-white/80 text-xs">🔊</span>
            <span className="text-white/60 text-[9px] font-mono ml-1">1:23:47</span>
            <div className="ml-auto flex gap-2 text-white/70 text-xs">⚙ ⛶</div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {showAlert && (
              <motion.div key={animKey} initial={anim.initial} animate={anim.animate} exit={anim.exit}
                style={{ position: 'absolute', ...pos, zIndex: 10 }}>
                {renderAlert()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute top-2 right-3"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse block" /></div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1 flex-wrap gap-1">
        <span>Lebar: <span className="text-indigo-600">{maxW}px</span></span>
        <span>Tema: <span className="text-indigo-600">{theme}</span></span>
        <span>Durasi demo: <span className="text-indigo-600">{currentDonor ? dur : '-'}s</span></span>
      </div>
      <button onClick={triggerDemo}
        className="w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-sm border-2 border-indigo-100 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Simulasi Donasi Masuk
      </button>
    </div>
  );
};

// ─── Token helpers ────────────────────────────────────────────────────────────

const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

// ─── HistoryPage ──────────────────────────────────────────────────────────────

const HistoryPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['donationHistory', page, statusFilter],
    queryFn: () => fetchHistory({ page, limit: 20, status: statusFilter }),
    keepPreviousData: true,
    refetchInterval: 15000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['donationStats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  const donations = data?.donations || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6 pb-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Semua Waktu',
            value: statsLoading ? '...' : `Rp ${Number(stats?.allTime?.total || 0).toLocaleString('id-ID')}`,
            sub: `${stats?.allTime?.count || 0} donasi`,
            color: 'bg-indigo-600',
            icon: '💜',
          },
          {
            label: 'Bulan Ini',
            value: statsLoading ? '...' : `Rp ${Number(stats?.thisMonth?.total || 0).toLocaleString('id-ID')}`,
            sub: `${stats?.thisMonth?.count || 0} donasi`,
            color: 'bg-violet-500',
            icon: '📅',
          },
          {
            label: 'Hari Ini',
            value: statsLoading ? '...' : `Rp ${Number(stats?.today?.total || 0).toLocaleString('id-ID')}`,
            sub: `${stats?.today?.count || 0} donasi`,
            color: 'bg-purple-500',
            icon: '⚡',
          },
          {
            label: 'Top Dononatur',
            value: statsLoading ? '...' : (stats?.topDonors?.[0]?.name || '-'),
            sub: stats?.topDonors?.[0]
              ? `Rp ${Number(stats.topDonors[0].totalAmount).toLocaleString('id-ID')}`
              : 'Belum ada',
            color: 'bg-amber-500',
            icon: '🏆',
          },
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-3xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-3 right-4 text-2xl opacity-20">{card.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{card.label}</p>
            <p className="text-xl font-black leading-tight">{card.value}</p>
            <p className="text-xs opacity-70 font-medium mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Top Donors */}
      {stats?.topDonors?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-amber-500 rounded-2xl flex items-center justify-center text-white"><TrendingUp size={16} /></div>
            <h3 className="font-black text-slate-800">Top Dononatur Kamu</h3>
          </div>
          <div className="space-y-3">
            {stats.topDonors.map((donor, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate">{donor.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{donor.count}x donasi</p>
                </div>
                <p className="font-black text-indigo-600 text-sm flex-shrink-0">
                  Rp {Number(donor.totalAmount).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-5 border-b border-slate-100 gap-4">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Riwayat Donasi</p>
            {pagination.total > 0 && (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Total {pagination.total} donasi
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter status */}
            <div className="flex gap-1">
              {[
                { val: '', label: 'Semua' },
                { val: 'PAID', label: 'PAID' },
                { val: 'PENDING', label: 'Pending' },
                { val: 'EXPIRED', label: 'Expired' },
              ].map(f => (
                <button key={f.val} onClick={() => { setStatusFilter(f.val); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${statusFilter === f.val ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-green-500 font-bold">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Auto 15s
              <button onClick={() => refetch()} disabled={isFetching} className="ml-1 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50">
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {isLoading
          ? <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3"><div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />Memuat riwayat...</div>
          : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      {['Donatur', 'Jumlah', 'Pesan', 'Media', 'Status', 'Waktu'].map((h, i) => (
                        <th key={h} className={`px-6 md:px-8 py-6 ${i === 4 ? 'text-center' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {donations.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-slate-400 font-bold">
                            {statusFilter ? `Tidak ada donasi dengan status "${statusFilter}"` : 'Belum ada donasi masuk'}
                          </td>
                        </tr>
                      )
                      : donations.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-all">
                          <td className="px-6 md:px-8 py-5">
                            <p className="font-black text-slate-700 text-sm">{item.donorName || 'Anonim'}</p>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <p className="text-indigo-600 font-black">Rp {Number(item.amount).toLocaleString('id-ID')}</p>
                          </td>
                          <td className="px-6 md:px-8 py-5 max-w-[200px]">
                            <p className="text-slate-500 text-sm font-medium italic truncate">
                              {item.message ? `"${item.message}"` : <span className="text-slate-300 not-italic font-normal">-</span>}
                            </p>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            {item.mediaUrl ? (
                              <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 hover:text-purple-800 transition-colors">
                                {item.mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                                Lihat
                              </a>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 md:px-8 py-5 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${item.status === 'PAID' ? 'bg-green-100 text-green-600' : item.status === 'EXPIRED' ? 'bg-red-100 text-red-400' : 'bg-amber-100 text-amber-600'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{formatDate(item.createdAt)}</p>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    ← Sebelumnya
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    Halaman <span className="text-indigo-600 font-black">{page}</span> dari {pagination.totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Berikutnya →
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};

const fetchDiscover    = async ({ page = 1, search = '' } = {}) => {
  const params = new URLSearchParams({ page, limit: 12, search });
  return (await axios.get(`${BASE_URL}/api/follows/discover?${params}`, { headers: authHeader() })).data;
};
const fetchMyFollowers = async (userId) =>
  (await axios.get(`${BASE_URL}/api/follows/${userId}/followers`, { headers: authHeader() })).data;
const fetchMyFollowing = async (userId) =>
  (await axios.get(`${BASE_URL}/api/follows/${userId}/following`, { headers: authHeader() })).data;
const toggleFollowApi  = async (userId) =>
  (await axios.post(`${BASE_URL}/api/follows/${userId}/toggle`, {}, { headers: authHeader() })).data;

// ─── CommunityPage ────────────────────────────────────────────────────────────
const CommunityPage = ({ currentUserId }) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab]   = useState('discover'); // 'discover' | 'followers' | 'following'
  const [search, setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['discover', search],
    queryFn: () => fetchDiscover({ search }),
    enabled: subTab === 'discover',
  });

  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['myFollowers', currentUserId],
    queryFn: () => fetchMyFollowers(currentUserId),
    enabled: subTab === 'followers' && !!currentUserId,
  });

  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['myFollowing', currentUserId],
    queryFn: () => fetchMyFollowing(currentUserId),
    enabled: subTab === 'following' && !!currentUserId,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleFollowApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowers'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowing'] });
    },
    onError: (err) => alert(err.response?.data?.message || 'Gagal'),
  });

  const subTabs = [
    { id: 'discover',  label: 'Discover',  count: discoverData?.pagination?.total },
    { id: 'followers', label: 'Followers',  count: followersData?.pagination?.total },
    { id: 'following', label: 'Following',  count: followingData?.pagination?.total },
  ];

  const renderUsers = (users, isLoading, showFollowBtn = true) => {
    if (isLoading) return (
      <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3">
        <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        Memuat...
      </div>
    );
    if (!users?.length) return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-4xl mb-3">👥</p>
        <p className="font-black text-slate-500">Belum ada streamer</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate">@{u.username}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{u.email}</p>
              </div>
            </div>
            {u.followersCount !== undefined && (
              <p className="text-[10px] text-slate-400 font-bold">
                <span className="text-indigo-600 font-black">{u.followersCount}</span> followers
              </p>
            )}
            {showFollowBtn && u._id !== currentUserId && (
              <button
                onClick={() => toggleMutation.mutate(u._id)}
                disabled={toggleMutation.isPending}
                className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all active:scale-[0.97] disabled:opacity-60 ${
                  u.isFollowing
                    ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                }`}>
                {u.isFollowing ? 'Unfollow' : '+ Follow'}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Streamer Network</p>
          <h2 className="text-3xl font-black tracking-tight">Community.</h2>
          <p className="text-indigo-200 text-sm font-medium mt-1">Temukan & ikuti sesama streamer</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 flex-wrap">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`cursor-pointer active:scale-[0.97] hover:brightness-90 px-5 py-2.5 rounded-2xl font-black text-sm transition-all ${
              subTab === t.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                subTab === t.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search — hanya di discover */}
      {subTab === 'discover' && (
        <div className="flex gap-3">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            placeholder="Cari username streamer..."
            className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm outline-none focus:border-indigo-400 transition-all"
          />
          <button
            onClick={() => setSearch(searchInput)}
            className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-[0.97]">
            Cari
          </button>
        </div>
      )}

      {/* Content */}
      {subTab === 'discover'  && renderUsers(discoverData?.users,   discoverLoading,  true)}
      {subTab === 'followers' && renderUsers(followersData?.users,  followersLoading, false)}
      {subTab === 'following' && renderUsers(followingData?.users,  followingLoading, true)}
    </div>
  );
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const InputField = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{label}</label>
    <input
      className="w-full bg-slate-200 border-2 border-slate-50 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm shadow-sm"
      {...props}
      onChange={e => props.onChange?.(e.target.value)}
    />
  </div>
);

const SectionHeader = ({ icon, title, color }) => (
  <div className="flex items-center gap-4">
    <div className={`${color} p-3 rounded-2xl text-white shadow-lg`}>{icon}</div>
    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const DashboardStreamer = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [donationToasts, setDonationToasts] = useState([]);
  const [profileForm, setProfileForm] = useState({ username: '', email: '', bio: '' });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    refetchInterval: 30000,
    onSuccess: (data) => {
      if (!localSettings) {
        const s = data.settings || data.overlaySetting || {};
        setLocalSettings({ ...DEFAULT_SETTINGS, ...s });
      }
    },
  });

  const isSuperAdmin = useMemo(() => {
    const payload = getTokenPayload();
    return payload?.role === 'superAdmin';
  }, [profileData]); // empty deps = compute sekali saat mount, tapi SETELAH component render

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal menyimpan pengaturan'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal update profil'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => { setPasswordForm({ oldPassword: '', newPassword: '' }); alert('Password berhasil diubah!'); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal ganti password'),
  });
  
  // Sync ke profileData saat data pertama kali load
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        username: profileData?.user?.username || profileData?.User?.username || '',
        email: profileData?.user?.email || profileData?.User?.email || '',
        bio: '',
      });
    }
  }, [profileData]);

  const user = {
    username:     profileData?.user?.username     || profileData?.User?.username     || 'Streamer',
    email:        profileData?.user?.email         || profileData?.User?.email         || '',
    balance:      profileData?.User?.walletBalance || profileData?.walletBalance       || 0,
    overlayToken: profileData?.user?.overlayToken  || profileData?.User?.overlayToken  || '',
    overlayUrl:   `${window.location.origin}/overlay/${profileData?.user?.overlayToken || profileData?.User?.overlayToken || ''}`,
  };

  useEffect(() => {
    if (!user.overlayToken) return;
    const socket = io(BASE_URL);
    socket.on('connect', () => socket.emit('join-overlay', user.overlayToken));
    socket.on('new-donation', (data) => {
      const id = Date.now();
      setDonationToasts(prev => [...prev, { id, ...data }]);
      // Invalidate history & stats agar auto update saat donasi masuk
      queryClient.invalidateQueries({ queryKey: ['donationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['donationStats'] });
      setTimeout(() => setDonationToasts(prev => prev.filter(t => t.id !== id)), 6000);
    });
    return () => socket.disconnect();
  }, [user.overlayToken]);

  const settings = localSettings || DEFAULT_SETTINGS;
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('URL Berhasil disalin!'); };
  const upd = (key, val) => setLocalSettings(s => ({ ...s, [key]: val }));

  console.log('Saving settings:', JSON.stringify(settings.mediaTriggers));

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans pb-6 text-slate-900">

      {/* Save Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 font-bold border border-white/10 backdrop-blur-md">
            <CheckCircle2 size={18} className="text-green-500" /> Pengaturan Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donation Toast */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {donationToasts.map(toast => (
            <motion.div key={toast.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
              className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0">💜</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Donasi Masuk!</span>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                </div>
                <p className="font-black text-slate-800 text-sm truncate">{toast.donorName}</p>
                <p className="text-indigo-600 font-black text-lg">Rp {Number(toast.amount).toLocaleString('id-ID')}</p>
                {toast.message && <p className="text-slate-500 text-xs font-medium italic mt-1 line-clamp-2">"{toast.message}"</p>}
              </div>
              <button onClick={() => setDonationToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-lg leading-none">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic">D</div>
          <span className="font-black text-sm tracking-tight">DUKUNG.IN</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="cursor-pointer active:scale-[0.97] p-2 bg-slate-200 rounded-xl text-slate-600"><Menu size={24} /></button>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 px-6 md:px-7 py-12 lg:py-4 max-w-7xl mx-auto w-full relative">
        <header className="flex flex-col mt-4 lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative">
          <div className="z-10">
            <h2 className="text-4xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">
              {activeTab === 'settings' ? 'Dashboard'
                : activeTab === 'history' ? 'Riwayat'
                : activeTab === 'wallet' ? 'Wallet'
                : activeTab === 'community' ? 'Community'
                : activeTab === 'profile' ? 'Profil'
                : 'Admin'}
              <span className="text-indigo-600">.</span>
            </h2>
            <p className="text-slate-400 font-medium mt-1">Selamat datang kembali, <span className="text-slate-800 font-bold">@{user.username}</span></p>
          </div>
          {profileLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold"><RefreshCw size={14} className="animate-spin" /> Memperbarui data...</div>
          )}
        </header>

        <AnimatePresence mode="wait">

          {activeTab === 'community' && (
            <motion.div key="community" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CommunityPage currentUserId={profileData?.user?._id || profileData?.User?._id} />
            </motion.div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              <section className="xl:col-span-7 space-y-6">

                {/* Card 1: Konfigurasi Alert */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<Settings size={20} />} title="Konfigurasi Alert" color="bg-indigo-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <InputField label="Minimal Donasi" type="number" value={settings.minDonate} onChange={v => upd('minDonate', v)} />
                    <InputField label="Maksimal Donasi" type="number" value={settings.maxDonate} onChange={v => upd('maxDonate', v)} />
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Tema Visual</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['modern', 'classic', 'minimal'].map(t => (
                          <button key={t} onClick={() => upd('theme', t)}
                            className={`cursor-pointer active:scale-[0.97] py-4 rounded-2xl border-2 transition-all font-black text-sm capitalize ${settings.theme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-50' : 'bg-slate-100 border-slate-300 text-slate-400 hover:border-slate-200'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <InputField label="Warna Background" type="color" value={settings.primaryColor} onChange={v => upd('primaryColor', v)} />
                    <InputField label="Warna Teks"       type="color" value={settings.textColor}    onChange={v => upd('textColor', v)} />
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Animasi Masuk</label>
                      <select value={settings.animation} onChange={e => upd('animation', e.target.value)}
                        className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all">
                        <option value="bounce">Bounce</option>
                        <option value="slide-left">Slide Kiri</option>
                        <option value="slide-right">Slide Kanan</option>
                        <option value="fade">Fade</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posisi Overlay di Layar</label>
                      <select value={settings.overlayPosition || 'bottom-right'} onChange={e => upd('overlayPosition', e.target.value)}
                        className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all">
                        <option value="top-left">Kiri Atas</option>
                        <option value="top-right">Kanan Atas</option>
                        <option value="bottom-left">Kiri Bawah</option>
                        <option value="bottom-right">Kanan Bawah</option>
                        <option value="top-center">Tengah Atas</option>
                        <option value="bottom-center">Tengah Bawah</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                        Lebar Maks Overlay OBS <span className="text-indigo-500 normal-case font-bold ml-1">({settings.maxWidth || 280}px)</span>
                      </label>
                      <input type="range" min={180} max={600} step={10} value={settings.maxWidth || 280}
                        onChange={e => upd('maxWidth', Number(e.target.value))} className="w-full accent-indigo-600" />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-0.5">
                        <span>180px (compact)</span><span>390px (standar)</span><span>600px (lebar)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Durasi Bertingkat */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<Timer size={20} />} title="Durasi Tampil per Nominal" color="bg-amber-500" />
                  <p className="text-xs text-slate-400 font-medium mt-3 mb-6">Atur berapa lama alert muncul berdasarkan nominal donasi.</p>
                  <DurationTiersEditor tiers={settings.durationTiers || []} onChange={v => upd('durationTiers', v)} />
                </div>

                {/* Card 3: Media Alert */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<ImageIcon size={20} />} title="Izinkan Donor Kirim Media" color="bg-purple-500" />
                  <div className="mt-4 mb-6 rounded-2xl bg-purple-50 border border-purple-100 px-5 py-4 space-y-2">
                    <p className="text-xs font-black text-purple-700">Bagaimana cara kerjanya?</p>
                    <ul className="text-[11px] text-purple-600 font-medium space-y-1.5 leading-relaxed">
                      <li className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0">1.</span><span>Kamu tentukan <strong>nominal minimum</strong> dan <strong>tipe media</strong> yang diizinkan (gambar / video / keduanya).</span></li>
                      <li className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0">2.</span><span>Saat donor memasukkan nominal yang memenuhi syarat, <strong>input link media muncul otomatis</strong> di halaman donasi mereka.</span></li>
                      <li className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0">3.</span><span>Donor isi link gambar/video milik mereka sendiri — yang kemudian <strong>tampil di overlay OBS-mu</strong> saat donasi masuk.</span></li>
                    </ul>
                  </div>
                  <MediaTriggersEditor triggers={settings.mediaTriggers || []} onChange={v => upd('mediaTriggers', v)} />
                </div>

                {/* OBS URL + Simpan */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <div className="bg-slate-200 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">OBS URL</label>
                    <div className="flex gap-3">
                      <input readOnly value={user.overlayUrl} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 font-bold outline-none overflow-hidden text-ellipsis" />
                      <button onClick={() => copyToClipboard(user.overlayUrl)} className="text-slate-400 hover:text-indigo-600 cursor-pointer active:scale-[0.98]"><Copy size={18} /></button>
                    </div>
                  </div>
                  <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2">
                    <Save size={20} />
                    {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                  </button>
                </div>
              </section>

              <section className="xl:col-span-5">
                <YouTubeLivePreview settings={settings} username={user.username} />
              </section>
            </motion.div>
          )}

          {/* ── HISTORY — sekarang pakai HistoryPage ── */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <HistoryPage />
            </motion.div>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-6 pb-6">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                {/* <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 z-0" /> */}
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white shadow-xl">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">@{user.username}</h2>
                      <span className="px-4 py-1.5 bg-green-100 relative top-1 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Verified Creator</span>
                    </div>
                    <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-[90%]' />
                    <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[130px] w-[7%] rotate-25 opacity-[90%]' />
                    <p className="text-slate-400 font-medium">{user.email}</p>
                    <div className="pt-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p><p className="font-bold text-indigo-600">Active</p></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<User size={18} />} title="Profil Publik" color="bg-indigo-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">Link Halaman Donasi Kamu</label>
                      <div className="flex gap-2">
                        <input readOnly value={`${window.location.origin}/${user.username}`} className="flex-1 bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-5 font-mono text-sm text-indigo-600 font-bold outline-none" />
                        <button onClick={() => copyToClipboard(`${window.location.origin}/${user.username}`)} className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-95"><Copy size={20} /></button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1 italic">*Bagikan link ini di bio Instagram, TikTok, atau deskripsi YouTube kamu.</p>
                    </div>
                    <InputField
                      label="Display Name"
                      value={profileForm.username}
                      placeholder="Nama di halaman donasi"
                      onChange={v => setProfileForm(f => ({ ...f, username: v }))}
                    />
                    <InputField
                      label="Email Address"
                      type="email"
                      value={profileForm.email}
                      onChange={v => setProfileForm(f => ({ ...f, email: v }))}
                    />
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio Singkat</label>
                      <textarea
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 h-32 transition-all shadow-sm"
                        placeholder="Ceritakan tentang kontenmu..."
                        value={profileForm.bio}
                        onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        onClick={() => updateProfileMutation.mutate({
                          username: profileForm.username,
                          email: profileForm.email,
                          bio: profileForm.bio,
                        })}
                        disabled={updateProfileMutation.isPending}
                        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                        <Save size={18} />{updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                      </button>
                    </div>
                  </div>
                </div>
                {/* <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<ShieldCheck size={18} />} title="Keamanan" color="bg-red-500" />
                  <div className="space-y-6 mt-10">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganti Password</p>
                      <input type="password" value={passwordForm.oldPassword} placeholder="Password Lama" className="w-full p-4 bg-blue-600/10 border border-black/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm" onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
                      <input type="password" value={passwordForm.newPassword} placeholder="Password Baru" className="w-full p-4 bg-blue-600/10 border border-black/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm" onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <button onClick={() => changePasswordMutation.mutate(passwordForm)} disabled={changePasswordMutation.isPending}
                        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                        <Save size={18} />{changePasswordMutation.isPending ? 'Memproses...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div> */}
              </div>
            </motion.div>
          )}

          {activeTab === 'wallet' && <WithdrawPage />}

          {activeTab === 'admin' && isSuperAdmin && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><AdminWithdrawalPage /></motion.div>
          )}
          {activeTab === 'admin' && !isSuperAdmin && (
            <motion.div key="forbidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-slate-400">
              <p className="text-6xl mb-4">🔒</p>
              <p className="font-black text-xl">Akses Ditolak</p>
              <p className="font-medium text-sm mt-2">Halaman ini hanya untuk Super Admin</p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden" />}
    </div>
  );
};

export default DashboardStreamer;