import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HeadphonesIcon,
  Heart,
  ImageIcon,
  Menu,
  MessageSquare,
  Moon,
  PanelLeft,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  Users,
  Video,
  Vote,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../components/sidebar';
import { LeaderboardSettings, MilestonesManager, PollManager, SubathonManager } from '../components/streamerExtras';
import { TopNavbar } from '../components/topNavbar';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/axiosInstance';
import GhostAlertPage from './ghotAlert';
import { ContactPage } from './support';
import { WithdrawPage } from './withdrawPage';
import MyDonationsHistory from './MyDonationsHistory';
import { useSearchParams } from 'react-router-dom';
import Badge from '../components/badge';
import React from 'react';

// ─── API ──────────────────────────────────────────────────────────────────────

const fetchProfile    = async () => (await api.get('/api/overlay/settings')).data;
const fetchBadges = async () => (await api.get('/api/midtrans/badges')).data;
const fetchHistory    = async ({ page = 1, limit = 50, status = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return (await api.get(`/api/donations/history?${params}`)).data;
};
const fetchStats      = async () => (await api.get('/api/donations/stats')).data;
// Ganti fungsi saveSettings di atas
const saveSettings = async (s) => {
  // Sanitize: pastikan tidak ada DOM element / React fiber di dalam object
  const clean = JSON.parse(JSON.stringify(s, (key, val) => {
    // Buang apapun yang bukan primitive / array / plain object
    if (val instanceof HTMLElement || val instanceof Element) return undefined;
    return val;
  }));
  return (await api.put('/api/overlay/settings', clean)).data;
};
const updateProfile   = async (d) => (await api.put('/api/auth/profile', d)).data;
const changePassword  = async (d) => (await api.put('/api/auth/change-password', d)).data;
const fetchBannedWords = async () => (await api.get('/api/banned-words')).data;
const saveBannedWords  = async (d) => (await api.put('/api/banned-words', d)).data;
const fetchMilestones  = async () => (await api.get('/api/milestones')).data;
const saveMilestones   = async (d) => (await api.put('/api/milestones', { milestones: d })).data;
const fetchDiscover    = async ({ page = 1, search = '' } = {}) => {
  const params = new URLSearchParams({ page, limit: 12, search });
  return (await api.get(`/api/follows/discover?${params}`)).data;
};
const fetchMyFollowers  = async (userId) => (await api.get(`/api/follows/${userId}/followers`)).data;
const fetchMyFollowing  = async (userId) => (await api.get(`/api/follows/${userId}/following`)).data;
const toggleFollowApi   = async (userId) => (await api.post(`/api/follows/${userId}/toggle`, {})).data;
// Fetch public profile streamer lain (untuk modal komunitas)
const fetchPublicProfile = async (username) => (await api.get(`/api/overlay/public/${username}`)).data;

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
  quickAmounts: [10000, 25000, 50000, 100000, 250000],
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
  // ── FITUR BARU: quick nominal list ──
  quickAmounts: [10000, 20000, 50000, 100000],
};

const ICON_PRESETS = [
  { emoji: '💜', label: 'Default' }, { emoji: '❤️',  label: 'Merah'  },
  { emoji: '🐧', label: 'Penguin' },
  { emoji: '🔥',  label: 'Api'    }, { emoji: '⭐',  label: 'Bintang'},
  { emoji: '🎮',  label: 'Gamer'  }, { emoji: '🎵',  label: 'Musik'  },
  { emoji: '🐉',  label: 'Naga'   }, { emoji: '💰',  label: 'Duit'   },
  { emoji: '🎯',  label: 'Target' }, { emoji: '👑',  label: 'Raja'   },
  { emoji: '🌟',  label: 'Gemilang'}, { emoji: '🚀', label: 'Roket'  },
  { emoji: '⚡',  label: 'Kilat'  },
  { emoji: '💎',  label: 'Permata'},
  { emoji: '🤖',  label: 'Robot'  },
];

const renderIconPreview = (customIcon, size = 20) => {
  if (!customIcon) return '💜';
  if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
    return <img src={customIcon} alt="icon" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, display: 'inline-block' }} />;
  }
  return customIcon;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDuration = (settings, amount) => {
  const tiers = settings.durationTiers || [];
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
    for (const t of sorted) {
      if (amount >= t.minAmount && (t.maxAmount === null || amount <= t.maxAmount)) return t.duration;
    }
  }
  const extras = Math.floor(amount / (settings.extraPerAmount || 10000));
  return (settings.baseDuration || 5) + extras * (settings.extraDuration || 1);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, color }) => (
  <div className="flex items-center gap-4">
    {
      icon && (
        <div className={`${color} p-3 rounded-none text-white shadow-lg`}>{icon ? icon : null}</div>
      )
    }
    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">{label}</label>
    <input
      className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none p-3 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-900 dark:text-slate-100 shadow-sm"
      {...props}
      onChange={e => props.onChange?.(e.target.value)}
    />
  </div>
);

// ─── FITUR BARU 2: QuickAmountsEditor ─────────────────────────────────────────
// Streamer bisa atur list nominal cepat yang muncul di halaman donasi

