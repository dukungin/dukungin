import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Radio,
  Send,
  ShieldAlert,
  User2,
  Video,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const formatRp = (n) => {
  if (!n) return '–';
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
};

const PRESET_AMOUNTS = [
  { label: '10K', value: 10000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '500K', value: 500000 },
  { label: '1jt', value: 1000000 },
];

const PRESET_MESSAGES = [
  'Mantap banget streamernya! 🔥',
  'GG bro, keep it up!',
  'Semangat terus, ditunggu konten selanjutnya!',
  'Test donasi dari admin 👑',
];

const MEDIA_TYPES = [
  { value: 'image', label: 'Gambar / GIF' },
  { value: 'video', label: 'Video Langsung' },
  { value: 'youtube', label: 'YouTube' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, scale: 0.96 }}
    transition={{ duration: 0.25 }}
    className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl font-bold text-sm ${
      type === 'success'
        ? 'bg-emerald-600 text-white'
        : 'bg-red-600 text-white'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
    {message}
  </motion.div>
);

// ─── Streamer Select Dropdown ─────────────────────────────────────────────────
const StreamerSelect = ({ streamers, value, onChange, loading }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = streamers.find((s) => s._id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="cursor-pointer w-full flex items-center justify-between gap-3 px-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-200 focus:border-indigo-400 outline-none transition-all font-bold text-sm text-slate-700"
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {selected.username?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">@{selected.username}</span>
            </>
          ) : (
            <>
              <User2 size={16} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-400 font-medium">
                {loading ? 'Memuat streamer...' : 'Pilih streamer target...'}
              </span>
            </>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {streamers.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400 font-medium">
                Tidak ada streamer ditemukan
              </div>
            ) : (
              streamers.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => { onChange(s._id); setOpen(false); }}
                  className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                    s._id === value ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {s.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">@{s.username}</p>
                    {s.email && (
                      <p className="text-xs text-slate-400 truncate">{s.email}</p>
                    )}
                  </div>
                  {s._id === value && (
                    <CheckCircle2 size={14} className="ml-auto flex-shrink-0 text-indigo-500" />
                  )}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Log Entry ────────────────────────────────────────────────────────────────
const LogEntry = ({ entry }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0"
  >
    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
      entry.status === 'ok' ? 'bg-emerald-400' : 'bg-red-400'
    }`} />
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-slate-700 truncate">
        @{entry.streamer} — {formatRp(entry.amount)}
      </p>
      {entry.message && (
        <p className="text-[10px] text-slate-400 italic truncate">"{entry.message}"</p>
      )}
      <p className="text-[10px] text-slate-300 mt-0.5 font-mono">{entry.time}</p>
    </div>
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 ${
      entry.status === 'ok'
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-red-50 text-red-500'
    }`}>
      {entry.status === 'ok' ? 'SENT' : 'ERR'}
    </span>
  </motion.div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const GhostAlertPage = () => {
  // Auth guard
  const payload = getTokenPayload();
  const isSuperAdmin = payload?.role === 'superAdmin';

  const [streamers, setStreamers] = useState([]);
  const [loadingStreamers, setLoadingStreamers] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [log, setLog] = useState([]);

  const [form, setForm] = useState({
    targetUserId: '',
    donorName: 'SuperAdmin 👑',
    amount: 50000,
    message: '',
    mediaUrl: '',
    mediaType: 'image',
  });

  const toastTimeout = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  // Fetch daftar streamer
  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoadingStreamers(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => {
        const users = res.data?.users || res.data || [];
        setStreamers(users);
      })
      .catch(() => {
        // fallback: coba endpoint lain
        axios
          .get(`${import.meta.env.VITE_API_URL}/api/overlay/admin/streamers`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
          .then((res) => setStreamers(res.data || []))
          .catch(() => showToast('Gagal memuat daftar streamer', 'error'));
      })
      .finally(() => setLoadingStreamers(false));
  }, [isSuperAdmin]);

  const handleSend = async () => {
    if (!form.targetUserId) return showToast('Pilih streamer target terlebih dahulu', 'error');
    if (!form.amount || form.amount < 1000) return showToast('Nominal minimal Rp 1.000', 'error');

    setSending(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/midtrans/ghost-alert`,
        {
          targetUserId: form.targetUserId,
          donorName: form.donorName || 'SuperAdmin 👑',
          amount: Number(form.amount),
          message: form.message,
          mediaUrl: form.mediaUrl.trim() || null,
          mediaType: form.mediaUrl.trim() ? form.mediaType : null,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const streamer = streamers.find((s) => s._id === form.targetUserId);
      setLog((prev) => [
        {
          streamer: streamer?.username || form.targetUserId,
          amount: form.amount,
          message: form.message,
          status: 'ok',
          time: new Date().toLocaleTimeString('id-ID'),
        },
        ...prev.slice(0, 19),
      ]);

      showToast(`Alert berhasil dikirim ke @${streamer?.username}! 🚀`);
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Gagal mengirim alert';
      const streamer = streamers.find((s) => s._id === form.targetUserId);
      setLog((prev) => [
        {
          streamer: streamer?.username || form.targetUserId,
          amount: form.amount,
          message: form.message,
          status: 'error',
          time: new Date().toLocaleTimeString('id-ID'),
        },
        ...prev.slice(0, 19),
      ]);
      showToast(errMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  // ── Unauthorized ─────────────────────────────────────────────────────────
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-6">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-400 font-medium">Halaman ini hanya untuk SuperAdmin.</p>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">

      {/* Toast */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
        <AnimatePresence>
          {toast && (
            <Toast
              key={toast.message}
              message={toast.message}
              type={toast.type}
              onDismiss={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-200 flex-shrink-0">
          <Zap size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 leading-none">Ghost Alert</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Kirim overlay alert ke streamer tanpa transaksi pembayaran
          </p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-xl">
          <ShieldAlert size={13} className="text-violet-600" />
          <span className="text-[11px] font-black text-violet-600 uppercase tracking-wider">SuperAdmin Only</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Form Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-7 space-y-6"
        >
          {/* Streamer Target */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Streamer Target
            </label>
            <StreamerSelect
              streamers={streamers}
              value={form.targetUserId}
              onChange={(id) => setForm({ ...form, targetUserId: id })}
              loading={loadingStreamers}
            />
          </div>

          {/* Donor Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Nama Pengirim
            </label>
            <input
              type="text"
              value={form.donorName}
              onChange={(e) => setForm({ ...form, donorName: e.target.value })}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white outline-none font-bold text-sm text-slate-700 transition-all"
              placeholder="Nama yang muncul di overlay..."
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Nominal (digunakan untuk trigger media & durasi)
            </label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, amount: p.value })}
                  className={`cursor-pointer active:scale-[0.96] py-2.5 rounded-xl font-black text-sm transition-all border-2 ${
                    form.amount === p.value
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-sm pointer-events-none">Rp</span>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full p-4 pl-12 rounded-2xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white outline-none transition-all"
                placeholder="Custom nominal..."
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Pesan
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => setForm({ ...form, message: msg })}
                  className="cursor-pointer px-3 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-all"
                >
                  {msg}
                </button>
              ))}
            </div>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white outline-none min-h-[80px] font-medium text-sm text-slate-700 transition-all resize-none"
              placeholder="Isi pesan overlay (opsional)..."
            />
          </div>

          {/* Media (Optional) */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Video size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Media Alert (Opsional)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MEDIA_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setForm({ ...form, mediaType: mt.value })}
                  className={`cursor-pointer py-2 rounded-xl font-bold text-xs transition-all border-2 ${
                    form.mediaType === mt.value
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-purple-200 hover:text-purple-600'
                  }`}
                >
                  {mt.label}
                </button>
              ))}
            </div>

            <input
              type="url"
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              className="w-full p-3.5 rounded-xl bg-white border-2 border-slate-100 focus:border-purple-300 outline-none font-mono text-xs text-slate-700 transition-all placeholder:font-sans placeholder:text-slate-400"
              placeholder="https://i.imgur.com/... atau https://youtu.be/..."
            />
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleSend}
            disabled={sending || !form.targetUserId || !form.amount}
            className="cursor-pointer w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all"
          >
            {sending ? (
              <><Loader2 size={18} className="animate-spin" /> Mengirim Alert...</>
            ) : (
              <><Send size={18} /> Kirim Ghost Alert {form.amount ? `(${formatRp(form.amount)})` : ''}</>
            )}
          </motion.button>
        </motion.div>

        {/* ── Right Panel: Info + Log ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <Radio size={16} className="text-indigo-200" />
              <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Cara Kerja</p>
            </div>
            <div className="space-y-3">
              {[
                { step: '01', text: 'Pilih streamer target dan isi form' },
                { step: '02', text: 'Nominal digunakan untuk trigger media & durasi overlay' },
                { step: '03', text: 'Alert langsung dikirim ke OBS via Socket.IO' },
                { step: '04', text: 'Tidak ada transaksi Midtrans yang dibuat' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="text-[10px] font-black text-indigo-300 mt-0.5 flex-shrink-0 w-5">{item.step}</span>
                  <p className="text-xs text-indigo-100 font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Log Aktivitas</p>
              {log.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLog([])}
                  className="cursor-pointer text-[10px] font-bold text-slate-300 hover:text-red-400 transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>

            <div className="px-5 py-2 max-h-72 overflow-y-auto">
              <AnimatePresence>
                {log.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-10 text-center"
                  >
                    <p className="text-sm text-slate-300 font-bold">Belum ada aktivitas</p>
                    <p className="text-[10px] text-slate-200 mt-1">Alert yang terkirim akan muncul di sini</p>
                  </motion.div>
                ) : (
                  log.map((entry, i) => <LogEntry key={i} entry={entry} />)
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GhostAlertPage;