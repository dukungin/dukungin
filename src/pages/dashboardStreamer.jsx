import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  Copy,
  ImageIcon,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  Video,
  Vote,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../lib/axiosInstance';
import Sidebar from '../components/sidebar';
import { LeaderboardSettings, MilestonesManager, PollManager, SubathonManager } from '../components/streamerExtras';
import { TopNavbar } from '../components/topNavbar';
import { WithdrawPage } from './withdrawPage';
import { showSessionExpiredModal } from '../lib/sessionModal';
import { ContactPage } from './support';

// ─── API ──────────────────────────────────────────────────────────────────────

const fetchProfile   = async () => (await api.get('/api/overlay/settings')).data;
const fetchHistory   = async ({ page = 1, limit = 50, status = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return (await api.get(`/api/donations/history?${params}`)).data;
};
const fetchStats     = async () => (await api.get('/api/donations/stats')).data;
const saveSettings   = async (s) => (await api.put('/api/overlay/settings', s)).data;
const updateProfile  = async (d) => (await api.put('/api/auth/profile', d)).data;
const changePassword = async (d) => (await api.put('/api/auth/change-password', d)).data;
const postWithdraw   = async (d) => (await api.post('/api/midtrans/withdraw', d)).data;
const updateWDStatus = async ({ id, status }) => (await api.put(`/api/midtrans/admin/withdrawals/${id}`, { status })).data;

// Banned Words
const fetchBannedWords = async () => (await api.get('/api/banned-words')).data;
const saveBannedWords  = async (d) => (await api.put('/api/banned-words', d)).data;

// Milestones
const fetchMilestones = async () => (await api.get('/api/milestones')).data;
const saveMilestones  = async (d) => (await api.put('/api/milestones', { milestones: d })).data;

// Community
const fetchDiscover    = async ({ page = 1, search = '' } = {}) => {
  const params = new URLSearchParams({ page, limit: 12, search });
  return (await api.get(`/api/follows/discover?${params}`)).data;
};
const fetchMyFollowers = async (userId) => (await api.get(`/api/follows/${userId}/followers`)).data;
const fetchMyFollowing = async (userId) => (await api.get(`/api/follows/${userId}/following`)).data;
const toggleFollowApi  = async (userId) => (await api.post(`/api/follows/${userId}/toggle`, {})).data;

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  minDonate: 10000,
  maxDonate: 5000000,
  overlayEnabled: true,
  customIcon: '',
  showTimestamp: true,
  theme: 'modern',
  soundTiers: [],
  borderColor: '#ffffff26',
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

const ICON_PRESETS = [
  { emoji: '💜', label: 'Default' },
  { emoji: '❤️',  label: 'Merah'   },
  { emoji: '🔥',  label: 'Api'     },
  { emoji: '⭐',  label: 'Bintang' },
  { emoji: '🎮',  label: 'Gamer'   },
  { emoji: '🎵',  label: 'Musik'   },
  { emoji: '🐉',  label: 'Naga'    },
  { emoji: '💰',  label: 'Duit'    },
  { emoji: '🎯',  label: 'Target'  },
  { emoji: '👑',  label: 'Raja'    },
  { emoji: '🌟',  label: 'Gemilang'},
  { emoji: '🚀',  label: 'Roket'   },
];

const renderIconPreview = (customIcon, size = 20) => {
  if (!customIcon) return '💜';
  if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
    return (
      <img
        src={customIcon}
        alt="icon"
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, display: 'inline-block' }}
      />
    );
  }
  return customIcon;
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

// ─── BannedWordsEditor ────────────────────────────────────────────────────────