// QuickAmountsEditor.jsx
const QuickAmountsEditor = ({ amounts = [], onChange, saveSettingsMutation, settings }) => {
  const add = () => onChange([...amounts, 50000]);
  const remove = (i) => onChange(amounts.filter((_, idx) => idx !== i));
  const update = (i, val) => {
    const newAmounts = [...amounts];
    newAmounts[i] = Number(val);
    onChange(newAmounts);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800">
      <SectionHeader icon={<Plus size={20} />} title="Quick Nominal" color="bg-emerald-500" />
      <p className="text-xs text-slate-400 mt-2 mb-4">Nominal cepat yang muncul di halaman donasi</p>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        {amounts.map((amt, i) => (
          <div key={i} className="w-[100%] flex gap-3 items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-none">
            <input
              type="number"
              value={amt}
              onChange={e => update(i, e.target.value)}
              className="flex-1 p-3 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold"
            />
            <button onClick={() => remove(i)} className="cursor-pointer active:scale-[0.99] hover:text-red-600 text-red-500 hover:text-red-600">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={add} className="cursor-pointer active:scale-[0.98] hover:brightness-[85%] w-full mt-4 py-2.5 border-2 border-dashed border-emerald-400/30 text-emerald-600 rounded-none font-black text-sm hover:bg-emerald-20">
        + Tambah Nominal
      </button>

      <button
        onClick={() => saveSettingsMutation.mutate(settings)}
        disabled={saveSettingsMutation.isPending}
        className="mt-3 md:mt-6 cursor-pointer active:scale-[0.98] hover:brightness-[85%] w-full py-3 bg-emerald-600 text-white rounded-none font-black"
      >
        Simpan Quick Nominal
      </button>
    </div>
  );
};

// ─── FITUR BARU 4: InstantTestAlert ───────────────────────────────────────────
// Kirim donasi test langsung ke overlay tanpa payment

const InstantTestAlert = ({ overlayToken, settings, user }) => {
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [customAmount, setCustomAmount] = useState(50000);
  const [customName, setCustomName] = useState('TestDonor');
  const [customMsg, setCustomMsg] = useState('Ini test donasi dari dashboard! 🎉');

  const SOCKET_URL = 'https://server-dukungin-production.up.railway.app';

  const sendTest = async () => {
    if (!overlayToken) return;
    setIsSending(true);

    try {
      await api.post('/api/test-alert/send', {
        targetUsername: user.username,        // atau username streamer target
        donorName: customName,
        amount: Number(customAmount),
        message: customMsg,
        mediaUrl: null,
        mediaType: null,
      });

      setLastSent(new Date());
      // Optional: tampilkan toast sukses
    } catch (err) {
      console.log('err', err)
      alert(err.response?.data?.message || 'Gagal mengirim test alert');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800 space-y-5">
      <div className="flex items-center gap-4">
        <div className="bg-rose-500 p-3 rounded-none text-white shadow-lg">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Instant Test Alert</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Kirim notif donasi test ke OBS tanpa perlu bayar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nama Donor</label>
          <input value={customName} onChange={e => setCustomName(e.target.value)}
            className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400 transition-all"
            placeholder="TestDonor" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nominal (Rp)</label>
          <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
            className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400 transition-all" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pesan</label>
          <input value={customMsg} onChange={e => setCustomMsg(e.target.value)}
            className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400 transition-all"
            placeholder="Pesan test..." />
        </div>
      </div>

      {/* Quick test amounts */}
      <div className="flex flex-wrap gap-2">
        {[10000, 50000, 100000, 500000, 1000000].map(v => (
          <button key={v} onClick={() => setCustomAmount(v)}
            className={`cursor-pointer active:scale-[0.97] px-3 py-1.5 rounded-none text-xs font-black transition-all border-2 ${
              Number(customAmount) === v
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-rose-300'
            }`}>
            {v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}K` : v}
          </button>
        ))}
      </div>

      <button onClick={sendTest} disabled={isSending || !overlayToken}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-none font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
        {isSending ? (
          <><RefreshCw size={18} className="animate-spin" /> Mengirim...</>
        ) : (
          <><Zap size={18} /> Kirim Test ke OBS Sekarang</>
        )}
      </button>

      {lastSent && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 rounded-none px-4 py-3 border border-emerald-100 dark:border-emerald-900">
          <CheckCircle2 size={14} /> Test terakhir dikirim: {lastSent.toLocaleTimeString('id-ID')}
        </motion.div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center">
        ⚠️ Pastikan OBS overlay kamu sudah dibuka di browser source sebelum test
      </p>
    </div>
  );
};

const InstantTestMediaShare = ({ overlayToken, settings, user }) => {
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [formData, setFormData] = useState({
    donorName: 'TestDonor',
    amount: 25000,
    message: 'Terima kasih atas dukungannya! 🔥',
    mediaUrl: 'https://picsum.photos/400/300',
    mediaType: 'image'
  });

  const sendTestMedia = async () => {
    if (!overlayToken || !formData.mediaUrl) return;
    setIsSending(true);

    try {
      const response = await api.post('/api/midtrans/test-mediashare/send', {
        targetUsername: user.username,
        donorName: formData.donorName,
        amount: formData.amount,
        message: formData.message || null,
        mediaUrl: formData.mediaUrl,
        mediaType: formData.mediaType,
      });

      console.log('✅ Sent:', response.data);
      setLastSent(new Date());
    } catch (err) {
      console.error('❌ Error:', err.response?.data);
      alert(err.response?.data?.message || 'Gagal mengirim');
    } finally {
      setIsSending(false);
    }
  };

  const PRESET_MEDIA = [
    { url: 'https://picsum.photos/400/300?random=1', type: 'image', label: '🖼️ Random Image', thumb: 'https://picsum.photos/80/60?random=1' },
    { url: 'https://picsum.photos/400/300?random=2', type: 'image', label: '🖼️ Image 2', thumb: 'https://picsum.photos/80/60?random=2' },
    { url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', type: 'image', label: '🎬 GIF', thumb: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy-preview.webp' },
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'video', label: '📺 YouTube', thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
  ];

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-none text-white shadow-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 14H5v-2h2v2zm0-4H5V9h2v6zm4 4H9v-2h2v2zM9 11H9V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v6z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            🎬 Full MediaShare Test
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Test lengkap: media + nama + nominal + pesan
          </p>
        </div>
      </div>

      {/* 📝 FORM FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Donor Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Nama Donor
          </label>
          <input 
            value={formData.donorName}
            onChange={e => updateForm('donorName', e.target.value)}
            className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm focus:border-purple-400 focus:outline-none transition-all"
            placeholder="@TestDonor"
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Nominal
          </label>
          <input 
            type="number"
            value={formData.amount}
            onChange={e => updateForm('amount', Number(e.target.value))}
            className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm focus:border-emerald-400 focus:outline-none transition-all"
            placeholder="25000"
          />
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Pesan (opsional)
        </label>
        <textarea 
          value={formData.message}
          onChange={e => updateForm('message', e.target.value)}
          rows={2}
          className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-medium text-sm resize-none focus:border-blue-400 focus:outline-none transition-all"
          placeholder="Terima kasih dukungannya!"
        />
      </div>

      {/* Media */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex-1">
            Media URL
          </label>
          <select 
            value={formData.mediaType} 
            onChange={e => updateForm('mediaType', e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold"
          >
            <option value="image">🖼️ Image/GIF</option>
            <option value="video">▶ MP4/YouTube</option>
          </select>
        </div>
        <input 
          value={formData.mediaUrl}
          onChange={e => updateForm('mediaUrl', e.target.value)}
          className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm focus:border-purple-400 focus:outline-none transition-all"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* 🎨 PRESET MEDIA */}
      <div className="pt-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pb-1">
          Quick Presets
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESET_MEDIA.map((preset, i) => (
            <button 
              key={i}
              onClick={() => {
                updateForm('mediaUrl', preset.url);
                updateForm('mediaType', preset.type);
              }}
              className={`cursor-pointer active:scale-[0.99] hover:brightness-80 group relative p-2 rounded-none border-2 transition-all overflow-hidden hover:shadow-md ${
                formData.mediaUrl === preset.url 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-200' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="w-full h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded overflow-hidden mb-1">
                <img 
                  src={preset.thumb} 
                  alt={preset.label}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <p className="text-[10px] font-bold text-center truncate leading-tight px-1 text-slate-700 dark:text-slate-300">
                {preset.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 🚀 SEND BUTTON */}
      <button 
        onClick={sendTestMedia} 
        disabled={isSending || !overlayToken || !formData.mediaUrl}
        className="cursor-pointer hover:brightness-90 w-full py-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white rounded-none font-black text-lg shadow-2xl hover:shadow-3xl active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isSending ? (
          <>
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Mengirim...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Kirim Test MediaShare Lengkap</span>
          </>
        )}
      </button>

      {lastSent && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 rounded-none px-4 py-3 border border-emerald-100 dark:border-emerald-900">
          <CheckCircle2 size={14} /> MediaShare berhasil dikirim: {lastSent.toLocaleTimeString('id-ID')}
        </motion.div>
      )}
    </div>
  );
};

// ─── FITUR BARU 3: StreamerProfileModal ───────────────────────────────────────
// Modal untuk lihat profil publik streamer lain di komunitas

// ─── FITUR BARU 3: StreamerProfileModal ───────────────────────────────────────
const StreamerProfileModal = ({ username, currentUserId, onClose }) => {
  const { data: streamer, isLoading, error } = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => fetchPublicProfile(username),
    enabled: !!username,
  });
  
  const donateUrl = `${window.location.origin}/donate/${username}`;
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(donateUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (error) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="bg-white dark:bg-slate-900 rounded-none p-8 text-center max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <p className="text-red-500 text-4xl mb-4">⚠️</p>
            <p className="font-black text-xl">Gagal memuat profil</p>
            <button onClick={onClose} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-none font-bold">
              Tutup
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999999999999] flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
          className="z-[999999] mt-auto md:mt-0 bg-white dark:bg-slate-900 rounded-none h-[70vh] pb-4 md:max-h-[90vh] overflow-y-auto max-w-5xl w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 relative"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Header Cover (Full Width) */}
          <div className="h-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
            <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 bg-white hover:bg-slate-100 backdrop-blur-md rounded-none flex items-center justify-center text-black cursor-pointer active:scale-[0.98] hover:brightness-[90%] transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Container Konten Utama: Flexbox Menyamping di Desktop */}
          <div className="flex flex-col md:flex-row">
            
            {/* SISI KIRI: Profil & Info Dasar (Sticky-like di Desktop) */}
            <div className="md:w-[40%] p-6 md:p-8 md:border-r border-slate-50 dark:border-slate-800/50 flex flex-col justify-between">
              <div className="relative mt-0 md:mt-0 mb-4">
                <div className="bg-white dark:bg-slate-900 rounded-none ml-[-5px] mb-4 shadow-xl inline-block">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-none bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl font-black text-indigo-600 border-4 border-white dark:border-slate-900 overflow-hidden">
                    {streamer?.avatar ? (
                      <img src={streamer.avatar} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      username?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  {streamer?.fullName || username}
                  <div className="w-4 h-4 bg-blue-500 rounded-none flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-none" />
                  </div>
                </h2>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">@{username}</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col mt-auto space-y-1 gap-2 mt-4">
                  <button
                    onClick={copy}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-none font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    {copied ? <><CheckCircle2 size={16} /> Tersalin!</> : <><Copy size={16} /> Salin Link Profile</>}
                  </button>
                  <button className="w-full py-3 bg-indigo-600 text-white rounded-none font-black text-sm shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <Heart size={16} /> Follow
                  </button>
                </div>
              </div>
            </div>

            {/* SISI KANAN: Bio, Stats, Socials, & Actions */}
            <div className="md:w-[60%] p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              
              {/* Bio Section */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tentang Creator</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {streamer?.bio || "Creator ini belum menuliskan bio. Mari beri dukungan agar terus berkarya! 🚀"}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-none p-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{streamer?.followersCount ?? 0}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Followers</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-none p-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{streamer?.supportersCount ?? 0}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Supporters</p>
                </div>
              </div>

              {/* Social Media Grid */}
              { (streamer?.instagram || streamer?.facebook || streamer?.youtube || streamer?.twitter) && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-3">SOCIAL MEDIA</p>
                <div className="flex flex-wrap gap-2">
                  {streamer.instagram && (
                    <a href={`https://instagram.com/${streamer.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-600 text-white rounded-none text-sm font-medium hover:bg-pink-700 active:scale-[0.98]">
                      📷 Instagram
                    </a>
                  )}
                  {streamer.facebook && (
                    <a href={streamer.facebook.startsWith('http') ? streamer.facebook : `https://facebook.com/${streamer.facebook}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 active:scale-[0.98]">
                      👍 Facebook
                    </a>
                  )}
                  {streamer.youtube && (
                    <a href={streamer.youtube} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-600 text-white rounded-none text-sm font-medium hover:bg-red-700 active:scale-[0.98]">
                      ▶ YouTube
                    </a>
                  )}
                  {streamer.twitter && (
                    <a href={`https://twitter.com/${streamer.twitter.replace('@','')}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-emerald-600 text-white rounded-none text-sm font-medium hover:bg-emerald-700 active:scale-[0.98]">
                      𝕏 Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

              {/* Donation & Copy Link */}
              <div className="pt-2 space-y-3">
                <a href={donateUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 hover:brightness-110 transition-all active:scale-[0.98]">
                  <Heart size={16} fill="white" /> Dukung @{username}
                </a>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
// ─── BannedWordsEditor ────────────────────────────────────────────────────────

const BannedWordsEditor = ({ saveSettingsMutation, settings }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [localAction, setLocalAction] = useState('block');
  const [localReplacement, setLocalReplacement] = useState('');
  const [synced, setSynced] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['bannedWords'], queryFn: fetchBannedWords });
  const words = data?.words || [];

  useEffect(() => {
    if (data && !synced) { setLocalAction(data.action || 'block'); setLocalReplacement(data.replacement || ''); setSynced(true); }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveBannedWords,
    onSuccess: (responseData) => queryClient.setQueryData(['bannedWords'], responseData),
  });

  const save = (overrides = {}) => saveMutation.mutate({ words, action: localAction, replacement: localReplacement, ...overrides });
  const add = () => {
    const w = input.trim().toLowerCase();
    if (!w || words.includes(w)) return;
    save({ words: [...words, w] });
    setInput('');
  };
  const remove = (word) => save({ words: words.filter(w => w !== word) });

  const ACTION_OPTIONS = [
    { id: 'block',   emoji: '🚫', title: 'Tolak Pesan',  desc: 'Donasi dengan kata terlarang langsung ditolak.', active: 'border-red-500 bg-red-50 dark:bg-red-950/30' },
    { id: 'censor',  emoji: '✱',  title: 'Sensor Kata',  desc: 'Kata diganti dengan bintang (***). Donasi tetap masuk.', active: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' },
    { id: 'replace', emoji: '✏️', title: 'Ganti Teks',   desc: 'Kata diganti dengan teks pilihanmu.', active: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800 space-y-7">
      <SectionHeader icon={<ShieldCheck size={20} />} title="Filter Kata Terlarang" color="bg-red-500" />
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aksi saat kata terlarang terdeteksi</label>
        <div className="grid grid-cols-1 gap-3">
          {ACTION_OPTIONS.map(opt => (
            <button key={opt.id}
              onClick={() => { setLocalAction(opt.id); saveMutation.mutate({ words, action: opt.id, replacement: localReplacement }); }}
              className={`cursor-pointer active:scale-[0.99] text-left p-4 rounded-none border-2 transition-all space-y-1.5 ${localAction === opt.id ? opt.active + ' shadow-md' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{opt.emoji}</span>
                <span className="font-black text-sm text-slate-700 dark:text-slate-200">{opt.title}</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        {localAction === 'replace' && (
          <input value={localReplacement} onChange={e => setLocalReplacement(e.target.value)} onBlur={() => save({ replacement: localReplacement })}
            placeholder="contoh: [dihapus], ❤️, [sensor]"
            className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none px-5 py-3 font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 transition-all" />
        )}
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800" />
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daftar kata terlarang</label>
        <div className="md:flex gap-3 md:space-y-0 space-y-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Ketik kata lalu tekan Enter..."
            className="w-full flex-1 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none px-5 py-3 font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-red-400 transition-all" />
          <button onClick={add} className="md:w-max w-max mt-1 md:mt-0 cursor-pointer active:scale-[0.97] px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-none font-black text-sm transition-all flex items-center gap-2">
            <Plus size={16} /> Tambah
          </button>
        </div>
        {isLoading ? <div className="text-slate-400 text-sm font-bold animate-pulse">Memuat...</div>
          : words.length === 0
            ? <div className="rounded-none border-2 border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-slate-400">
                <p className="text-2xl mb-2">🚫</p>
                <p className="font-black text-sm">Belum ada kata terlarang</p>
              </div>
            : <div className="flex flex-wrap gap-2">
                {words.map(word => (
                  <span key={word} className="w-max flex justify-center md:justify-start items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-none text-sm font-black border border-red-100 dark:border-red-900">
                    {word}
                    <button onClick={() => remove(word)} className="cursor-pointer hover:text-red-800 dark:hover:text-red-300 transition-colors"><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
        }
        <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
          className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-none font-black text-sm transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2">
          <Save size={20} />
          {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Overlay Terbaru'}
        </button>
      </div>
    </div>
  );
};

// ─── MilestonesEditor ─────────────────────────────────────────────────────────

const MilestonesEditor = () => {
  const queryClient = useQueryClient();
  const { data: raw, isLoading } = useQuery({ queryKey: ['milestones'], queryFn: fetchMilestones });
  const [local, setLocal] = useState(null);

  useEffect(() => { if (raw && !local) setLocal(Array.isArray(raw) ? raw : []); }, [raw]);

  const mutation = useMutation({
    mutationFn: saveMilestones,
    onSuccess: (saved) => { queryClient.invalidateQueries({ queryKey: ['milestones'] }); setLocal(saved); },
  });

  const list = local || [];
  const add    = () => setLocal([...list, { title: '', targetAmount: 1000000, order: list.length }]);
  const remove = (i) => setLocal(list.filter((_, idx) => idx !== i));
  const upd    = (i, key, val) => setLocal(list.map((m, idx) => idx === i ? { ...m, [key]: val } : m));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800 space-y-6">
      <SectionHeader icon={<TrendingUp size={20} />} title="Milestones" color="bg-green-500" />
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tampilkan progress target donasi di halaman publik kamu.</p>
      {isLoading ? <div className="text-slate-400 text-sm font-bold animate-pulse">Memuat...</div> : (
        <div className="space-y-3">
          {list.length === 0 && (
            <div className="rounded-none border-2 border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-slate-400">
              <p className="text-2xl mb-2">🎯</p><p className="font-black text-sm">Belum ada milestone</p>
            </div>
          )}
          {list.map((m, i) => (
            <div key={i} className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800 rounded-none p-4 border border-slate-100 dark:border-slate-700">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['Judul Milestone', 'title', m.title, 'text', 'contoh: Beli mic baru!'], ['Target (Rp)', 'targetAmount', m.targetAmount, 'number', '']].map(([lbl, key, val, type, ph]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lbl}</label>
                    <input type={type} value={val} placeholder={ph}
                      onChange={e => upd(i, key, type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-green-400" />
                  </div>
                ))}
              </div>
              <button onClick={() => remove(i)} className="cursor-pointer active:scale-[0.97] text-red-400 hover:text-red-600 p-2 flex-shrink-0"><Trash2 size={16} /></button>
            </div>
          ))}
          <button onClick={add} className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 rounded-none font-black text-sm hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Tambah Milestone
          </button>
          {list.length > 0 && (
            <button onClick={() => mutation.mutate(list)} disabled={mutation.isPending}
              className="cursor-pointer active:scale-[0.97] w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-none font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70">
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
  { label: 'Ding 🔔',     url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { label: 'Pop 💬',      url: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3' },
  { label: 'Cash 💰',     url: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3' },
  { label: 'Chime ✨',    url: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3' },
  { label: 'Alert 🚨',    url: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3' },
  { label: 'Kururing 📢', url: `${APP_URL}/kururing.mpeg` },
  { label: 'Kaching 💸',  url: `${APP_URL}/kaching.mpeg` },
  { label: 'Tada 🎉',     url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' },
  { label: 'Gold 🪙',     url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
  { label: 'Whooo 🗣️',   url: 'https://assets.mixkit.co/active_storage/sfx/2010/2010-preview.mp3' },
  { label: 'Treasure 💎', url: 'https://assets.mixkit.co/active_storage/sfx/1945/1945-preview.mp3' },
  { label: 'Machine 🎰',  url: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3' },
  { label: 'Jackpot 🎰',  url: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3' },
  { label: 'Bling ✨',    url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' },
  { label: 'Payout 💸',   url: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3' },
];

const SoundPicker = ({ value, onChange, label = 'Pilih Suara' }) => {
  const [mode, setMode] = useState(value && !SOUND_PRESETS.find(p => p.url === value) ? 'custom' : 'preset');
  const audioRef = useRef(null);
  const playPreview = (url) => {
    if (!url) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = url; audioRef.current.play().catch(() => {}); }
  };
  return (
    <div className="space-y-3">
      {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>}
      <div className="flex gap-2">
        {[{ id: 'preset', label: '🎵 Pilih Preset' }, { id: 'custom', label: '🔗 URL Custom' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`cursor-pointer active:scale-[0.97] px-4 py-2 rounded-none font-black text-xs transition-all ${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'preset' && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onChange('')}
            className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-1.5 p-3 rounded-none border-2 font-black text-xs transition-all ${!value ? 'border-slate-600 bg-slate-800 text-white shadow-md' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <span className="text-lg">🔇</span><span>Tanpa Suara</span>
          </button>
          {SOUND_PRESETS.map(preset => (
            <button key={preset.url} onClick={() => { onChange(preset.url); playPreview(preset.url); }}
              className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-1.5 p-3 rounded-none border-2 font-black text-xs transition-all ${value === preset.url ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-md' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
              <span className="text-lg">{preset.label.split(' ')[1]}</span>
              <span>{preset.label.split(' ')[0]}</span>
              <span onClick={e => { e.stopPropagation(); playPreview(preset.url); }} className="text-[9px] font-medium text-slate-400 hover:text-indigo-600 transition-colors">▶ preview</span>
            </button>
          ))}
        </div>
      )}
      {mode === 'custom' && (
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://... .mp3"
          className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 transition-all" />
      )}
      {value && (
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-none p-3 border border-slate-100 dark:border-slate-700">
          <button onClick={() => playPreview(value)} className="cursor-pointer active:scale-[0.97] w-8 h-8 bg-indigo-600 rounded-none flex items-center justify-center text-white text-xs hover:bg-indigo-700 transition-all flex-shrink-0">▶</button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400">{SOUND_PRESETS.find(p => p.url === value)?.label || 'Custom Sound'}</p>
            <p className="text-[9px] text-slate-300 dark:text-slate-600 font-mono truncate">{value}</p>
          </div>
          <button onClick={() => onChange('')} className="cursor-pointer text-slate-300 hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
        </div>
      )}
      <audio ref={audioRef} />
    </div>
  );
};

const SoundTiersEditor = ({ tiers = [], onChange, saveSettingsMutation, settings }) => {
  const add    = () => onChange([...tiers, { minAmount: 50000, maxAmount: null, soundUrl: '', label: '' }]);
  const remove = (i) => onChange(tiers.filter((_, idx) => idx !== i));
  const upd    = (i, key, val) => onChange(tiers.map((t, idx) => idx === i ? { ...t, [key]: key === 'minAmount' || key === 'maxAmount' ? (val === '' ? null : Number(val)) : val } : t));
  return (
    <div className="space-y-3">
      {tiers.map((t, i) => (
        <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-none p-4 border border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-600 dark:text-slate-300 text-sm">{t.label || `Tier Suara ${i + 1}`}</span>
            <button onClick={() => remove(i)} className="cursor-pointer text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Min (Rp)', 'minAmount', t.minAmount], ['Max (kosong=∞)', 'maxAmount', t.maxAmount ?? '']].map(([lbl, key, val]) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lbl}</label>
                <input type="number" value={val} placeholder={key === 'maxAmount' ? '∞' : ''} onChange={e => upd(i, key, e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Label (opsional)</label>
            <input value={t.label} placeholder="contoh: Sultan Alert Sound" onChange={e => upd(i, 'label', e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400" />
          </div>
          <SoundPicker value={t.soundUrl} onChange={v => upd(i, 'soundUrl', v)} />
        </div>
      ))}
      <button onClick={add} className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900 text-indigo-500 dark:text-indigo-400 rounded-none font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Suara per Nominal
      </button>
      <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-none font-black text-sm transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2">
        <Save size={20} />
        {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Audio Terbaru'}
      </button>
    </div>
  );
};

// ─── QrCodeCard ───────────────────────────────────────────────────────────────

const QrCodeCard = ({ username }) => {
  const donateUrl = `${window.location.origin}/donate/${username}`;
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(donateUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
      {/* <SectionHeader title="QR Code Donasi" color="bg-slate-800" /> */}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tampilkan QR ini di stream / sosmed. Scan langsung ke halaman donasi kamu.</p>
      <div className="flex flex-col items-start gap-4">
        <div className="p-4 bg-white rounded-none border-4 border-slate-900 shadow-xl inline-block">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(donateUrl)}&color=0f172a&bgcolor=ffffff&format=svg&margin=0`} alt="QR Code" width={200} height={200} />
        </div>
        <p className="font-black text-slate-700 dark:text-slate-300 text-sm">{donateUrl}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={copy} className={`cursor-pointer active:scale-[0.97] flex items-center justify-center gap-2 py-4 rounded-none font-black text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
          {copied ? <><CheckCircle2 size={16} /> Tersalin!</> : <><Copy size={16} /> Salin URL</>}
        </button>
        <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(donateUrl)}&color=0f172a&format=png`}
          download={`qr-donasi-${username}.png`} target="_blank" rel="noreferrer"
          className="cursor-pointer active:scale-[0.97] flex items-center justify-center gap-2 py-4 rounded-none font-black text-sm bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-all">
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
  return (
    <div className="bg-white dark:bg-slate-900 rounded-none pb-1.5 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-5 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-500 rounded-none flex items-center justify-center text-lg">🏆</div>
        <div><p className="font-black text-slate-800 dark:text-slate-100">Leaderboard Donor</p><p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Semua waktu</p></div>
      </div>
      <div className="py-0 px-4 space-y-3">
        {topDonors.slice(0, 3).map((donor, i) => (
          <motion.div key={donor.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-4 p-4 dark:border-slate-100/10 border-t border-slate-200 dark:text-white text-black`}>
            <div className={`w-10 h-10 rounded-none flex items-center justify-center font-black text-lg flex-shrink-0 ${i < 3 ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm truncate ${i < 3 ? 'dark:text-white text-black' : 'text-slate-800 dark:text-slate-100'}`}>{donor.name}</p>
              <p className={`text-[10px] font-medium ${i < 3 ? 'dark:text-white text-black/70' : 'text-slate-400 dark:text-slate-500'}`}>{donor.count}x donasi</p>
            </div>
            <p className={`font-black text-sm flex-shrink-0 ${i < 3 ? 'dark:text-white text-black' : 'text-indigo-600 dark:text-indigo-400'}`}>
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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchAdminWDs = async () => (await api.get(`/api/midtrans/admin/withdrawals?status=${statusFilter}`)).data;
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ['adminWithdrawals', statusFilter], queryFn: fetchAdminWDs, refetchInterval: 30000 });
  const withdrawals = data?.withdrawals || [];
  const pagination  = data?.pagination  || {};

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }) => api.put(`/api/midtrans/admin/withdrawals/${id}`, { status, note }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }); setRejectNote(''); setShowApproveModal(false); setShowRejectModal(false); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal update status'),
  });

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID').format(Math.round(num || 0));

  return (
    <div className="w-full space-y-5 pb-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-none p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Super Admin</p>
            <h2 className="text-2xl font-black">Manajemen Penarikan Dana</h2>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <span className="w-2 h-2 bg-green-400 rounded-none animate-pulse" /> Auto 30s
            <button onClick={() => refetch()} disabled={isFetching} className="ml-1 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[{ val: 'PENDING', label: '⏳ Pending' }, { val: 'COMPLETED', label: '✅ Selesai' }, { val: 'FAILED', label: '❌ Ditolak' }, { val: '', label: '📋 Semua' }].map(f => (
          <button key={f.val} onClick={() => setStatusFilter(f.val)}
            className={`cursor-pointer active:scale-[0.98] px-4 py-2 rounded-none font-black text-sm transition-all ${statusFilter === f.val ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 w-full rounded-none shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{statusFilter ? `Request ${statusFilter}` : 'Semua Request'}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{pagination.total || 0} total</p>
          </div>
          <span className="px-4 py-2 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-none text-[10px] font-black uppercase tracking-widest">Super Admin Only</span>
        </div>
        {isLoading
          ? <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3"><div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-none animate-spin" />Memuat data...</div>
          : withdrawals.length === 0
            ? <div className="py-16 text-center text-slate-400"><p className="text-4xl mb-3">📭</p><p className="font-black text-slate-500">Tidak ada request</p></div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      {['Streamer', 'Jumlah', 'Metode / Bank', 'No. Rekening', 'Status', 'Waktu', 'Aksi'].map(h => <th key={h} className="px-6 py-5">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {withdrawals.map(wd => (
                      <tr key={wd._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                        <td className="px-6 py-5"><p className="font-black text-slate-700 dark:text-slate-200 text-sm">@{wd.userId?.username || '-'}</p></td>
                        <td className="px-6 py-5"><p className="text-emerald-600 dark:text-emerald-400 font-black text-sm">Rp {formatRupiah(Number(wd.amount) * 0.975)}</p></td>
                        <td className="px-6 py-5"><p className="font-bold text-slate-600 dark:text-slate-300 text-sm">{wd.paymentMethod || 'BANK'}</p></td>
                        <td className="px-6 py-5"><p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{wd.accountNumber}</p></td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[10px] font-black ${wd.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' : wd.status === 'FAILED' ? 'bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>{wd.status}</span>
                        </td>
                        <td className="px-6 py-5"><p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">{formatDate(wd.createdAt)}</p></td>
                        <td className="px-6 py-5">
                          {wd.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedId(wd._id); setShowApproveModal(true); }} className="cursor-pointer px-2.5 py-2 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-none text-sm font-black hover:bg-green-200 transition-all flex items-center"><Check size={18} /></button>
                              <button onClick={() => { setSelectedId(wd._id); setRejectNote(''); setShowRejectModal(true); }} className="cursor-pointer px-2.5 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-none text-sm font-black hover:bg-red-100 transition-all"><X size={18} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <AnimatePresence>
                  {showApproveModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowApproveModal(false)}>
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-none max-w-md w-full p-8 text-center border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-950/40 rounded-none flex items-center justify-center text-5xl">✅</div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Konfirmasi Approve</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">Apakah Anda yakin sudah mentransfer dana ke streamer ini?</p>
                        <div className="flex gap-3">
                          <button onClick={() => setShowApproveModal(false)} className="cursor-pointer flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-none">Batal</button>
                          <button onClick={() => updateMutation.mutate({ id: selectedId, status: 'COMPLETED' })} disabled={updateMutation.isPending} className="cursor-pointer flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-none transition-all disabled:opacity-70">
                            {updateMutation.isPending ? 'Memproses...' : 'Ya, Sudah Transfer'}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {showRejectModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-none max-w-md w-full p-8 border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 text-center">Tolak Penarikan</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-center mb-6">Berikan alasan penolakan (opsional)</p>
                        <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Contoh: Rekening tidak valid..." className="w-full h-32 p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-none focus:border-red-400 outline-none resize-y font-medium" />
                        <div className="flex gap-3 mt-6">
                          <button onClick={() => setShowRejectModal(false)} className="cursor-pointer flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-none">Batal</button>
                          <button onClick={() => updateMutation.mutate({ id: selectedId, status: 'FAILED', note: rejectNote || 'Ditolak oleh admin' })} disabled={updateMutation.isPending} className="cursor-pointer flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-none transition-all disabled:opacity-70">
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

const DurationTiersEditor = ({ tiers, onChange, saveSettingsMutation, settings }) => {
  const addTier    = () => onChange([...tiers, { minAmount: 0, maxAmount: null, duration: 10 }]);
  const removeTier = (i) => onChange(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i, key, val) => onChange(tiers.map((t, idx) => idx === i ? { ...t, [key]: val === '' ? null : Number(val) } : t));
  return (
    <div className="space-y-3">
      {tiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-none p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[['Min (Rp)', 'minAmount', tier.minAmount], ['Max (Rp, kosong=∞)', 'maxAmount', tier.maxAmount ?? ''], ['Durasi (detik)', 'duration', tier.duration]].map(([lbl, key, val]) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lbl}</label>
                <input type="number" value={val} placeholder={key === 'maxAmount' ? '∞' : ''} onChange={e => updateTier(i, key, e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400" />
              </div>
            ))}
          </div>
          <button onClick={() => removeTier(i)} className="cursor-pointer active:scale-[0.97] text-red-400 hover:text-red-600 transition-colors flex-shrink-0 p-1"><Trash2 size={16} /></button>
        </div>
      ))}
      <button onClick={addTier} className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900 text-indigo-500 dark:text-indigo-400 rounded-none font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Ketentuan Durasi
      </button>
      <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-none font-black text-sm transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2">
        <Save size={20} />
        {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Durasi Terbaru'}
      </button>
    </div>
  );
};

// ─── MediaTriggersEditor ──────────────────────────────────────────────────────

const MediaTriggersEditor = ({ triggers, onChange, saveSettingsMutation, settings }) => {
  const add    = () => onChange([...triggers, { minAmount: 50000, mediaType: 'both', label: '' }]);
  const remove = (i) => onChange(triggers.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(triggers.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
  const mediaTypeOptions = [
    { value: 'image', icon: <ImageIcon size={13} />, label: 'Gambar', desc: 'jpg, gif, png' },
    { value: 'video', icon: <Video size={13} />,     label: 'Video',  desc: 'mp4, webm'    },
    { value: 'both',  icon: <span className="flex items-center gap-0.5"><ImageIcon size={11} /><Video size={11} /></span>, label: 'Keduanya', desc: 'gambar & video' },
  ];
  return (
    <div className="space-y-4">
      {triggers.length === 0 && (
        <div className="rounded-none bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 px-5 py-6 text-center">
          <div className="w-10 h-10 rounded-none bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3"><ImageIcon size={18} className="text-slate-400" /></div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-400">Belum ada ketentuan media</p>
        </div>
      )}
      {triggers.map((t, i) => (
        <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-none p-5 border border-slate-100 dark:border-slate-700 space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{t.label || `Media Alert ${i + 1}`}</span>
            <button onClick={() => remove(i)} className="cursor-pointer active:scale-[0.97] text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 size={15} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[['Label (opsional)', 'label', t.label, 'text', 'contoh: Sultan Alert'], ['Nominal Min (Rp)', 'minAmount', t.minAmount, 'number', '']].map(([lbl, key, val, type, ph]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lbl}</label>
                <input type={type} value={val} placeholder={ph} onChange={e => update(i, key, type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 transition-all" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {mediaTypeOptions.map(opt => (
              <button key={opt.value} onClick={() => update(i, 'mediaType', opt.value)}
                className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-1.5 py-3 px-2 rounded-none border-2 font-black text-xs transition-all ${t.mediaType === opt.value ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}>
                {opt.icon}<span>{opt.label}</span>
                <span className="text-[9px] font-medium text-slate-300 dark:text-slate-500">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={add} className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900 text-indigo-500 dark:text-indigo-400 rounded-none font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Ketentuan Media Alert
      </button>
      <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-none font-black text-sm transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2">
        <Save size={20} />
        {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Izin Media'}
      </button>
    </div>
  );
};

// ─── YouTubeLivePreview ───────────────────────────────────────────────────────

const YouTubeLivePreview = ({ settings, username, testFullScreen }) => {
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

  const handleFullScreen = () => { testFullScreen(); setIsFullscreen(!isFullscreen); };
  
  const renderAlert = () => {
    if (!currentDonor) return null;

    const hl = settings.highlightColor || '#a5b4fc';
    const ts = settings.showTimestamp !== false
      ? <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
          🕐 {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </div>
      : <div />;

    // ── MODERN ────────────────────────────────────────────────────────────────
    const modernInner = (
      <>
        <div style={{ height: 4, background: hl }} />
        <div style={{ padding: '14px 16px 0px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 42, height: 42,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            marginTop: 7
          }}>
            {renderIconPreview(settings.customIcon, 22)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(0,0,0,0.25)', 
              padding: '2px 8px',
              fontSize: 26, fontWeight: 900, color: hl,
              textTransform: 'uppercase', letterSpacing: '0.12em', 
              marginBottom: 6,
            }}>
              <span style={{ width: 4, height: 4, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
              Donasi Masuk
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: fg, lineHeight: 1.2, marginBottom: 2 }}>
              @{currentDonor.name}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: hl, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 5 }}>
              Rp {currentDonor.amount.toLocaleString('id-ID')}
            </div>
            {currentDonor.msg && (
              <div style={{ fontSize: 26, color: fg, opacity: 0.8, lineHeight: 1.4 }}>
                "{currentDonor.msg}"
              </div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 10px', background: 'rgba(0,0,0,0.2)', marginTop: 10,
        }}>
          {ts}
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.15)', marginLeft: 12 }}>
            <div style={{ height: '100%', width: '60%', background: hl }} />
          </div>
        </div>
      </>
    );

    // ── CLASSIC ───────────────────────────────────────────────────────────────
    const classicInner = (
      <>
        <div style={{
          background: 'rgba(0,0,0,0.3)', padding: '9px 14px',
          display: 'flex', alignItems: 'center', gap: 9,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 26, position: 'relative', top: -3 }}>{renderIconPreview(settings.customIcon, 18)}</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: fg, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Dukungan Masuk!
          </span>
        </div>
        <div style={{ padding: '12px 14px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: fg }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: hl, letterSpacing: '-0.5px' }}>
              Rp {currentDonor.amount.toLocaleString('id-ID')}
            </div>
          </div>
          {currentDonor.msg && (
            <div style={{
              fontSize: 26, color: fg,
              lineHeight: 1.4, padding: '6px 10px',
              background: 'rgba(0,0,0,0.2)',
              borderLeft: `2px solid ${hl}`,
            }}>
              {currentDonor.msg}
            </div>
          )}
          {ts}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', marginTop: 10 }}>
            <div style={{ height: '100%', width: '45%', background: hl }} />
          </div>
        </div>
      </>
    );

    // ── MINIMAL ───────────────────────────────────────────────────────────────
    const minimalInner = (
      <>
        <div style={{ padding: '14px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: hl, letterSpacing: '-1px', lineHeight: 1 }}>
              Rp {currentDonor.amount.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Donasi
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: fg, marginBottom: 3 }}>
            @{currentDonor.name}
          </div>
          {currentDonor.msg && (
            <div style={{ fontSize: 26, color: fg, lineHeight: 1.35 }}>
              "{currentDonor.msg}"
            </div>
          )}
          {ts}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', marginTop: 10 }}>
            <div style={{ height: '100%', width: '75%', background: hl }} />
          </div>
        </div>
      </>
    );

    const innerMap = { modern: modernInner, classic: classicInner, minimal: minimalInner };

    return (
      <div style={{
        backgroundColor: bg,
        color: fg,
        maxWidth: `${maxW}px`,
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        border: `1px solid ${settings.borderColor || 'rgba(255,255,255,0.15)'}`,
      }}>
        {innerMap[theme] ?? modernInner}
      </div>
    );
  };

  const FullscreenPreview = () => (
    <AnimatePresence>
      {isFullscreen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed w-[100%] right-0 inset-0 z-[999999999] bg-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-none animate-pulse" />
              <span className="text-white font-black text-sm tracking-wide">LIVE PREVIEW</span>
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-none tracking-widest">OBS SIMULATION</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={triggerDemo} className="cursor-pointer active:scale-[0.97] flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none font-black text-xs transition-all">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-none animate-pulse" /> Simulasi Donasi
              </button>
              <button onClick={() => handleFullScreen()} className="cursor-pointer active:scale-[0.97] flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-none font-black text-xs transition-all border border-white/10">
                ✕ Tutup
              </button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#1a1a2e 0%,#0d0d1a 60%,#12121f 100%)' }}>
            <span className="absolute inset-0 flex items-center justify-center text-[clamp(60px,15vw,180px)] font-black text-white/[0.02] pointer-events-none select-none" style={{ letterSpacing: -8 }}>LIVE</span>
            <div className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {showAlert && (
                  <motion.div key={animKey} initial={animVariants[settings.animation]?.initial || animVariants.bounce.initial} animate={animVariants[settings.animation]?.animate || animVariants.bounce.animate} exit={animVariants[settings.animation]?.exit || animVariants.bounce.exit} style={{ position: 'absolute', ...posMap[settings.overlayPosition || 'bottom-right'], zIndex: 10 }}>
                    {renderAlert()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="sticky top-12 space-y-3">
      <FullscreenPreview />
      <div className="relative overflow-hidden border-[10px] border-slate-800 rounded-none shadow-2xl" style={{ aspectRatio: '16/9', background: '#000' }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(155deg,#1a1a2e 0%,#0d0d1a 60%,#12121f 100%)' }}>
          <span style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.04)', letterSpacing: -3, userSelect: 'none' }}>LIVE</span>
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-2" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.65) 0%,transparent 100%)' }}>
          <div className="w-5 h-5 rounded-none bg-red-600 flex items-center justify-center text-white text-[8px] font-black flex-shrink-0">YT</div>
          <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-none tracking-wide">LIVE</span>
          <span className="text-white text-[9px] font-medium opacity-80 flex-1 truncate">Ngoding Bareng | Demo</span>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {showAlert && (
              <motion.div key={animKey} initial={anim.initial} animate={anim.animate} exit={anim.exit} style={{ position: 'absolute', ...pos, zIndex: 10 }}>
                {renderAlert()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute top-2 right-3"><span className="w-1.5 h-1.5 bg-red-500 rounded-none animate-pulse block" /></div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1 flex-wrap gap-1">
        <span>Lebar: <span className="text-indigo-600">{maxW}px</span></span>
        <span>Tema: <span className="text-indigo-600">{theme}</span></span>
        <span>Durasi demo: <span className="text-indigo-600">{currentDonor ? dur : '-'}s</span></span>
      </div>
      <button onClick={triggerDemo}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3 rounded-none bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-black text-sm border-2 border-indigo-100 dark:border-indigo-900 transition-all flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-none animate-pulse" /> Simulasi Donasi Masuk
      </button>
      <button onClick={() => handleFullScreen()}
        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3.5 rounded-none bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-black text-sm transition-all flex items-center justify-center gap-2 border border-slate-700">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
        Full Screen Preview
      </button>
    </div>
  );
};

// ─── FITUR BARU 1: HistoryPage dengan Eye Toggle ──────────────────────────────
const HistoryPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [historyTab, setHistoryTab] = useState('received'); // 'received' | 'sent'

  // Eye toggles (hanya relevan untuk tab received)
  const [showAmounts, setShowAmounts] = useState(true);
  const [showEmails, setShowEmails] = useState(false);

  // Fetch Sent Donations
  const fetchSentDonations = async ({ page = 1 } = {}) => {
    const params = new URLSearchParams({ page, limit: 20 });
    return (await axios.get(`${BASE_URL}/api/donations/sent?${params}`, { headers: authHeader() })).data;
  };

  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ['sentDonations', page],
    queryFn: () => fetchSentDonations({ page }),
    enabled: historyTab === 'sent',
    keepPreviousData: true,
    refetchInterval: 30000,
  });

  // Fetch Received Donations
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['donationHistory', page, statusFilter],
    queryFn: () => fetchHistory({ page, limit: 20, status: statusFilter }),
    enabled: historyTab === 'received',
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

  const maskAmount = (amount) => 
    showAmounts ? `Rp ${Number(amount).toLocaleString('id-ID')}` : 'Rp ••••••';

  const maskEmail = (email) => 
    showEmails ? (email || '-') : '••••@•••';

  return (
    <div className="space-y-6 pb-6">
      {/* Stats Cards - hanya untuk received */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Semua Waktu', value: statsLoading ? '...' : maskAmount(stats?.allTime?.total || 0), sub: `${stats?.allTime?.count || 0} donasi`, color: 'bg-indigo-600', icon: '💜' },
          { label: 'Bulan Ini', value: statsLoading ? '...' : maskAmount(stats?.thisMonth?.total || 0), sub: `${stats?.thisMonth?.count || 0} donasi`, color: 'bg-violet-500', icon: '📅' },
          { label: 'Hari Ini', value: statsLoading ? '...' : maskAmount(stats?.today?.total || 0), sub: `${stats?.today?.count || 0} donasi`, color: 'bg-purple-500', icon: '⚡' },
          { label: 'Top Donatur', value: statsLoading ? '...' : (stats?.topDonors?.[0]?.name || '-'), sub: stats?.topDonors?.[0] ? maskAmount(stats.topDonors[0].totalAmount) : 'Belum ada', color: 'bg-amber-500', icon: '🏆' },
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-none p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-3 right-4 text-2xl opacity-20">{card.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{card.label}</p>
            <p className="text-xl font-black leading-tight">{card.value}</p>
            <p className="text-xs opacity-70 font-medium mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {stats && <LeaderboardCard stats={stats} />}

      <div className="bg-white dark:bg-slate-900 rounded-none shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-5 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Riwayat Donasi</p>
          </div>

          {/* Tab Switch */}
          <div className="flex gap-2">
            {[
              { id: 'received', label: '📥 Donasi Diterima' },
              { id: 'sent', label: '📤 Donasi Terkirim' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setHistoryTab(t.id);
                  setPage(1);
                  setStatusFilter(''); // reset filter saat ganti tab
                }}
                className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all ${
                  historyTab === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls hanya untuk Received */}
        {historyTab === 'received' && (
          <div className="px-6 md:px-10 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            {/* Eye Toggles */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowAmounts(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[10px] font-black transition-all border-2 ${
                  showAmounts ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400'
                }`}
              >
                {showAmounts ? <Eye size={12} /> : <EyeOff size={12} />} Nominal
              </button>
              <button
                onClick={() => setShowEmails(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[10px] font-black transition-all border-2 ${
                  showEmails ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400'
                }`}
              >
                {showEmails ? <Eye size={12} /> : <EyeOff size={12} />} Email
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1">
              {[
                { val: '', label: 'Semua' },
                { val: 'PAID', label: 'PAID' },
                { val: 'PENDING', label: 'Pending' },
                { val: 'EXPIRED', label: 'Expired' },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => {
                    setStatusFilter(f.val);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-none text-[10px] font-black transition-all ${
                    statusFilter === f.val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 text-xs text-green-500 font-bold">
              <span className="w-2 h-2 bg-green-400 rounded-none animate-pulse" />
              Auto 15s
              <button onClick={() => refetch()} disabled={isFetching} className="ml-1 text-slate-400 hover:text-indigo-600">
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          {historyTab === 'received' ? (
            /* ==================== RECEIVED TABLE ==================== */
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3">
                  <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-none animate-spin" />
                  Memuat riwayat...
                </div>
              ) : (
                <>
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        {['Donatur', 'Jumlah', 'Pesan', 'Media', 'Status', 'Waktu'].map((h, i) => (
                          <th key={h} className={`px-6 md:px-8 py-6 ${i === 4 ? 'text-center' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-slate-400 font-bold">
                            Belum ada donasi masuk
                          </td>
                        </tr>
                      ) : (
                        donations.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                            <td className="px-6 md:px-8 py-5">
                              <p className="font-black text-slate-700 dark:text-slate-200 text-sm">
                                {item.donorName || 'Anonim'}
                              </p>
                              <p className={`text-[10px] font-mono mt-0.5 transition-all ${showEmails ? 'text-slate-400' : 'text-slate-200 dark:text-slate-700 select-none'}`}>
                                {maskEmail(item.donorEmail)}
                              </p>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <p className={`font-black transition-all ${showAmounts ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700 select-none tracking-widest'}`}>
                                {maskAmount(item.amount)}
                              </p>
                            </td>
                            <td className="px-6 md:px-8 py-5 max-w-[200px]">
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic truncate">
                                {item.message ? `"${item.message}"` : <span className="text-slate-300 dark:text-slate-600 not-italic font-normal">-</span>}
                              </p>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              {item.mediaUrl ? (
                                <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 hover:text-purple-800">
                                  {item.mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />} Lihat
                                </a>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-6 md:px-8 py-5 text-center">
                              <span className={`px-3 py-1.5 rounded-none text-[10px] font-black tracking-widest ${
                                item.status === 'PAID' ? 'bg-green-100 dark:bg-green-950/40 text-green-600' :
                                item.status === 'EXPIRED' ? 'bg-red-100 dark:bg-red-950/40 text-red-400' :
                                'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                                {formatDate(item.createdAt)}
                              </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 disabled:opacity-40"
                      >
                        ← Sebelumnya
                      </button>
                      <span className="text-xs font-bold text-slate-400">
                        Halaman <span className="text-indigo-600">{page}</span> dari {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 disabled:opacity-40"
                      >
                        Berikutnya →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* ==================== SENT TABLE ==================== */
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  {['Kepada', 'Jumlah', 'Pesan', 'Status', 'Waktu'].map(h => (
                    <th key={h} className="px-6 md:px-8 py-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sentLoading ? (
                  <tr><td colSpan={5} className="text-center py-20">Memuat donasi terkirim...</td></tr>
                ) : (sentData?.donations || []).length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-slate-400 font-bold">Belum ada donasi terkirim</td></tr>
                ) : (
                  (sentData?.donations || []).map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                      <td className="px-6 md:px-8 py-5">
                        <p className="font-black text-slate-700 dark:text-slate-200">@{item.userId?.username || item.username || '-'}</p>
                      </td>
                      <td className="px-6 md:px-8 py-5 font-black text-indigo-600">
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 md:px-8 py-5 max-w-[250px]">
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic truncate">
                          {item.message || '-'}
                        </p>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-none text-[10px] font-black ${
                          item.status === 'PAID' ? 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400' : 
                          'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── FITUR BARU 3: CommunityPage dengan View Profile ─────────────────────────

const CommunityPage = ({ currentUserId, onFollowAction }) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab]     = useState('discover');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  // ── Profil modal ──
  const [viewingProfile, setViewingProfile] = useState(null); // username string

  const { data: discoverData,  isLoading: discoverLoading  } = useQuery({ queryKey: ['discover', search],           queryFn: () => fetchDiscover({ search }),        enabled: subTab === 'discover' });
  const { data: followersData, isLoading: followersLoading } = useQuery({ queryKey: ['myFollowers', currentUserId], queryFn: () => fetchMyFollowers(currentUserId),  enabled: subTab === 'followers' && !!currentUserId });
  const { data: followingData, isLoading: followingLoading } = useQuery({ queryKey: ['myFollowing', currentUserId], queryFn: () => fetchMyFollowing(currentUserId),  enabled: subTab === 'following' && !!currentUserId });

  const toggleMutation = useMutation({
    mutationFn: toggleFollowApi,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowers'] });
      queryClient.invalidateQueries({ queryKey: ['myFollowing'] });
      let user = null;
      if (subTab === 'discover')  user = discoverData?.users?.find(u => u._id === userId);
      if (subTab === 'followers') user = followersData?.users?.find(u => u._id === userId);
      if (subTab === 'following') user = followingData?.users?.find(u => u._id === userId);
      if (user && onFollowAction) onFollowAction(user.username, user.isFollowing ? 'unfollow' : 'follow');
    },
    onError: (err) => alert(err.response?.data?.message || 'Gagal mengubah follow'),
  });

  const subTabs = [
    { id: 'discover',  label: 'Discover',  count: discoverData?.pagination?.total },
    { id: 'followers', label: 'Followers',  count: followersData?.pagination?.total },
    { id: 'following', label: 'Following',  count: followingData?.pagination?.total },
  ];

  const UserBadges = ({ userId, showOnlyActive = true }) => {
    const { data: userBadges, isLoading } = useQuery({
      queryKey: ['userBadges', userId],
      queryFn: () => api.get(`/api/midtrans/badges/public/${userId}`).then(r => r.data),
      staleTime: 5 * 60 * 1000,
      enabled: !!userId,
    });

    // Skeleton
    if (isLoading) {
      return (
        <div className="flex gap-1.5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="w-12 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          ))}
        </div>
      );
    }

    const streamerBadges = userBadges?.badges?.streamer || {};
    const activeBadges = Object.entries(streamerBadges)
      .filter(([_, active]) => active)
      .map(([name]) => name);

    // ✅ JIKA KOSONG: Tampilkan "No Badges"
    if (activeBadges.length === 0) {
      return (
        <div className="flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-medium h-6">
          <p className='relative top-1.5 ml-1 uppercase'>
            No badges
          </p>
        </div>
      );
    }

    // ✅ ADA BADGES: Tampilkan badges
    return (
      <div className="flex gap-1.5 h-full">
        {activeBadges.map(name => (
          <Badge 
            key={name}
            type="streamer" 
            name={name} 
            active={true} 
          />
        ))}
      </div>
    );
  };

  const { data: badgesData } = useQuery({
    queryKey: ['userBadges'],
    queryFn: fetchBadges,
    staleTime: 5 * 60 * 1000, // 5 menit
  });

  const renderUsers = (users, isLoading, showFollowBtn = true) => {
    if (isLoading) return <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3"><div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-none animate-spin" />Memuat...</div>;
    if (!users?.length) return <div className="text-center py-20 text-slate-400"><p className="text-4xl mb-3">👥</p><p className="font-black text-slate-500">Belum ada streamer</p></div>;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u._id} className="bg-white dark:bg-slate-900 rounded-none p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all">
            
            {/* Avatar & Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-lg">
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 dark:text-slate-100 truncate">@{u.username}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{u.email}</p>
              </div>
            </div>
            
            {/* ✅ BADGES - Dengan "No Badges" */}
            <div className="flex flex-wrap gap-1.5 p-1 h-[44px] bg-slate-50/50 dark:bg-slate-800/50 rounded-none border border-slate-100/50 dark:border-slate-700/50">
              <UserBadges userId={u._id} showOnlyActive={true} />
            </div>
            
            {/* ✅ Followers - FIXED SYNTAX */}
            {u.followersCount !== undefined && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                <span className="text-indigo-600 dark:text-indigo-400 font-black">{u.followersCount}</span> followers
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              <button 
                onClick={() => setViewingProfile(u.username)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-none border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-all cursor-pointer active:scale-[0.97]"
              >
                <User size={12} /> Profil
              </button>
              
              {showFollowBtn && u._id !== currentUserId && (
                <button 
                  onClick={() => toggleMutation.mutate(u._id)} 
                  disabled={toggleMutation.isPending}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-none font-black text-xs transition-all disabled:opacity-60 cursor-pointer active:scale-[0.97] ${
                    u.isFollowing 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 border border-slate-200 dark:border-slate-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 shadow-sm'
                  }`}
                >
                  {toggleMutation.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : u.isFollowing ? 'Unfollow' : '+ Follow'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3 pb-6 min-h-[90vh]">
      {/* Profile modal */}
      {viewingProfile && (
        <StreamerProfileModal
          username={viewingProfile}
          currentUserId={currentUserId}
          onClose={() => setViewingProfile(null)}
          onFollow={null}
        />
      )}

      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-none p-4 md:p-6 text-white relative overflow-hidden">
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-none" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Streamer Network</p>
          <h2 className="text-3xl font-black tracking-tight">Community.</h2>
          <p className="text-indigo-200 text-sm font-medium mt-1">Temukan & ikuti sesama streamer</p>
        </div>
        <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[-10px] md:right-[-40px] w-[17%] -rotate-25 opacity-[90%]" />
        <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[130px] w-[7%] rotate-25 opacity-[90%]" />
      </div>

      <div className="gap-3 grid grid-cols-3 md:grid-cols-5">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`w-full cursor-pointer active:scale-[0.97] px-5 py-2.5 rounded-none font-black text-sm transition-all ${subTab === t.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 hover:brightness-[80%]'}`}>
            {t.label}
            {/* {t.count !== undefined && <span className={`ml-2 px-2 py-0.5 rounded-none text-[10px] ${subTab === t.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>{t.count}</span>} */}
          </button>
        ))}
        {subTab === 'discover' && (
          <div className="flex gap-3">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
              placeholder="Cari username streamer..."
              className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none px-5 py-2 font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 transition-all" />
            <button onClick={() => setSearch(searchInput)} className="cursor-pointer active:scale-[0.97] px-6 py-3.5 bg-indigo-600 text-white rounded-none font-black text-sm hover:bg-indigo-700 transition-all">Cari</button>
          </div>
        )}
      </div>


      {subTab === 'discover'  && renderUsers(discoverData?.users,  discoverLoading,  true)}
      {subTab === 'followers' && renderUsers(followersData?.users, followersLoading, false)}
      {subTab === 'following' && renderUsers(followingData?.users, followingLoading, true)}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const DashboardStreamer = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab]         = useState('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToast, setShowToast]         = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const [donationToasts, setDonationToasts] = useState([]);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    bio: '',
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: '',
  });
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copiedLabel, setCopiedLabel]     = useState('');
  const [copiedUrl, setCopiedUrl]         = useState('');
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followAction, setFollowAction]   = useState({ type: '', username: '' });
  const [navbar, setNavbar]               = useState(false);
  // ── FITUR BARU 1: saldo toggle ──
  const [showBalance, setShowBalance]     = useState(false);
  const { theme, toggle } = useTheme();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'], queryFn: fetchProfile, refetchInterval: 30000,
  });

  useEffect(() => {
    if (profileData && !localSettings) {
      const s = profileData.settings || profileData.overlaySetting || {};
      setLocalSettings({ ...DEFAULT_SETTINGS, ...s });
    }
  }, [profileData]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['settings','history','wallet','community','myDonations','profile','poll','subathon','milestones','leaderboard','contact','ghostAlert','admin'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const isSuperAdmin = useMemo(() => {
    const payload = getTokenPayload();
    return payload?.role === 'superAdmin';
  }, [profileData]);

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); },
    onError: (err) => {
      console.log('err', err)
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan')
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal update profil'),
  });

  const handleFollowAction = (username, actionType) => {
    setFollowAction({ type: actionType, username });
    setShowFollowModal(true);
  };

  useEffect(() => {
    if (profileData) {
      setProfileForm({
        username: profileData?.user?.username || profileData?.User?.username || '',
        email:    profileData?.user?.email    || profileData?.User?.email    || '',
        bio:      profileData?.user?.bio      || profileData?.User?.bio      || '',
        instagram: profileData?.user?.instagram || profileData?.User?.instagram || '',
        facebook:  profileData?.user?.facebook  || profileData?.User?.facebook  || '',
        youtube:   profileData?.user?.youtube   || profileData?.User?.youtube   || '',
        twitter:   profileData?.user?.twitter   || profileData?.User?.twitter   || '',
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
    const socket = io('https://server-dukungin-production.up.railway.app', { reconnection: true, reconnectionAttempts: 5, timeout: 10000 });
    socket.on('connect', () => socket.emit('join-room', overlayToken));
    socket.on('new-donation', (data) => {
      const id = Date.now();
      setDonationToasts(prev => [...prev, { id, ...data }]);
      queryClient.invalidateQueries({ queryKey: ['donationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['donationStats'] });
      setTimeout(() => setDonationToasts(prev => prev.filter(t => t.id !== id)), 7000);
    });
    socket.on('withdrawal-update', (data) => {
      const id = Date.now();
      setDonationToasts(prev => [...prev, { id, isWithdrawal: true, status: data.status, amount: data.amount, message: data.message }]);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setDonationToasts(prev => prev.filter(t => t.id !== id)), 8000);
    });
    return () => socket.disconnect();
  }, [user.overlayToken]);

  const settings = localSettings || DEFAULT_SETTINGS;
  const upd = (key, val) => {
    // Jika yang masuk adalah Event (dari input onChange yang lupa e.target.value)
    if (val && typeof val === 'object' && 'target' in val && 'nativeEvent' in val) {
      console.warn(`[upd] key="${key}" menerima Event bukan value — fix onChange di sini`);
      return;
    }
    setLocalSettings(s => ({ ...s, [key]: val }));
  };

  const copyToClipboard = (text, label = 'URL') => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setCopiedLabel(label);
    setShowCopyModal(true);
  };

  const TAB_TITLE = {
    settings: 'Dashboard', history: 'Riwayat', wallet: 'Wallet', community: 'Community',
    myDonations: 'Riwayat Berdonasi',     
    profile: 'Profil', poll: 'Poll & Voting', subathon: 'Subathon', milestones: 'Milestones',
    leaderboard: 'Leaderboard', contact: 'Contact', ghostAlert: 'Notif Hantu', admin: 'Admin',
  };

  // Masked balance display
  const displayBalance = showBalance
    ? `Rp ${Number(user.balance).toLocaleString('id-ID')}`
    : 'Rp ••••••';

    const isValidHex = (v) =>
  /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);

  const normalizeToPickerHex = (v) => {
    if (!v) return '#000000';
    // 3-digit → 6-digit
    if (/^#[0-9a-fA-F]{3}$/.test(v))
      return '#' + [...v.slice(1)].map(c => c + c).join('');
    // ambil 7 karakter pertama saja (strip alpha jika ada)
    return v.slice(0, 7);
  };

  const ColorInput = React.memo(({ label, value, onChange, allowAlpha = false }) => {
    const [raw, setRaw] = useState(value);

    // ✅ useCallback untuk stabilkan fungsi
    const handleTextChange = useCallback((e) => {
      const v = e.target.value;
      setRaw(v);
      const clean = allowAlpha ? v : v.slice(0, 7);
      onChange(clean);
    }, [onChange, allowAlpha]);

    const handleTextBlur = useCallback(() => {
      if (!isValidHex(raw)) {
        setRaw(value);
        onChange(value);
      }
    }, [raw, value, onChange]);

    const handlePickerChange = useCallback((e) => {
      const picked = e.target.value;
      if (allowAlpha) {
        const alpha = isValidHex(value) && value.length === 9 ? value.slice(7, 9) : '';
        const next = picked + alpha;
        setRaw(next);
        onChange(next);
      } else {
        setRaw(picked);
        onChange(picked);
      }
    }, [value, onChange, allowAlpha]);

    // ✅ useMemo untuk stabilkan computed values
    const pickerHex = useMemo(() => 
      normalizeToPickerHex(isValidHex(raw) ? raw : value), 
      [raw, value]
    );
    
    const previewColor = useMemo(() => 
      isValidHex(raw) ? raw : value, 
      [raw, value]
    );

    // ✅ Sinkron raw dengan value dari parent
    useEffect(() => {
      setRaw(value);
    }, [value]);

    return (
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {/* Picker */}
          <div className="w-10 h-10 flex-shrink-0 rounded-none overflow-hidden border border-slate-300 dark:border-slate-600 cursor-pointer relative">
            <input
              type="color"
              value={pickerHex}
              onChange={handlePickerChange}
              className="absolute inset-0 w-[200%] h-[200%] translate-x-[-25%] translate-y-[-25%] border-0 p-0 cursor-pointer"
            />
          </div>

          {/* Text input */}
          <input
            type="text"
            value={raw}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            spellCheck={false}
            placeholder={allowAlpha ? '#rrggbbaa' : '#rrggbb'}
            maxLength={allowAlpha ? 9 : 7}
            className="w-28 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
          />

          {/* Preview bar */}
          <div
            className="flex-1 h-10 rounded-none border border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: previewColor }}
            title={previewColor}
          />
        </div>
      </div>
    );
  });

ColorInput.displayName = 'ColorInput';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans pb-0 text-slate-900 dark:text-slate-100">

      {/* ── Modal Copy URL ── */}
      <AnimatePresence>
        {showCopyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowCopyModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-none md:max-w-sm max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-6 mt-1 md:mt-2 bg-green-100 dark:bg-green-950/40 rounded-none flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">URL Tersalin!</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Widget <span className="font-bold text-indigo-600 dark:text-indigo-400">{copiedLabel}</span> berhasil disalin.</p>
                <button onClick={() => setShowCopyModal(false)} className="cursor-pointer hover:brightness-90 w-full py-4 bg-slate-900 dark:bg-slate-700 text-white font-black rounded-none transition-all active:scale-[0.99]">OK, Mengerti</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Follow ── */}
      <AnimatePresence>
        {showFollowModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowFollowModal(false)}>
            <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-none max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="p-8 text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-none flex items-center justify-center text-5xl ${followAction.type === 'follow' ? 'bg-green-100 dark:bg-green-950/40' : 'bg-orange-100 dark:bg-orange-950/40'}`}>
                  {followAction.type === 'follow' ? '🤝' : '👋'}
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{followAction.type === 'follow' ? 'Berhasil Follow!' : 'Berhasil Unfollow'}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8">Kamu {followAction.type === 'follow' ? 'sekarang mengikuti' : 'tidak lagi mengikuti'} <span className="font-bold text-indigo-600 dark:text-indigo-400">@{followAction.username}</span></p>
                <button onClick={() => setShowFollowModal(false)} className="cursor-pointer hover:brightness-90 w-full py-4 bg-slate-900 dark:bg-slate-700 text-white font-black rounded-none transition-all active:scale-[0.97]">OK, Mengerti</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Save Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-none shadow-2xl flex items-center gap-3 font-bold border border-white/10 backdrop-blur-md">
            <CheckCircle2 size={18} className="text-green-500" /> Pengaturan Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Donation Toast ── */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {donationToasts.map(toast => (
            <motion.div key={toast.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-none p-5 shadow-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4">
              {toast.isWithdrawal
                ? <div className={`w-12 h-12 rounded-none flex items-center justify-center text-white text-xl flex-shrink-0 ${toast.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.status === 'COMPLETED' ? '✓' : '✕'}</div>
                : <div className="w-12 h-12 bg-indigo-600 rounded-none flex items-center justify-center flex-shrink-0">{renderIconPreview(settings.customIcon, 24)}</div>
              }
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest ${toast.isWithdrawal ? (toast.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-red-500') : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {toast.isWithdrawal ? (toast.status === 'COMPLETED' ? 'Penarikan Berhasil!' : 'Penarikan Gagal') : toast.isTestAlert ? '🧪 Test Alert!' : 'Donasi Masuk!'}
                </span>
                <p className="text-slate-700 dark:text-slate-200 text-sm font-medium mt-1">{toast.message}</p>
              </div>
              <button onClick={() => setDonationToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors flex-shrink-0 text-lg leading-none">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Mobile Navbar ── */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-3 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 p-2 bg-red-200 rounded-none flex items-center justify-center"><img src="/jellyfish.png" alt="icon" /></div>
          <span className="font-black text-lg tracking-tight text-slate-800 dark:text-slate-100">TTT</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="h-[40px] cursor-pointer active:scale-[0.97] flex items-center gap-2 px-3 rounded-none border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={() => setActiveTab('contact')} className={`h-[40px] cursor-pointer active:scale-[0.97] flex items-center gap-2 px-3 rounded-none border shadow-none font-medium text-md transition-all ${activeTab === 'contact' ? 'bg-slate-800 dark:bg-slate-700 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
            <HeadphonesIcon size={14} />
          </button>
          <button onClick={() => setActiveTab('community')} className="h-[40px] cursor-pointer hover:brightness-90 active:scale-[0.97] relative flex items-center gap-2 px-3 py-3 rounded-none font-medium text-md overflow-hidden" style={{ background: 'linear-gradient(90deg, #0f0c29, #302b63, #24243e, #0f0c29)', backgroundSize: '300% 100%', animation: 'rainbowSlide 3s ease-in-out infinite' }}>
            <Users size={16} className="relative z-10 text-white" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="h-[40px] cursor-pointer active:scale-[0.97] p-2 bg-white dark:bg-slate-800 rounded-none text-slate-600 dark:text-slate-400">
            <Menu size={24} />
          </button>
        </div>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 mt-22 md:mt-0 md:w-8xl z-[2] mx-auto w-full relative">
        {/* ── TopNavbar: pass showBalance & toggle ── */}
        <TopNavbar user={user} navbar={navbar}
          showBalance={showBalance}
          onToggleBalance={() => setShowBalance(v => !v)}
          displayBalance={displayBalance}
          onLogout={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
          onProfile={() => setActiveTab('profile')}
          activeTab={activeTab} setActiveTab={setActiveTab}
        />

        <div className="relative md:mt-[-14px] px-3 md:px-7 lg:py-11 w-full">
         

          <AnimatePresence mode="wait">

            {activeTab === 'community' && (
              <motion.div key="community" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <CommunityPage currentUserId={profileData?.user?._id || profileData?.User?._id} onFollowAction={handleFollowAction} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <section className="xl:col-span-7 space-y-6">

                  
                  {/* ── Konfigurasi Alert ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800">
                    <SectionHeader icon={<Settings size={20} />} title="Konfigurasi Alert" color="bg-indigo-500" />
                    <div className="mt-8 space-y-6">
                      {/* Toggles */}
                      {[
                        { key: 'overlayEnabled', label: 'Aktifkan Overlay OBS',  desc: 'Alert tidak akan muncul di OBS sama sekali' },
                        { key: 'showTimestamp',  label: 'Tampilkan Jam Donasi',  desc: 'Waktu kapan donasi diterima overlay' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-none border border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="font-black text-slate-700 dark:text-slate-200 text-sm">{label}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{desc}</p>
                          </div>
                          <button onClick={() => upd(key, !settings[key])}
                            className={`relative inline-flex h-7 w-14 items-center rounded-none transition-colors duration-300 cursor-pointer focus:outline-none ${settings[key] ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-none bg-white shadow-md transition-transform duration-300 ${settings[key] ? 'translate-x-8' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      ))}

                      {/* Donate URL */}
                      <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-none border border-slate-100/10 mb-2">
                        <label className="block text-[10px] font-black bg-emerald-300 w-max text-slate-700 mb-2 uppercase tracking-widest px-2 rounded">DONATE URL</label>
                        <div className="flex gap-3">
                          <input readOnly value={`https://taptiptup.vercel.app/donate/${user.username}`} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold outline-none overflow-hidden text-ellipsis" />
                          <button onClick={() => copyToClipboard(`https://taptiptup.vercel.app/donate/${user.username}`)} className="text-slate-400 hover:text-indigo-600 cursor-pointer active:scale-[0.98]"><Copy size={18} /></button>
                        </div>
                      </div>

                      {/* Icon Alert */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Icon Alert</label>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {ICON_PRESETS.map(({ emoji, label }) => (
                            <button key={emoji} onClick={() => upd('customIcon', emoji === '💜' ? '' : emoji)} title={label}
                              className={`flex flex-col items-center gap-1 p-3 rounded-none border-2 text-lg transition-all cursor-pointer active:scale-[0.95] ${
                                (settings.customIcon || '💜') === emoji || (!settings.customIcon && emoji === '💜')
                                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 bg-slate-50 dark:bg-slate-800'
                              }`}>
                              <span>{emoji}</span>
                              <span className="text-[8px] font-black text-slate-400 leading-none">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <InputField label="Minimal Donasi" type="number" value={settings.minDonate} onChange={v => upd('minDonate', v)} />
                      <InputField label="Maksimal Donasi" type="number" value={settings.maxDonate} onChange={v => upd('maxDonate', v)} />
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">Tema Visual</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {['modern', 'classic', 'minimal'].map(t => (
                            <button key={t} onClick={() => upd('theme', t)}
                              className={`cursor-pointer active:scale-[0.97] py-4 rounded-none border-2 transition-all font-black text-sm capitalize ${settings.theme === t ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-md' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Posisi Overlay di Layar</label>
                        <select value={settings.overlayPosition || 'bottom-right'} onChange={e => upd('overlayPosition', e.target.value)}
                          className="w-full px-5 py-3 mt-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all">
                          <option value="top-left">Kiri Atas</option><option value="top-right">Kanan Atas</option>
                          <option value="bottom-left">Kiri Bawah</option><option value="bottom-right">Kanan Bawah</option>
                          <option value="top-center">Tengah Atas</option><option value="bottom-center">Tengah Bawah</option>
                        </select>
                      </div>
                      {/* <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Animasi Masuk</label>
                        <select value={settings.animation} onChange={e => upd('animation', e.target.value)}
                          className="w-full p-5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-none font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all">
                          <option value="bounce">Bounce</option><option value="slide-left">Slide Kiri</option>
                          <option value="slide-right">Slide Kanan</option><option value="fade">Fade</option>
                        </select>
                      </div> */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">
                          Lebar Maks Overlay OBS <span className="text-indigo-500 normal-case font-bold ml-1">({settings.maxWidth || 280}px)</span>
                        </label>
                        <input type="range" min={180} max={600} step={10} value={settings.maxWidth || 280} onChange={e => upd('maxWidth', Number(e.target.value))} className="w-full accent-indigo-600" />
                        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 px-0.5"><span>180px</span><span>390px</span><span>600px</span></div>
                      </div>
                    </div>

                    {/* ── Warna Alert dengan Preview ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                      {[
                        { key: 'primaryColor',   label: 'Background Alert',  fallback: '#6366f1' },
                        { key: 'highlightColor', label: 'Highlight Nominal', fallback: '#a5b4fc' },
                        { key: 'textColor',      label: 'Warna Teks',        fallback: '#ffffff' },
                      ].map(({ key, label, fallback }) => {
                        const val = settings[key] || fallback;
                        return (
                          <ColorInput
                            key={key}
                            label={label}
                            value={val}
                            onChange={v => upd(key, v)}
                          />
                        );
                      })}

                      {/* Border — punya alpha component */}
                      <ColorInput
                        label="Warna Border"
                        value={settings.borderColor || '#ffffff26'}
                        onChange={v => upd('borderColor', v)}
                        allowAlpha
                      />
                    </div>
                    <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
                      className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-none font-black text-sm transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2 mt-8">
                      <Save size={20} />{saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Overlay Terbaru'}
                    </button>
                  </div>

                  {/* ── FITUR BARU 4: Instant Test Alert (di atas segalanya) ── */}
                  <InstantTestAlert 
                    overlayToken={user.overlayToken} 
                    settings={settings} 
                    user={user} 
                  />

                  <InstantTestMediaShare 
                    overlayToken={user.overlayToken} 
                    settings={settings} 
                    user={user} 
                  />

                  {/* ── FITUR BARU 2: Quick Nominal Editor ── */}
                  <QuickAmountsEditor 
                    amounts={settings.quickAmounts || DEFAULT_SETTINGS.quickAmounts} 
                    onChange={v => upd('quickAmounts', v)} 
                    saveSettingsMutation={saveSettingsMutation} 
                    settings={settings} 
                  />

                  {/* ── Durasi ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800">
                    <SectionHeader icon={<Timer size={20} />} title="Durasi Tampil per Nominal" color="bg-amber-500" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-3 mb-6">Atur berapa lama alert muncul berdasarkan nominal donasi.</p>
                    <DurationTiersEditor saveSettingsMutation={saveSettingsMutation} settings={settings} tiers={settings.durationTiers || []} onChange={v => upd('durationTiers', v)} />
                  </div>

                  {/* ── Media ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800 space-y-7">
                    <SectionHeader icon={<ImageIcon size={20} />} title="Izinkan Donor Kirim Media" color="bg-purple-500" />
                    <MediaTriggersEditor saveSettingsMutation={saveSettingsMutation} settings={settings} triggers={settings.mediaTriggers || []} onChange={v => upd('mediaTriggers', v)} />
                  </div>

                  {/* ── Sound ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800">
                    <SectionHeader icon={<span className="text-lg">🔊</span>} title="Custom Suara per Nominal" color="bg-violet-500" />
                    <div className="mb-6 mt-5">
                      <SoundPicker label="Suara Default (semua donasi)" value={settings.soundUrl || ''} onChange={v => upd('soundUrl', v)} />
                    </div>
                    <SoundTiersEditor saveSettingsMutation={saveSettingsMutation} settings={settings} tiers={settings.soundTiers || []} onChange={v => upd('soundTiers', v)} />
                  </div>

                  <BannedWordsEditor saveSettingsMutation={saveSettingsMutation} settings={settings} />
                  <MilestonesEditor />

                  {/* ── OBS URL ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-none border-2 border-dashed border-slate-200 dark:border-slate-700 mb-8">
                      <label className="block text-[10px] font-black bg-emerald-300 w-max text-slate-700 mb-2 uppercase tracking-widest px-2 rounded">URL ALERT - OBS</label>
                      <div className="flex gap-3">
                        <input readOnly value={user.overlayUrl} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold outline-none overflow-hidden text-ellipsis" />
                        <button onClick={() => copyToClipboard(user.overlayUrl)} className="text-slate-400 hover:text-indigo-600 cursor-pointer active:scale-[0.98]"><Copy size={18} /></button>
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-none border-2 border-dashed border-slate-200 dark:border-slate-700 mb-8">
                      <label className="block text-[10px] font-black bg-emerald-300 w-max text-slate-700 mb-2 uppercase tracking-widest px-2 rounded">URL MEDIASHARE - OBS</label>
                      <div className="flex gap-3">
                        <input readOnly value={`${window.location.origin}/overlay/${user.overlayToken}/mediashare`} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold outline-none overflow-hidden text-ellipsis" />
                        <button onClick={() => copyToClipboard(`${window.location.origin}/overlay/${user.overlayToken}/mediashare`)} className="text-slate-400 hover:text-indigo-600 cursor-pointer active:scale-[0.98]"><Copy size={18} /></button>
                      </div>
                    </div>
                    <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
                      className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-none font-black text-sm transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-70 flex items-center justify-center gap-2">
                      <Save size={20} />{saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                    </button>
                  </div>

                  {/* ── Widget URLs ── */}
                  <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-6 shadow-xs border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex justify-between items-center gap-2 mb-5">
                      <span className="text-xl font-black text-slate-900 dark:text-slate-100">Widget URLs untuk OBS</span>
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-none text-[9px] font-black uppercase tracking-widest">Browser Source</span>
                    </div>
                    {[
                      { label: 'Milestones',   emoji: '🎯', path: 'milestones',  desc: 'Progress bar target donasi',         size: '400×280px' },
                      { label: 'Leaderboard',  emoji: '🏆', path: 'leaderboard', desc: 'Top 10 donor terbesar',              size: '360×420px' },
                      { label: 'QR Code',      emoji: '◼',  path: 'qrcode',      desc: 'QR scan ke halaman donasi',          size: '280×320px' },
                      { label: 'Poll',         emoji: '🗳️', path: 'poll',        desc: 'Voting poll live',                   size: '420×300px' },
                      { label: 'Subathon',     emoji: '⏱',  path: 'subathon',    desc: 'Timer subathon',                     size: '360×180px' },
                      ].map(({ label, emoji, path, customUrl, desc, size }) => {
                        const widgetUrl = customUrl ?? `${window.location.origin}/widget/${user.overlayToken}/${path}`;
                      return (
                        <div key={path} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-none p-4 border border-slate-200 dark:border-slate-700">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-none flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{label}</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{size}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{desc}</p>
                            <p className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 truncate mt-0.5">{widgetUrl}</p>
                          </div>
                          <button onClick={() => copyToClipboard(widgetUrl, label)} className="cursor-pointer active:scale-[0.97] p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-slate-500 rounded-none transition-all flex-shrink-0">
                            <Copy size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="xl:col-span-5 z-[2]">
                  <YouTubeLivePreview settings={settings} username={user.username} testFullScreen={() => setNavbar(!navbar)} />
                </section>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <HistoryPage />
              </motion.div>
            )}

            {activeTab === 'myDonations' && (
              <motion.div key="myDonations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <MyDonationsHistory />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-3 pb-6">
                
                {/* ── Header dengan Badges ── */}
                <div className="bg-indigo-600 rounded-none px-6 py-6 text-white relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-none flex items-center justify-center text-5xl font-black text-slate-900 shadow-xl">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h2 className="text-3xl font-black text-white tracking-tighter">@{user.username}</h2>
                        <span className="px-4 py-1.5 bg-green-100 relative top-1 text-green-600 rounded-none text-[10px] font-black uppercase tracking-widest border border-green-200">Verified Creator</span>
                      </div>
                      
                      <p className="text-slate-200 font-medium text-sm">{user.email}</p>
                    </div>
                  </div>
                  <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-[90%]" />
                  <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[130px] w-[7%] rotate-25 opacity-[90%]" />
                </div>
                
                {/* ✅ SHOW ALL BADGES - Active & Locked */}
                <div className="flex w-full flex-wrap gap-1.5 justify-center md:justify-start bg-gradient-to-r from-slate-50/50 to-indigo-50/30 dark:from-slate-900/50 dark:to-indigo-900/20 p-3 py-2 border border-slate-100/20 dark:border-slate-700/50 backdrop-blur-sm rounded-xl shadow-sm">
                  {/* 10K */}
                  <Badge 
                    type="streamer" 
                    name="10k" 
                    active={profileData.user.donationMilestones?.['10k'] || false} 
                  />
                  
                  {/* 50K */}
                  <Badge 
                    type="streamer" 
                    name="50k" 
                    active={profileData.user.donationMilestones?.['50k'] || false} 
                  />
                  
                  {/* 100K */}
                  <Badge 
                    type="streamer" 
                    name="100k" 
                    active={profileData.user.donationMilestones?.['100k'] || false} 
                  />
                  
                  {/* 500K */}
                  <Badge 
                    type="streamer" 
                    name="500k" 
                    active={profileData.user.donationMilestones?.['500k'] || false} 
                  />
                  
                  {/* 1JT */}
                  <Badge 
                    type="streamer" 
                    name="1jt" 
                    active={profileData.user.donationMilestones?.['1jt'] || false} 
                  />
                </div>

                {/* Profil Publik */}
                <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <SectionHeader icon={<User size={18} />} title="Profil Publik" color="bg-indigo-500" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                    <div className="md:col-span-2 mb-1">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest ml-1">
                        Link Halaman Donasi
                      </label>
                      <div className="flex gap-2">
                        <input readOnly value={`${window.location.origin}/donate/${user.username}`} 
                          className="flex-1 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-100 dark:border-indigo-900 rounded-none p-5 font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold outline-none" />
                        <button onClick={() => copyToClipboard(`${window.location.origin}/donate/${user.username}`)} 
                          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-none transition-all flex items-center justify-center active:scale-95">
                          <Copy size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <InputField label="Display Name" value={profileForm.username} 
                      onChange={v => setProfileForm(f => ({ ...f, username: v }))} />

                    <InputField label="Email Address" type="email" value={profileForm.email} 
                      onChange={v => setProfileForm(f => ({ ...f, email: v }))} />

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                        Bio Singkat
                      </label>
                      <textarea 
                        value={profileForm.bio} 
                        onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none font-bold outline-none focus:border-indigo-500 h-32 transition-all" 
                        placeholder="Ceritakan tentang kontenmu..." 
                      />
                    </div>

                    {/* Social Media */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">Social Media</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField 
                          label="Instagram" 
                          value={profileForm.instagram} 
                          placeholder="@username" 
                          onChange={v => setProfileForm(f => ({ ...f, instagram: v }))} 
                        />
                        <InputField 
                          label="Facebook" 
                          value={profileForm.facebook} 
                          placeholder="facebook.com/username" 
                          onChange={v => setProfileForm(f => ({ ...f, facebook: v }))} 
                        />
                        <InputField 
                          label="YouTube" 
                          value={profileForm.youtube} 
                          placeholder="youtube.com/@channel" 
                          onChange={v => setProfileForm(f => ({ ...f, youtube: v }))} 
                        />
                        <InputField 
                          label="X / Twitter" 
                          value={profileForm.twitter} 
                          placeholder="@username" 
                          onChange={v => setProfileForm(f => ({ ...f, twitter: v }))} 
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <button 
                        onClick={() => updateProfileMutation.mutate(profileForm)} 
                        disabled={updateProfileMutation.isPending}
                        className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none font-black text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <Save size={20} />
                        {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                      </button>
                    </div>
                  </div>
                </div>
                <QrCodeCard username={user.username} />
              </motion.div>
            )}

            {activeTab === 'wallet' && <WithdrawPage />}
            {activeTab === 'ghostAlert' && isSuperAdmin && <GhostAlertPage />}

            {activeTab === 'admin' && isSuperAdmin && (
              <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <AdminWithdrawalPage />
              </motion.div>
            )}

            {activeTab === 'admin' && !isSuperAdmin && (
              <motion.div key="forbidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-slate-400">
                <p className="text-6xl mb-4">🔒</p>
                <p className="font-black text-xl">Akses Ditolak</p>
                <p className="font-medium text-sm mt-2">Halaman ini hanya untuk Super Admin</p>
              </motion.div>
            )}

            {activeTab === 'poll' && (
              <motion.div key="poll" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                  <SectionHeader icon={<Vote size={20} />} title="Poll & Voting" color="bg-violet-500" />
                  <PollManager overlayToken={user.overlayToken} username={currentUser.username} />
                </div>
              </motion.div>
            )}

            {activeTab === 'milestones' && <MilestonesManager overlayToken={user?.overlayToken} />}

            {activeTab === 'subathon' && (
              <motion.div key="subathon" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                  {/* <SectionHeader icon={<Timer size={20} />} title="Subathon Timer" color="bg-indigo-500" /> */}
                  <SubathonManager overlayToken={user.overlayToken} />
                </div>
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                  {/* <SectionHeader icon={<Trophy size={20} />} title="Pengaturan Leaderboard" color="bg-amber-500" /> */}
                  <LeaderboardSettings overlayToken={user?.overlayToken} />
                </div>
              </motion.div>
            )}

            {activeTab === 'contact' && <ContactPage />}

          </AnimatePresence>
        </div>
      </main>

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden" />
      )}
    </div>
  );
};