const BannedWordsEditor = () => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [localAction, setLocalAction] = useState('block');
  const [localReplacement, setLocalReplacement] = useState('');
  const [synced, setSynced] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['bannedWords'], queryFn: fetchBannedWords });
  const words = data?.words || [];

  useEffect(() => {
    if (data && !synced) {
      setLocalAction(data.action || 'block');
      setLocalReplacement(data.replacement || '');
      setSynced(true);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveBannedWords,
    onSuccess: (responseData) => {
      queryClient.setQueryData(['bannedWords'], responseData);
    },
  });

  const save = (overrides = {}) => saveMutation.mutate({
    words,
    action: localAction,
    replacement: localReplacement,
    ...overrides,
  });

  const add = () => {
    const w = input.trim().toLowerCase();
    if (!w || words.includes(w)) return;
    save({ words: [...words, w] });
    setInput('');
  };

  const remove = (word) => save({ words: words.filter(w => w !== word) });

  const ACTION_OPTIONS = [
    {
      id: 'block',
      emoji: '🚫',
      title: 'Tolak Pesan',
      desc: 'Donasi dengan kata terlarang langsung ditolak. Donor dapat notifikasi error.',
      active: 'border-red-500 bg-red-50',
    },
    {
      id: 'censor',
      emoji: '✱',
      title: 'Sensor Kata',
      desc: 'Kata diganti dengan bintang (***). Donasi tetap masuk, pesan disensor.',
      active: 'border-amber-500 bg-amber-50',
    },
    {
      id: 'replace',
      emoji: '✏️',
      title: 'Ganti Teks',
      desc: 'Kata diganti dengan teks pilihanmu. Cocok untuk branding atau humor.',
      active: 'border-indigo-500 bg-indigo-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100 space-y-7">
      <SectionHeader icon={<ShieldCheck size={20} />} title="Filter Kata Terlarang" color="bg-red-500" />
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi saat kata terlarang terdeteksi</label>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
          {ACTION_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setLocalAction(opt.id);
                saveMutation.mutate({ words, action: opt.id, replacement: localReplacement });
              }}
              className={`cursor-pointer active:scale-[0.99] text-left p-4 rounded-xl border-2 transition-all space-y-1.5 ${
                localAction === opt.id ? opt.active + ' shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{opt.emoji}</span>
                <span className={`font-black text-sm ${localAction === opt.id ? '' : 'text-slate-700'}`}>{opt.title}</span>
              </div>
              <p className={`text-[11px] font-medium leading-relaxed ${localAction === opt.id ? 'text-slate-600' : 'text-slate-400'}`}>
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
        {localAction === 'replace' && (
          <div className="space-y-2">
            <input
              value={localReplacement}
              onChange={e => setLocalReplacement(e.target.value)}
              onBlur={() => save({ replacement: localReplacement })}
              placeholder="contoh: [dihapus], ❤️, [sensor]"
              className="flex-1 bg-slate-100 border-2 border-slate-100 rounded-xl px-5 py-3 font-bold text-sm outline-none focus:border-indigo-400 transition-all"
            />
          </div>
        )}
      </div>
      <div className="border-t border-slate-100" />
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar kata terlarang</label>
        <div className="md:flex gap-3 md:space-y-0 space-y-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Ketik kata lalu tekan Enter..."
            className="w-full flex-1 bg-slate-100 border-2 border-slate-100 rounded-xl px-5 py-3 font-bold text-sm outline-none focus:border-red-400 transition-all"
          />
          <button onClick={add}
            className="md:w-max w-full cursor-pointer active:scale-[0.97] px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-sm transition-all flex items-center gap-2">
            <Plus size={16} /> Tambah
          </button>
        </div>
        {isLoading
          ? <div className="text-slate-400 text-sm font-bold animate-pulse">Memuat...</div>
          : words.length === 0
            ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-slate-400">
                <p className="text-2xl mb-2">🚫</p>
                <p className="font-black text-sm">Belum ada kata terlarang</p>
                <p className="text-[11px] font-medium mt-1">Semua pesan dari donor akan diterima</p>
              </div>
            )
            : (
              <div className="flex flex-wrap gap-2">
                {words.map(word => (
                  <span key={word}
                    className="md:w-max w-[48.9%] flex justify-center md:justify-start items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-black border border-red-100">
                    {word}
                    <button onClick={() => remove(word)} className="cursor-pointer hover:text-red-800 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
      </div>
    </div>
  );
};

// ─── MilestonesEditor ─────────────────────────────────────────────────────────

const MilestonesEditor = () => {
  const queryClient = useQueryClient();
  const { data: raw, isLoading } = useQuery({ queryKey: ['milestones'], queryFn: fetchMilestones });
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (raw && !local) setLocal(Array.isArray(raw) ? raw : []);
  }, [raw]);

  const mutation = useMutation({
    mutationFn: saveMilestones,
    onSuccess: (saved) => { queryClient.invalidateQueries({ queryKey: ['milestones'] }); setLocal(saved); },
  });

  const list = local || [];
  const add    = () => setLocal([...list, { title: '', targetAmount: 1000000, order: list.length }]);
  const remove = (i) => setLocal(list.filter((_, idx) => idx !== i));
  const upd    = (i, key, val) => setLocal(list.map((m, idx) => idx === i ? { ...m, [key]: val } : m));

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100 space-y-6">
      <SectionHeader icon={<TrendingUp size={20} />} title="Milestones" color="bg-green-500" />
      <p className="text-xs text-slate-400 font-medium">
        Tampilkan progress target donasi di halaman publik kamu. Donor bisa melihat seberapa dekat goal tercapai.
      </p>
      {isLoading
        ? <div className="text-slate-400 text-sm font-bold animate-pulse">Memuat...</div>
        : (
          <div className="space-y-3">
            {list.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-slate-400">
                <p className="text-2xl mb-2">🎯</p>
                <p className="font-black text-sm">Belum ada milestone</p>
              </div>
            )}
            {list.map((m, i) => (
              <div key={i} className="flex gap-3 items-end bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Judul Milestone</label>
                    <input value={m.title} placeholder="contoh: Beli mic baru!"
                      onChange={e => upd(i, 'title', e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-green-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target (Rp)</label>
                    <input type="number" value={m.targetAmount}
                      onChange={e => upd(i, 'targetAmount', Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-green-400" />
                  </div>
                </div>
                <button onClick={() => remove(i)} className="cursor-pointer active:scale-[0.97] text-red-400 hover:text-red-600 p-2 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={add}
              className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-green-200 text-green-600 rounded-xl font-black text-sm hover:border-green-400 hover:bg-green-50 transition-all flex items-center justify-center gap-2">
              <Plus size={16} /> Tambah Milestone
            </button>
            {list.length > 0 && (
              <button onClick={() => mutation.mutate(list)} disabled={mutation.isPending}
                className="cursor-pointer active:scale-[0.97] w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                <Save size={16} /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Milestones'}
              </button>
            )}
          </div>
        )}
    </div>
  );
};

// ─── Sound ────────────────────────────────────────────────────────────────────

const APP_URL = window.location.origin;

const SOUND_PRESETS = [
  { label: 'Ding 🔔', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { label: 'Pop 💬', url: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3' },
  { label: 'Cash 💰', url: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3' },
  { label: 'Chime ✨', url: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3' },
  { label: 'Alert 🚨', url: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3' },
  { label: 'Kururing 📢', url: `${APP_URL}/kukuring.mpeg` },
  { label: 'Kaching 💸', url: `${APP_URL}/kaching.mpeg` },
  { label: 'Tada 🎉', url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' },
  { label: 'Gold 🪙', url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
  { label: 'Whooo 🗣️', url: 'https://assets.mixkit.co/active_storage/sfx/2010/2010-preview.mp3' },
  { label: 'Treasure 💎', url: 'https://assets.mixkit.co/active_storage/sfx/1945/1945-preview.mp3' },
  { label: 'Machine 🎰', url: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3' },
  { label: 'Jewels 💎', url: 'https://assets.mixkit.co/active_storage/sfx/1947/1947-preview.mp3' },
  { label: 'Jackpot 🎰', url: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3' },
  { label: 'Bling ✨', url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' },
  { label: 'Payout 💸', url: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3' },
];

const SoundPicker = ({ value, onChange, label = 'Pilih Suara' }) => {
  const [mode, setMode] = useState(
    value && !SOUND_PRESETS.find(p => p.url === value) ? 'custom' : 'preset'
  );
  const audioRef = useRef(null);

  const playPreview = (url) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      )}
      <div className="flex gap-2">
        {[
          { id: 'preset', label: '🎵 Pilih Preset' },
          { id: 'custom', label: '🔗 URL Custom' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`cursor-pointer active:scale-[0.97] px-4 py-2 rounded-xl font-black text-xs transition-all ${
              mode === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'preset' && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onChange('')}
            className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-black text-xs transition-all ${
              !value ? 'border-slate-600 bg-slate-800 text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'
            }`}>
            <span className="text-lg">🔇</span>
            <span>Tanpa Suara</span>
          </button>
          {SOUND_PRESETS.map(preset => (
            <button key={preset.url}
              onClick={() => { onChange(preset.url); playPreview(preset.url); }}
              className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-black text-xs transition-all ${
                value === preset.url
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
                  : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
              }`}>
              <span className="text-lg">{preset.label.split(' ')[1]}</span>
              <span>{preset.label.split(' ')[0]}</span>
              <span onClick={e => { e.stopPropagation(); playPreview(preset.url); }}
                className="text-[9px] font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                ▶ preview
              </span>
            </button>
          ))}
        </div>
      )}
      {mode === 'custom' && (
        <div className="space-y-2">
          <input value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder="https://... .mp3 / .ogg / .wav"
            className="w-full p-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all" />
          <p className="text-[10px] text-slate-400 font-medium ml-1 italic">
            *Paste URL file audio dari Cloudinary, Google Drive (direct link), atau hosting lainnya
          </p>
        </div>
      )}
      {value && (
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <button onClick={() => playPreview(value)}
            className="cursor-pointer active:scale-[0.97] w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs hover:bg-indigo-700 transition-all flex-shrink-0">
            ▶
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-500">
              {SOUND_PRESETS.find(p => p.url === value)?.label || 'Custom Sound'}
            </p>
            <p className="text-[9px] text-slate-300 font-mono truncate">{value}</p>
          </div>
          <button onClick={() => onChange('')} className="cursor-pointer text-slate-300 hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
        </div>
      )}
      <audio ref={audioRef} />
    </div>
  );
};

const SoundTiersEditor = ({ tiers = [], onChange }) => {
  const add    = () => onChange([...tiers, { minAmount: 50000, maxAmount: null, soundUrl: '', label: '' }]);
  const remove = (i) => onChange(tiers.filter((_, idx) => idx !== i));
  const upd    = (i, key, val) => onChange(tiers.map((t, idx) =>
    idx === i ? { ...t, [key]: key === 'minAmount' || key === 'maxAmount'
      ? (val === '' ? null : Number(val)) : val } : t
  ));

  return (
    <div className="space-y-3">
      {tiers.map((t, i) => (
        <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-600 text-sm">{t.label || `Tier Suara ${i + 1}`}</span>
            <button onClick={() => remove(i)} className="cursor-pointer text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min (Rp)</label>
              <input type="number" value={t.minAmount} onChange={e => upd(i, 'minAmount', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max (kosong=∞)</label>
              <input type="number" value={t.maxAmount ?? ''} placeholder="∞" onChange={e => upd(i, 'maxAmount', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Label (opsional)</label>
            <input value={t.label} placeholder="contoh: Sultan Alert Sound" onChange={e => upd(i, 'label', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
          </div>
          <SoundPicker value={t.soundUrl} onChange={v => upd(i, 'soundUrl', v)} />
        </div>
      ))}
      <button onClick={add}
        className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Suara per Nominal
      </button>
    </div>
  );
};

// ─── QrCodeCard ───────────────────────────────────────────────────────────────

const QrCodeCard = ({ username }) => {
  const donateUrl = `${window.location.origin}/donate/${username}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(donateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-100 space-y-6">
      <SectionHeader icon={<span className="text-lg">◼</span>} title="QR Code Donasi" color="bg-slate-800" />
      <p className="text-xs text-slate-400 font-medium">
        Tampilkan QR ini di stream / sosmed. Scan langsung ke halaman donasi kamu.
      </p>
      <div className="flex flex-col items-start gap-4">
        <div className="p-4 bg-white rounded-3xl border-4 border-slate-900 shadow-xl inline-block">
          <img
            id="qr-svg"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(donateUrl)}&color=0f172a&bgcolor=ffffff&format=svg&margin=0`}
            alt="QR Code" width={200} height={200}
          />
        </div>
        <div className="text-center">
          <p className="font-black text-slate-700 text-sm">{donateUrl}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={copy}
          className={`cursor-pointer active:scale-[0.97] flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-700 hover:bg-slate-200'}`}>
          {copied ? <><CheckCircle2 size={16} /> Tersalin!</> : <><Copy size={16} /> Salin URL</>}
        </button>
          <a
          href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(donateUrl)}&color=0f172a&format=png`}
          download={`qr-donasi-${username}.png`} target="_blank" rel="noreferrer"
          className="cursor-pointer active:scale-[0.97] flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all">
          ↓ Download QR
        </a>
      </div>
    </div>
  );
};

// ─── LeaderboardCard ──────────────────────────────────────────────────────────

const LeaderboardCard = ({ stats }) => {
  const topDonors = stats?.topDonors || [];
  if (!topDonors.length) return null;
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['from-amber-400 to-yellow-300', 'from-slate-400 to-slate-300', 'from-orange-400 to-amber-300'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-lg">🏆</div>
        <div>
          <p className="font-black text-slate-800">Leaderboard Donor</p>
          <p className="text-[10px] text-slate-400 font-medium">Semua waktu</p>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {topDonors.map((donor, i) => (
          <motion.div key={donor.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-4 p-4 rounded-xl ${i < 3 ? 'bg-gradient-to-r ' + colors[i] + ' text-white' : 'bg-slate-50'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${i < 3 ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm truncate ${i < 3 ? 'text-white' : 'text-slate-800'}`}>{donor.name}</p>
              <p className={`text-[10px] font-medium ${i < 3 ? 'text-white/70' : 'text-slate-400'}`}>{donor.count}x donasi</p>
            </div>
            <p className={`font-black text-sm flex-shrink-0 ${i < 3 ? 'text-white' : 'text-indigo-600'}`}>
              Rp {Number(donor.totalAmount).toLocaleString('id-ID')}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── AdminWithdrawalPage ──────────────────────────────────────────────────────

const AdminWithdrawalPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchAdminWDs = async () =>
    (await api.get(`/api/midtrans/admin/withdrawals?status=${statusFilter}`)).data;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminWithdrawals', statusFilter],
    queryFn: fetchAdminWDs,
    refetchInterval: 30000,
  });

  const withdrawals = data?.withdrawals || [];
  const pagination  = data?.pagination  || {};

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }) =>
      api.put(`/api/midtrans/admin/withdrawals/${id}`, { status, note }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      setRejectNote('');
      setRejectTargetId(null);
    },
    onError: (err) => alert(err.response?.data?.message || 'Gagal update status'),
  });

  const handleApproveClick = (id) => {
      setSelectedId(id);
      setShowApproveModal(true);
    };

    const handleRejectClick = (id) => {
      setSelectedId(id);
      setRejectNote('');
      setShowRejectModal(true);
    };

    const confirmApprove = () => {
      if (selectedId) updateMutation.mutate({ id: selectedId, status: 'COMPLETED' });
    };

    const confirmReject = () => {
      if (selectedId) updateMutation.mutate({ 
        id: selectedId, 
        status: 'FAILED', 
        note: rejectNote || 'Ditolak oleh admin' 
      });
    };

  const STATUS_FILTERS = [
    { val: 'PENDING',   label: '⏳ Pending'  },
    { val: 'COMPLETED', label: '✅ Selesai'  },
    { val: 'FAILED',    label: '❌ Ditolak'  },
    { val: '',          label: '📋 Semua'    },
  ];

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num || 0));
  };

  return (
    <div className="w-full space-y-5 pb-6">  
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Super Admin</p>
            <h2 className="text-2xl font-black">Manajemen Penarikan Dana</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Approve = kamu sudah transfer manual. Reject = saldo dikembalikan ke streamer.
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Auto 30s
            <button onClick={() => refetch()} disabled={isFetching} className="ml-1 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button key={f.val} onClick={() => setStatusFilter(f.val)}
            className={`cursor-pointer active:scale-[0.98] hover:brightness-95 px-4 py-2 rounded-xl font-black text-sm transition-all ${
              statusFilter === f.val
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
            }`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="bg-white w-full rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {statusFilter ? `Request ${statusFilter}` : 'Semua Request'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{pagination.total || 0} total</p>
          </div>
          <span className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Super Admin Only</span>
        </div>
        {isLoading
          ? (
            <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3">
              <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              Memuat data...
            </div>
          )
          : withdrawals.length === 0
            ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-black text-slate-500">Tidak ada request {statusFilter.toLowerCase()}</p>
              </div>
            )
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      {['Streamer', 'Jumlah', 'Metode / Bank', 'No. Rekening', 'Status', 'Waktu', 'Aksi'].map(h => (
                        <th key={h} className="px-6 py-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {withdrawals.map(wd => (
                      <tr key={wd._id} className="hover:bg-slate-50 transition-all">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-700 text-sm">@{wd.userId?.username || '-'}</p>
                          {/* <p className="text-[10px] text-slate-400 font-medium">{wd.userId?.email}</p> */}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-emerald-600 font-black text-sm">
                            Rp {formatRupiah(Number(wd.amount) * 0.975)}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-600 text-sm">{wd.paymentMethod || 'BANK'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-mono font-bold text-slate-700 text-sm">{wd.accountNumber}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${
                            wd.status === 'COMPLETED' ? 'bg-green-100 text-green-600'
                            : wd.status === 'FAILED' ? 'bg-red-100 text-red-500'
                            : 'bg-amber-100 text-amber-600'
                          }`}>
                            {wd.status}
                          </span>
                          {wd.status === 'FAILED' && wd.note && (
                            <p className="text-[10px] text-red-400 font-medium mt-1 max-w-[120px]">{wd.note}</p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{formatDate(wd.createdAt)}</p>
                        </td>
                        <td className="px-6 py-5">
                          {wd.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveClick(wd._id)}
                                className="cursor-pointer px-2.5 py-2 bg-green-200 text-green-600 rounded-lg text-sm font-black hover:bg-green-300 transition-all flex items-center gap-2"
                              >
                                <Check size={18} /> 
                              </button>
                              <button
                                onClick={() => handleRejectClick(wd._id)}
                                className="cursor-pointer px-2.5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-black hover:bg-red-100 transition-all"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <AnimatePresence>
                  {showApproveModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                      onClick={() => setShowApproveModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl max-w-md w-full p-8 text-center"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-2xl flex items-center justify-center text-5xl">✅</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Konfirmasi Approve</h3>
                        <p className="text-slate-600 mb-8">Apakah Anda yakin sudah mentransfer dana ke streamer ini?</p>
                        <div className="flex gap-3">
                          <button onClick={() => setShowApproveModal(false)} className="cursor-pointer active:scale-[0.98] hover:brightness-95 flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all">
                            Batal
                          </button>
                          <button onClick={confirmApprove} disabled={updateMutation.isPending} className="cursor-pointer active:scale-[0.98] hover:brightness-95 flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all disabled:opacity-70">
                            {updateMutation.isPending ? 'Memproses...' : 'Ya, Sudah Transfer'}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal Reject */}
                <AnimatePresence>
                  {showRejectModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                      onClick={() => setShowRejectModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl max-w-md w-full p-8"
                        onClick={e => e.stopPropagation()}
                      >
                        <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">Tolak Penarikan</h3>
                        <p className="text-slate-600 text-center mb-6">Berikan alasan penolakan (opsional)</p>

                        <textarea
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Contoh: Rekening tidak valid, saldo tidak cukup..."
                          className="w-full h-32 p-4 border border-slate-200 rounded-2xl focus:border-red-400 outline-none resize-y font-medium"
                        />

                        <div className="flex gap-3 mt-6">
                          <button onClick={() => setShowRejectModal(false)} className="cursor-pointer active:scale-[0.98] hover:brightness-95 flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all">
                            Batal
                          </button>
                          <button onClick={confirmReject} disabled={updateMutation.isPending} className="cursor-pointer active:scale-[0.98] hover:brightness-95 flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all disabled:opacity-70">
                            {updateMutation.isPending ? 'Memproses...' : 'Konfirmasi Tolak'}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
        }
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
        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
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
        className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
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
        <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-5 py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <ImageIcon size={18} className="text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-500">Belum ada ketentuan media</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
            Tambahkan agar donor bisa menyertakan<br />gambar atau video saat donasi mencapai nominal tertentu.
          </p>
        </div>
      )}
      {triggers.map((t, i) => (
        <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-5">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
        className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {renderIconPreview(settings.customIcon, 16)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Donasi Masuk!</div>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>@{currentDonor.name} · Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
              <div style={{ fontSize: 9, opacity: 0.7, fontStyle: 'italic', marginTop: 2 }}>"{currentDonor.msg}"</div>
              {settings.showTimestamp !== false && (
                <div style={{ fontSize: 8, opacity: 0.5, fontFamily: 'monospace', marginTop: 3 }}>
                  🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              )}
            </div>
          </div>
        )}
        {theme === 'classic' && (
          <div style={{ padding: '10px 14px', border: '2px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Donasi Masuk!</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 9, opacity: 0.6, fontStyle: 'italic', marginTop: 2 }}>"{currentDonor.msg}"</div>
            {settings.showTimestamp !== false && (
              <div style={{ fontSize: 8, opacity: 0.5, fontFamily: 'monospace', marginTop: 3 }}>
                🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
            )}
          </div>
        )}
        {theme === 'minimal' && (
          <div style={{ padding: '8px 12px', borderLeft: '3px solid rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 9, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Donasi Masuk</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 9, opacity: 0.55, fontStyle: 'italic', marginTop: 1 }}>"{currentDonor.msg}"</div>
            {settings.showTimestamp !== false && (
              <div style={{ fontSize: 8, opacity: 0.5, fontFamily: 'monospace', marginTop: 3 }}>
                🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
            )}
          </div>
        )}
      </div>
    );
    return (
      <div style={{
        backgroundColor: theme === 'minimal' ? 'transparent' : bg,
        color: fg,
        maxWidth: `${maxW}px`,
        width: '100%',
        borderRadius: theme === 'modern' ? 14 : theme === 'classic' ? 4 : 0,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        border: theme === 'minimal'
          ? `2px solid ${bg}`
          : `2px solid ${settings.borderColor || 'rgba(255,255,255,0.15)'}`,
      }}>
        {inner}
      </div>
    );
  };

  const FullscreenPreview = () => (
    <AnimatePresence>
      {isFullscreen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed w-[100%] right-0 inset-0 z-[999999999] bg-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-black text-sm tracking-wide">LIVE PREVIEW</span>
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-md tracking-widest">OBS SIMULATION</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={triggerDemo}
                className="cursor-pointer active:scale-[0.97] hover:brightness-90 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> Simulasi Donasi
              </button>
              <button onClick={() => setIsFullscreen(false)}
                className="cursor-pointer active:scale-[0.97] hover:brightness-90 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-all border border-white/10">
                ✕ Tutup
              </button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#1a1a2e 0%,#0d0d1a 60%,#12121f 100%)' }}>
            <span className="absolute inset-0 flex items-center justify-center text-[clamp(60px,15vw,180px)] font-black text-white/[0.02] pointer-events-none select-none" style={{ letterSpacing: -8 }}>LIVE</span>
            <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-6 py-4" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.7) 0%,transparent 100%)' }}>
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-black">YT</div>
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded tracking-wide">● LIVE</span>
              <span className="text-white text-xs font-medium opacity-70 flex-1 truncate">Ngoding Bareng @{username} | TapTipTup Demo</span>
              <span className="text-white text-[10px] opacity-40">12.4K menonton</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 pt-8" style={{ background: 'linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 100%)' }}>
              <div className="h-1 bg-white/10 rounded-full mb-3 relative">
                <div className="absolute left-0 top-0 h-full bg-red-600 rounded-full" style={{ width: '42%' }} />
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <span>⏸</span><span>⏭</span><span>🔊</span>
                <span className="font-mono text-xs">1:24:07</span>
                <div className="ml-auto flex gap-3">⚙ ⛶ ⋮</div>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {showAlert && (
                  <motion.div key={animKey}
                    initial={animVariants[settings.animation]?.initial || animVariants.bounce.initial}
                    animate={animVariants[settings.animation]?.animate || animVariants.bounce.animate}
                    exit={animVariants[settings.animation]?.exit || animVariants.bounce.exit}
                    style={{ position: 'absolute', ...posMap[settings.overlayPosition || 'bottom-right'], zIndex: 10 }}>
                    {renderAlert()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute top-16 right-6 flex flex-col gap-2">
              {[
                { label: 'Posisi Alert', val: settings.overlayPosition || 'bottom-right' },
                { label: 'Lebar', val: `${settings.maxWidth || 280}px` },
                { label: 'Tema', val: settings.theme || 'modern' },
              ].map(b => (
                <div key={b.label} className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-right">
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">{b.label}</p>
                  <p className="text-white font-black text-xs capitalize">{b.val}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="sticky top-12 space-y-3">
      <FullscreenPreview />
      <div className="relative overflow-hidden border-[10px] border-slate-800 rounded-xl shadow-2xl" style={{ aspectRatio: '16/9', background: '#000' }}>
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
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-sm border-2 border-indigo-100 transition-all flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Simulasi Donasi Masuk
      </button>
      <button onClick={() => setIsFullscreen(true)}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-all flex items-center justify-center gap-2 border border-slate-700">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
        Full Screen Preview
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

  const donations  = data?.donations  || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6 pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Semua Waktu', value: statsLoading ? '...' : `Rp ${Number(stats?.allTime?.total || 0).toLocaleString('id-ID')}`, sub: `${stats?.allTime?.count || 0} donasi`, color: 'bg-indigo-600', icon: '💜' },
          { label: 'Bulan Ini', value: statsLoading ? '...' : `Rp ${Number(stats?.thisMonth?.total || 0).toLocaleString('id-ID')}`, sub: `${stats?.thisMonth?.count || 0} donasi`, color: 'bg-violet-500', icon: '📅' },
          { label: 'Hari Ini', value: statsLoading ? '...' : `Rp ${Number(stats?.today?.total || 0).toLocaleString('id-ID')}`, sub: `${stats?.today?.count || 0} donasi`, color: 'bg-purple-500', icon: '⚡' },
          { label: 'Top Donatur', value: statsLoading ? '...' : (stats?.topDonors?.[0]?.name || '-'), sub: stats?.topDonors?.[0] ? `Rp ${Number(stats.topDonors[0].totalAmount).toLocaleString('id-ID')}` : 'Belum ada', color: 'bg-amber-500', icon: '🏆' },
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-3 right-4 text-2xl opacity-20">{card.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{card.label}</p>
            <p className="text-xl font-black leading-tight">{card.value}</p>
            <p className="text-xs opacity-70 font-medium mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {stats?.topDonors?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white"><TrendingUp size={16} /></div>
            <h3 className="font-black text-slate-800">Top Donatur Kamu</h3>
          </div>
          <div className="space-y-3">
            {stats.topDonors.map((donor, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate">{donor.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{donor.count}x donasi</p>
                </div>
                <p className="font-black text-indigo-600 text-sm flex-shrink-0">Rp {Number(donor.totalAmount).toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && <LeaderboardCard stats={stats} />}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-5 border-b border-slate-100 gap-4">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Riwayat Donasi</p>
            {pagination.total > 0 && <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total {pagination.total} donasi</p>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
                          <td className="px-6 md:px-8 py-5"><p className="font-black text-slate-700 text-sm">{item.donorName || 'Anonim'}</p></td>
                          <td className="px-6 md:px-8 py-5"><p className="text-indigo-600 font-black">Rp {Number(item.amount).toLocaleString('id-ID')}</p></td>
                          <td className="px-6 md:px-8 py-5 max-w-[200px]">
                            <p className="text-slate-500 text-sm font-medium italic truncate">
                              {item.message ? `"${item.message}"` : <span className="text-slate-300 not-italic font-normal">-</span>}
                            </p>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            {item.mediaUrl ? (
                              <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 hover:text-purple-800 transition-colors">
                                {item.mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />} Lihat
                              </a>
                            ) : <span className="text-slate-300 text-xs">-</span>}
                          </td>
                          <td className="px-6 md:px-8 py-5 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${item.status === 'PAID' ? 'bg-green-100 text-green-600' : item.status === 'EXPIRED' ? 'bg-red-100 text-red-400' : 'bg-amber-100 text-amber-600'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 md:px-8 py-5"><p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{formatDate(item.createdAt)}</p></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
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

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = ({ currentUserId, onFollowAction }) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab]         = useState('discover');
  const [search, setSearch]         = useState('');
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
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowers'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowing'] });

      // Cari user yang di-toggle
      let user = null;
      if (subTab === 'discover') user = discoverData?.users?.find(u => u._id === userId);
      else if (subTab === 'followers') user = followersData?.users?.find(u => u._id === userId);
      else if (subTab === 'following') user = followingData?.users?.find(u => u._id === userId);

      if (user && onFollowAction) {
        // Gunakan status SEBELUM toggle untuk menentukan pesan modal
        const actionType = user.isFollowing ? 'unfollow' : 'follow';
        onFollowAction(user.username, actionType);
      }
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Gagal mengubah follow');
    },
  });

  const subTabs = [
    { id: 'discover',  label: 'Discover',  count: discoverData?.pagination?.total },
    { id: 'followers', label: 'Followers',  count: followersData?.pagination?.total },
    { id: 'following', label: 'Following',  count: followingData?.pagination?.total },
  ];

  const renderUsers = (users, isLoading, showFollowBtn = true) => {
    if (isLoading) return (
      <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3">
        <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />Memuat...
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
          <div key={u._id} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
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
                className={`cursor-pointer text-center justify-center items-center flex active:scale-[0.97] hover:brightness-95 w-full py-3 rounded-xl font-black text-xs transition-all disabled:opacity-60 ${
                  u.isFollowing 
                    ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                }`}
              >
                {toggleMutation.isPending ? (
                  <p>Memproses...</p>
                ) : (
                  u.isFollowing ? 'Unfollow' : '+ Follow'
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 md:p-6 text-white relative overflow-hidden">
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Streamer Network</p>
          <h2 className="text-3xl font-black tracking-tight">Community.</h2>
          <p className="text-indigo-200 text-sm font-medium mt-1">Temukan & ikuti sesama streamer</p>
        </div>
        <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-[90%]' />
        <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[130px] w-[7%] rotate-25 opacity-[90%]' />
      </div>

      <div className="flex gap-2 flex-wrap">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`cursor-pointer active:scale-[0.97] hover:brightness-90 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
              subTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${subTab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'discover' && (
        <div className="flex gap-3">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            placeholder="Cari username streamer..."
            className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-5 py-3.5 font-bold text-sm outline-none focus:border-indigo-400 transition-all" />
          <button onClick={() => setSearch(searchInput)}
            className="cursor-pointer active:scale-[0.97] hover:brightness-90 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all">
            Cari
          </button>
        </div>
      )}

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
      className="w-full bg-slate-200 border-2 border-slate-50 rounded-xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm shadow-sm"
      {...props}
      onChange={e => props.onChange?.(e.target.value)}
    />
  </div>
);

const SectionHeader = ({ icon, title, color }) => (
  <div className="flex items-center gap-4">
    <div className={`${color} p-3 rounded-xl text-white shadow-lg`}>{icon}</div>
    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const DashboardStreamer = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab]       = useState('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToast, setShowToast]       = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [donationToasts, setDonationToasts] = useState([]);
  const [profileForm, setProfileForm]   = useState({ username: '', email: '', bio: '' });
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [copiedLabel, setCopiedLabel] = useState('');
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followAction, setFollowAction] = useState({ type: '', username: '' });
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (profileData && !localSettings) {
      const s = profileData.settings || profileData.overlaySetting || {};
      setLocalSettings({ ...DEFAULT_SETTINGS, ...s });
    }
  }, [profileData]);

  const isSuperAdmin = useMemo(() => {
    const payload = getTokenPayload();
    return payload?.role === 'superAdmin';
  }, [profileData]);

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
    onError: (err) => alert(err.response?.data?.message || 'Gagal menyimpan pengaturan'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
    onError: (err) => alert(err.response?.data?.message || 'Gagal update profil'),
  });

  const handleFollowAction = (username, actionType) => {
    setFollowAction({ 
      type: actionType,     // 'follow' atau 'unfollow'
      username 
    });
    setShowFollowModal(true);
  };

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => { setPasswordForm({ oldPassword: '', newPassword: '' }); alert('Password berhasil diubah!'); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal ganti password'),
  });

  useEffect(() => {
    if (profileData) {
      setProfileForm({
        username: profileData?.user?.username || profileData?.User?.username || '',
        email:    profileData?.user?.email    || profileData?.User?.email    || '',
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
    const overlayToken = user.overlayToken;
    if (!overlayToken) return;

    const socket = io('https://server-dukungin-production.up.railway.app', {
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      socket.emit('join-room', overlayToken);
    });

    socket.on('new-donation', (data) => {
      const id = Date.now();
      setDonationToasts(prev => [...prev, { id, ...data }]);
      queryClient.invalidateQueries({ queryKey: ['donationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['donationStats'] });
      setTimeout(() => setDonationToasts(prev => prev.filter(t => t.id !== id)), 7000);
    });

    socket.on('withdrawal-update', (data) => {
      const id = Date.now();
      setDonationToasts(prev => [...prev, {
        id, isWithdrawal: true,
        status: data.status, amount: data.amount, message: data.message,
      }]);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setDonationToasts(prev => prev.filter(t => t.id !== id)), 8000);
    });

    return () => socket.disconnect();
  }, [user.overlayToken]);

  const settings = localSettings || DEFAULT_SETTINGS;
  const copyToClipboard = (text, label = 'URL') => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setCopiedLabel(label);
    setShowCopyModal(true);
  };
  const upd = (key, val) => setLocalSettings(s => ({ ...s, [key]: val }));

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans pb-6 text-slate-900">

      <AnimatePresence>
        {showCopyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            onClick={() => setShowCopyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl md:max-w-sm max-w-md w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-6 mt-1 md:mt-2 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-green-600" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-2">URL Tersalin!</h3>
                <p className="text-slate-600 mb-6">
                  Widget <span className="font-bold text-indigo-600">{copiedLabel}</span> berhasil disalin ke clipboard.
                </p>

                {/* <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left font-mono text-sm break-all mb-6">
                  {copiedUrl}
                </div> */}

                <button
                  onClick={() => setShowCopyModal(false)}
                  className="cursor-pointer hover:brightness-90 w-full py-4 bg-slate-900 text-white font-black rounded-2xl transition-all active:scale-[0.99]"
                >
                  OK, Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFollowModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            onClick={() => setShowFollowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-5xl
                  ${followAction.type === 'follow' ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {followAction.type === 'follow' ? '🤝' : '👋'}
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-1">
                  {followAction.type === 'follow' ? 'Berhasil Follow!' : 'Berhasil Unfollow'}
                </h3>
                
                <p className="text-slate-600 mb-8">
                  Kamu {followAction.type === 'follow' ? 'sekarang mengikuti' : 'tidak lagi mengikuti'} 
                  <span className="font-bold text-indigo-600"> @{followAction.username}</span>
                </p>

                <button
                  onClick={() => setShowFollowModal(false)}
                  className="cursor-pointer hover:brightness-90 w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all active:scale-[0.97]"
                >
                  OK, Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white rounded-xl p-5 shadow-2xl border border-slate-100 flex items-start gap-4">
              {toast.isWithdrawal
                ? (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 ${toast.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.status === 'COMPLETED' ? '✓' : '✕'}
                  </div>
                )
                : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    {renderIconPreview(settings.customIcon, 24)}
                  </div>
                )
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    toast.isWithdrawal
                      ? toast.status === 'COMPLETED' ? 'text-green-600' : 'text-red-500'
                      : 'text-indigo-600'
                  }`}>
                    {toast.isWithdrawal
                      ? toast.status === 'COMPLETED' ? 'Penarikan Berhasil!' : 'Penarikan Gagal'
                      : 'Donasi Masuk!'}
                  </span>
                </div>
                <p className="text-slate-700 text-sm font-medium">{toast.message}</p>
              </div>
              <button onClick={() => setDonationToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-lg leading-none">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-3 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 p-2 bg-red-200 rounded-lg flex items-center justify-center text-white font-black italic">
            <img src='/jellyfish.png' alt='icon' />
          </div>
          <span className="font-black text-lg tracking-tight">TapTipTup</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="cursor-pointer active:scale-[0.97] p-2 bg-slate-200 rounded-xl text-slate-600"><Menu size={24} /></button>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 md:w-8xl z-[4] mx-auto w-full relative">
        <TopNavbar user={user} onLogout={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }} onProfile={() => setActiveTab('profile')} activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className='relative mt-[-14px] px-3 md:px-7 py-0 lg:py-4 w-full'>
          <header className="flex flex-col md:mt-4 lg:flex-row justify-between items-start lg:items-center z-[-1] gap-8 mb-8 relative">
            <div className="z-10 md:flex flex-col hidden">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">
                {activeTab === 'settings'     ? 'Dashboard'
                  : activeTab === 'history'   ? 'Riwayat'
                  : activeTab === 'wallet'    ? 'Wallet'
                  : activeTab === 'community' ? 'Community'
                  : activeTab === 'profile'   ? 'Profil'
                  : activeTab === 'poll'      ? 'Poll & Voting'
                  : activeTab === 'subathon'  ? 'Subathon'
                  : activeTab === 'milestones'  ? 'Milestones'
                  : activeTab === 'leaderboard' ? 'Leaderboard'
                  : activeTab === 'contact' ? 'Contact'
                  : 'Admin'
                }
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
               <CommunityPage 
                  currentUserId={profileData?.user?._id || profileData?.User?._id}
                  onFollowAction={handleFollowAction}   // ← tambahkan ini
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <section className="xl:col-span-7 space-y-6">

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100">
                    <SectionHeader icon={<Settings size={20} />} title="Konfigurasi Alert" color="bg-indigo-500" />
                    <div className="mt-8 space-y-6">
                      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-black text-slate-700 text-sm">Aktifkan Overlay OBS</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Alert tidak akan muncul di OBS sama sekali</p>
                        </div>
                        <button onClick={() => upd('overlayEnabled', !settings.overlayEnabled)}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer focus:outline-none ${settings.overlayEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${settings.overlayEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-black text-slate-700 text-sm">Tampilkan Jam Donasi</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Waktu kapan donasi diterima overlay</p>
                        </div>
                        <button onClick={() => upd('showTimestamp', !settings.showTimestamp)}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer focus:outline-none ${settings.showTimestamp ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${settings.showTimestamp ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Icon Alert</label>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {ICON_PRESETS.map(({ emoji, label }) => (
                            <button key={emoji} onClick={() => upd('customIcon', emoji === '💜' ? '' : emoji)} title={label}
                              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-lg transition-all cursor-pointer active:scale-[0.95] ${
                                (settings.customIcon || '💜') === emoji || (!settings.customIcon && emoji === '💜')
                                  ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100'
                                  : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                              }`}>
                              <span>{emoji}</span>
                              <span className="text-[8px] font-black text-slate-400 leading-none">{label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-3 items-center">
                          <div className="relative flex-1">
                            <input value={settings.customIcon || ''} onChange={e => upd('customIcon', e.target.value)}
                              placeholder="Atau ketik emoji / URL gambar icon..."
                              className="w-full p-4 pr-14 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all" />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
                              {renderIconPreview(settings.customIcon, 22)}
                            </div>
                          </div>
                          {settings.customIcon && (
                            <button onClick={() => upd('customIcon', '')}
                              className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-black text-xs border border-red-100 hover:bg-red-100 transition-all cursor-pointer active:scale-[0.97]">
                              Reset
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium ml-1 italic">
                          *Pilih emoji di atas, ketik emoji manual, atau paste URL gambar (jpg/png/gif)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <InputField label="Minimal Donasi" type="number" value={settings.minDonate} onChange={v => upd('minDonate', v)} />
                      <InputField label="Maksimal Donasi" type="number" value={settings.maxDonate} onChange={v => upd('maxDonate', v)} />
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Tema Visual</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {['modern', 'classic', 'minimal'].map(t => (
                            <button key={t} onClick={() => upd('theme', t)}
                              className={`cursor-pointer active:scale-[0.97] py-4 rounded-xl border-2 transition-all font-black text-sm capitalize ${settings.theme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-50' : 'bg-slate-100 border-slate-300 text-slate-400 hover:border-slate-200'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posisi Overlay di Layar</label>
                        <select value={settings.overlayPosition || 'bottom-right'} onChange={e => upd('overlayPosition', e.target.value)}
                          className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all">
                          <option value="top-left">Kiri Atas</option>
                          <option value="top-right">Kanan Atas</option>
                          <option value="bottom-left">Kiri Bawah</option>
                          <option value="bottom-right">Kanan Bawah</option>
                          <option value="top-center">Tengah Atas</option>
                          <option value="bottom-center">Tengah Bawah</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Animasi Masuk</label>
                        <select value={settings.animation} onChange={e => upd('animation', e.target.value)}
                          className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all">
                          <option value="bounce">Bounce</option>
                          <option value="slide-left">Slide Kiri</option>
                          <option value="slide-right">Slide Kanan</option>
                          <option value="fade">Fade</option>
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

                    <div className="md:col-span-2 space-y-1.5 mt-6">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opacity Border</label>
                        <span className="text-[10px] font-black text-indigo-600">
                          {Math.round((parseInt(settings.borderColor?.slice(7, 9) || 'ff', 16) / 255) * 100)}%
                        </span>
                      </div>
                      <input type="range" min={0} max={255}
                        value={parseInt(settings.borderColor?.slice(7, 9) || 'ff', 16)}
                        onChange={e => {
                          const hex   = settings.borderColor?.slice(0, 7) || '#ffffff';
                          const alpha = parseInt(e.target.value).toString(16).padStart(2, '0');
                          upd('borderColor', `${hex}${alpha}`);
                        }}
                        className="w-full accent-indigo-600" />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Transparan</span><span>Solid</span>
                      </div>
                    </div>

                    <div className='md:grid-cols-3 space-y-7 w-full grid mt-7'>
                      <InputField label="Warna Background" type="color" value={settings.primaryColor} onChange={v => upd('primaryColor', v)} />
                      <InputField label="Warna Teks" type="color" value={settings.textColor} onChange={v => upd('textColor', v)} />
                      <InputField label="Warna Border" type="color"
                        value={settings.borderColor?.slice(0, 7) || '#ffffff'}
                        onChange={v => { const alpha = settings.borderColor?.slice(7, 9) || '26'; upd('borderColor', `${v}${alpha}`); }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100">
                    <SectionHeader icon={<Timer size={20} />} title="Durasi Tampil per Nominal" color="bg-amber-500" />
                    <p className="text-xs text-slate-400 font-medium mt-3 mb-6">Atur berapa lama alert muncul berdasarkan nominal donasi.</p>
                    <DurationTiersEditor tiers={settings.durationTiers || []} onChange={v => upd('durationTiers', v)} />
                  </div>

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100 space-y-7">
                    <SectionHeader icon={<ImageIcon size={20} />} title="Izinkan Donor Kirim Media" color="bg-purple-500" />
                    <MediaTriggersEditor triggers={settings.mediaTriggers || []} onChange={v => upd('mediaTriggers', v)} />
                  </div>

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100">
                    <SectionHeader icon={<span className="text-lg">🔊</span>} title="Custom Suara per Nominal" color="bg-violet-500" />
                    <p className="md:flex hidden text-xs text-slate-400 font-medium mt-7 ml-[2px] mb-6">
                      Atur file suara berbeda untuk tier nominal donasi tertentu. Sultan dapet sound kenceng? Bisa! 🎵
                    </p>
                    <div className="mb-6 md:mt-0 mt-5">
                      <SoundPicker label="Suara Default (semua donasi)" value={settings.soundUrl || ''} onChange={v => upd('soundUrl', v)} />
                    </div>
                    <SoundTiersEditor tiers={settings.soundTiers || []} onChange={v => upd('soundTiers', v)} />
                  </div>

                  <BannedWordsEditor />
                  <MilestonesEditor />

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100">
                    <div className="bg-slate-200 p-6 rounded-xl border-2 border-dashed border-slate-200 mb-8">
                      <label className="block text-[10px] font-black bg-yellow-300 w-max text-slate-500 mb-2 uppercase tracking-widest">OBS URL</label>
                      <div className="flex gap-3">
                        <input readOnly value={user.overlayUrl} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 font-bold outline-none overflow-hidden text-ellipsis" />
                        <button onClick={() => copyToClipboard(user.overlayUrl)} className="text-slate-400 hover:text-indigo-600 cursor-pointer active:scale-[0.98]"><Copy size={18} /></button>
                      </div>
                    </div>
                    <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
                      className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 text-white py-3 rounded-xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2">
                      <Save size={20} />
                      {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-xs border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center gap-2 mb-5">
                      <span className="text-xl font-black text-slate-900">Widget URLs untuk OBS</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">Browser Source</span>
                    </div>
                    {[
                      { label: 'Milestones',  emoji: '🎯', path: 'milestones',  desc: 'Progress bar target donasi', size: '400×280px' },
                      { label: 'Leaderboard', emoji: '🏆', path: 'leaderboard', desc: 'Top 10 donor terbesar',       size: '360×420px' },
                      { label: 'QR Code',     emoji: '◼',  path: 'qrcode',      desc: 'QR scan ke halaman donasi',  size: '280×320px' },
                      { label: 'Poll',        emoji: '🗳️', path: 'poll',        desc: 'Voting poll live',           size: '420×300px' },
                      { label: 'Subathon',    emoji: '⏱',  path: 'subathon',    desc: 'Timer subathon',             size: '360×180px' },
                    ].map(({ label, emoji, path, desc, size }) => {
                      const widgetUrl = `${window.location.origin}/widget/${user.overlayToken}/${path}`;
                      return (
                        <div key={path} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-300">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-slate-700 text-sm">{label}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{size}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{desc}</p>
                            <p className="text-[10px] font-mono text-indigo-500 truncate mt-0.5">{widgetUrl}</p>
                          </div>
                          <button onClick={() => copyToClipboard(widgetUrl, label)}
                            className="cursor-pointer active:scale-[0.97] p-2.5 bg-slate-200 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 rounded-xl transition-all flex-shrink-0">
                            <Copy size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="xl:col-span-5 z-[3]">
                  <YouTubeLivePreview settings={settings} username={user.username} />
                </section>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <HistoryPage />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-6 pb-6">
                <div className="bg-indigo-600 rounded-xl px-6 py-6 text-white relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-5xl font-black text-slate-900 shadow-xl">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h2 className="text-3xl font-black text-white tracking-tighter">@{user.username}</h2>
                        <span className="px-4 py-1.5 bg-green-100 relative top-1 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Verified Creator</span>
                      </div>
                      <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-[90%]' />
                      <img src="/jellyfish.png" alt="icon" className='absolute top-3 right-[130px] w-[7%] rotate-25 opacity-[90%]' />
                      <p className="text-slate-200 font-medium">{user.email}</p>
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
                          <input readOnly value={`${window.location.origin}/${user.username}`}
                            className="flex-1 bg-indigo-50 border-2 border-indigo-100 rounded-xl p-5 font-mono text-sm text-indigo-600 font-bold outline-none" />
                          <button onClick={() => copyToClipboard(`${window.location.origin}/${user.username}`)}
                            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-95">
                            <Copy size={20} />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1 italic">*Bagikan link ini di bio Instagram, TikTok, atau deskripsi YouTube kamu.</p>
                      </div>
                      <InputField label="Display Name" value={profileForm.username} placeholder="Nama di halaman donasi"
                        onChange={v => setProfileForm(f => ({ ...f, username: v }))} />
                      <InputField label="Email Address" type="email" value={profileForm.email}
                        onChange={v => setProfileForm(f => ({ ...f, email: v }))} />
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio Singkat</label>
                        <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold outline-none focus:border-indigo-500 h-32 transition-all shadow-sm"
                          placeholder="Ceritakan tentang kontenmu..." value={profileForm.bio}
                          onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <button onClick={() => updateProfileMutation.mutate({ username: profileForm.username, email: profileForm.email, bio: profileForm.bio })}
                          disabled={updateProfileMutation.isPending}
                          className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                          <Save size={18} />{updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <QrCodeCard username={user.username} />
              </motion.div>
            )}

            {activeTab === 'wallet' && <WithdrawPage />}

            {activeTab === 'admin' && isSuperAdmin && (
              <motion.div 
                key="admin" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="w-full"   // ← tambahkan ini
              >
                <AdminWithdrawalPage />
              </motion.div>
            )}

            {activeTab === 'admin' && !isSuperAdmin && (
              <motion.div key="forbidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-slate-400">
                <p className="text-6xl mb-4">🔒</p>
                <p className="font-black text-xl">Akses Ditolak</p>
                <p className="font-medium text-sm mt-2">Halaman ini hanya untuk Super Admin</p>
              </motion.div>
            )}

            {activeTab === 'poll' && (
              <motion.div key="poll" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-full space-y-5">
                  <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-100 space-y-6">
                    <SectionHeader icon={<Vote size={20} />} title="Poll & Voting" color="bg-violet-500" />
                    <PollManager overlayToken={user.overlayToken} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'milestones' && <MilestonesManager overlayToken={user?.overlayToken} />}

            {activeTab === 'subathon' && (
              <motion.div key="subathon" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-full space-y-5">
                  <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-100 space-y-6">
                    <SectionHeader icon={<Timer size={20} />} title="Subathon Timer" color="bg-indigo-500" />
                    <SubathonManager overlayToken={user.overlayToken} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-full space-y-5">
                  <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-100 space-y-6">
                    <SectionHeader icon={<Trophy size={20} />} title="Pengaturan Leaderboard" color="bg-amber-500" />
                    <LeaderboardSettings overlayToken={user?.overlayToken} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contact' && <ContactPage />}

          </AnimatePresence>
        </div>
      </main>

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden" />
      )}
    </div>
  );
};

export default DashboardStreamer;