// StreamerExtras.jsx
// Komponen: PollManager, SubathonManager, LeaderboardSettings
// Integrasi ke DashboardStreamer.jsx — lihat petunjuk di bawah

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Timer,
  Trash2,
  Trophy,
  Vote,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ─── API Calls ────────────────────────────────────────────────────────────────

// Poll
const fetchMyPolls  = async () => (await axios.get(`${BASE_URL}/api/polls`, { headers: authHeader() })).data;
const createPoll    = async (d) => (await axios.post(`${BASE_URL}/api/polls`, d, { headers: authHeader() })).data;
const closePoll     = async (id) => (await axios.post(`${BASE_URL}/api/polls/${id}/close`, {}, { headers: authHeader() })).data;
const deletePoll    = async (id) => (await axios.delete(`${BASE_URL}/api/polls/${id}`, { headers: authHeader() })).data;

// Subathon
const fetchSubathon   = async () => (await axios.get(`${BASE_URL}/api/subathon`, { headers: authHeader() })).data;
const updateSubConfig = async (d) => (await axios.put(`${BASE_URL}/api/subathon/config`, d, { headers: authHeader() })).data;
const startSubathon   = async () => (await axios.post(`${BASE_URL}/api/subathon/start`, {}, { headers: authHeader() })).data;
const pauseSubathon   = async () => (await axios.post(`${BASE_URL}/api/subathon/pause`, {}, { headers: authHeader() })).data;
const resetSubathon   = async () => (await axios.post(`${BASE_URL}/api/subathon/reset`, {}, { headers: authHeader() })).data;
const addTimeSubathon = async (s) => (await axios.post(`${BASE_URL}/api/subathon/add-time`, { seconds: s }, { headers: authHeader() })).data;

// Leaderboard (overlay settings)
const fetchProfile    = async () => (await axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })).data;
const saveSettings    = async (s) => (await axios.put(`${BASE_URL}/api/overlay/settings`, s, { headers: authHeader() })).data;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, color }) => (
  <div className="flex items-center gap-4">
    <div className={`${color} p-3 rounded-2xl text-white shadow-lg`}>{icon}</div>
    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
  </div>
);

const formatSeconds = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// ─── PollManager ─────────────────────────────────────────────────────────────

export const PollManager = ({ overlayToken }) => {
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [showResults, setShowResults] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [livePolls, setLivePolls] = useState({});

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['myPolls'],
    queryFn: fetchMyPolls,
    refetchInterval: 10000,
  });

  // Real-time update poll via socket
  useEffect(() => {
    if (!overlayToken) return;
    const socket = io(BASE_URL);
    socket.emit('join-room', overlayToken);
    socket.on('poll-updated', (poll) => {
      setLivePolls(prev => ({ ...prev, [poll._id]: poll }));
      queryClient.invalidateQueries({ queryKey: ['myPolls'] });
    });
    return () => socket.disconnect();
  }, [overlayToken]);

  const createMutation = useMutation({
    mutationFn: createPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPolls'] });
      setNewQuestion('');
      setNewOptions(['', '']);
      setShowCreate(false);
    },
    onError: (e) => alert(e.response?.data?.message || 'Gagal membuat poll'),
  });

  const closeMutation = useMutation({
    mutationFn: closePoll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myPolls'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePoll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myPolls'] }),
  });

  const addOption = () => setNewOptions(o => [...o, '']);
  const removeOption = (i) => setNewOptions(o => o.filter((_, idx) => idx !== i));
  const updateOption = (i, val) => setNewOptions(o => o.map((x, idx) => idx === i ? val : x));

  const handleCreate = () => {
    const validOptions = newOptions.filter(o => o.trim());
    if (!newQuestion.trim()) return alert('Pertanyaan wajib diisi!');
    if (validOptions.length < 2) return alert('Minimal 2 opsi!');
    createMutation.mutate({ question: newQuestion, options: validOptions, showResults });
  };

  const activePoll = polls.find(p => p.status === 'active');
  const closedPolls = polls.filter(p => p.status === 'closed');

  const getPollData = (poll) => livePolls[poll._id] || poll;

  const getTotalVotes = (poll) => (getPollData(poll).options || []).reduce((s, o) => s + (o.votes || 0), 0);
  const getPercent = (votes, total) => total === 0 ? 0 : Math.round((votes / total) * 100);

  const widgetUrl = overlayToken ? `${BASE_URL}/widget/${overlayToken}/poll` : '';
  const [pollCopied, setPollCopied] = useState(false);

  return (
    <div className="space-y-5">
      {/* Active Poll */}
      {activePoll ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-green-50">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="font-black text-green-700 text-sm uppercase tracking-widest">Poll Aktif</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => closeMutation.mutate(activePoll._id)}
                disabled={closeMutation.isPending}
                className="cursor-pointer active:scale-[0.97] px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs transition-all disabled:opacity-60">
                Tutup Poll
              </button>
              <button
                onClick={() => { if (window.confirm('Hapus poll ini?')) deleteMutation.mutate(activePoll._id); }}
                className="cursor-pointer active:scale-[0.97] p-2 bg-red-100 text-red-500 hover:bg-red-200 rounded-xl transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-lg">{getPollData(activePoll).question}</h3>
            <div className="space-y-3">
              {(getPollData(activePoll).options || []).map((opt) => {
                const total = getTotalVotes(activePoll);
                const pct = getPercent(opt.votes, total);
                return (
                  <div key={opt._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{opt.text}</span>
                      <span className="font-black text-indigo-600">{pct}% <span className="text-slate-400 font-medium text-xs">({opt.votes} votes)</span></span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 font-bold">Total: {getTotalVotes(activePoll)} votes</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center">
          <p className="text-3xl mb-2">🗳️</p>
          <p className="font-black text-slate-500 text-sm">Tidak ada poll aktif</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Buat poll baru agar donor bisa ikut voting</p>
        </div>
      )}

      {/* Buat Poll Baru */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="cursor-pointer active:scale-[0.97] w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> {showCreate ? 'Batal' : 'Buat Poll Baru'}
      </button>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-5">

            {activePoll && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
                ⚠️ Membuat poll baru akan menutup poll yang sedang aktif secara otomatis.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pertanyaan</label>
              <input
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Contoh: Mau main game apa malam ini?"
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilihan Jawaban</label>
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Opsi ${i + 1}`}
                    className="flex-1 p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
                  />
                  {newOptions.length > 2 && (
                    <button onClick={() => removeOption(i)} className="cursor-pointer p-3 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addOption}
                className="cursor-pointer active:scale-[0.97] text-sm font-black text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                <Plus size={14} /> Tambah Opsi
              </button>
            </div>

            {/* Toggle show results */}
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
              <div>
                <p className="font-black text-slate-700 text-sm">Tampilkan Hasil di OBS</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Persentase vote terlihat live di widget OBS</p>
              </div>
              <button
                onClick={() => setShowResults(!showResults)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer ${showResults ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${showResults ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="cursor-pointer active:scale-[0.97] w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              <Vote size={16} /> {createMutation.isPending ? 'Membuat...' : 'Mulai Poll Sekarang'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OBS Widget URL */}
      {overlayToken && (
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Widget URL untuk OBS (420×300px)</p>
          <div className="flex gap-2">
            <input readOnly value={`${BASE_URL}/widget/${overlayToken}/poll`}
              className="flex-1 bg-transparent font-mono text-xs text-indigo-600 font-bold outline-none truncate" />
            <button onClick={() => {
                navigator.clipboard.writeText(`${BASE_URL}/widget/${overlayToken}/poll`);
                setPollCopied(true);
                setTimeout(() => setPollCopied(false), 2000);
              }}
              className={`cursor-pointer active:scale-[0.97] px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${pollCopied ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {pollCopied ? <><CheckCircle2 size={12} /> Tersalin!</> : 'Salin'}
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Poll */}
      {closedPolls.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Riwayat Poll ({closedPolls.length})</p>
          {closedPolls.slice(0, 5).map(poll => {
            const data = getPollData(poll);
            const total = getTotalVotes(poll);
            const winner = [...(data.options || [])].sort((a, b) => b.votes - a.votes)[0];
            return (
              <div key={poll._id} className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-700 text-sm truncate">{data.question}</p>
                  {winner && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      🏆 {winner.text} — {getPercent(winner.votes, total)}% ({total} votes total)
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">Closed</span>
                  <button onClick={() => { if (window.confirm('Hapus poll ini?')) deleteMutation.mutate(poll._id); }}
                    className="cursor-pointer p-2 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── SubathonManager ──────────────────────────────────────────────────────────

export const SubathonManager = ({ overlayToken }) => {
  const queryClient = useQueryClient();
  const [localTimer, setLocalTimer] = useState(null);
  const [manualAdd, setManualAdd] = useState(60);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['subathon'],
    queryFn: fetchSubathon,
    refetchInterval: 30000,
  });

  // Sinkron data dari server ke local state
  useEffect(() => {
    if (data) {
      setLocalTimer(t => {
        if (!t) return { ...data };
        return { ...t, ...data };
      });
      setDisplaySeconds(data.currentSeconds || 0);
    }
  }, [data]);

  // Real-time countdown di client (approx)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (localTimer?.isRunning) {
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(s => Math.max(0, s - 1));
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [localTimer?.isRunning]);

  // Real-time dari socket
  useEffect(() => {
    if (!overlayToken) return;
    const socket = io(BASE_URL);
    socket.emit('join-room', overlayToken);
    socket.on('subathon-updated', (timer) => {
      setLocalTimer(timer);
      setDisplaySeconds(timer.currentSeconds || 0);
      queryClient.setQueryData(['subathon'], timer);
    });
    return () => socket.disconnect();
  }, [overlayToken]);

  const configMutation = useMutation({
    mutationFn: updateSubConfig,
    onSuccess: (d) => {
      setLocalTimer(d);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => alert(e.response?.data?.message || 'Gagal simpan'),
  });

  const startMutation = useMutation({
    mutationFn: startSubathon,
    onSuccess: (d) => { setLocalTimer(d); setDisplaySeconds(d.currentSeconds); },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseSubathon,
    onSuccess: (d) => { setLocalTimer(d); },
  });

  const resetMutation = useMutation({
    mutationFn: resetSubathon,
    onSuccess: (d) => { setLocalTimer(d); setDisplaySeconds(d.currentSeconds); },
  });

  const addTimeMutation = useMutation({
    mutationFn: addTimeSubathon,
    onSuccess: (d) => { setLocalTimer(d); setDisplaySeconds(d.currentSeconds); },
  });

  const [subCopied, setSubCopied] = useState(false);
  const save = () => configMutation.mutate({
    mode: localTimer.mode,
    initialSeconds: localTimer.initialSeconds,
    autoAddEnabled: localTimer.autoAddEnabled,
    addSecondsPerAmount: localTimer.addSecondsPerAmount,
    addPerAmount: localTimer.addPerAmount,
    maxSeconds: localTimer.maxSeconds,
    title: localTimer.title,
  });

  if (isLoading || !localTimer) {
    return <div className="text-slate-400 text-sm font-bold animate-pulse py-4">Memuat timer...</div>;
  }

  const isRunning = localTimer.isRunning;
  const progressPct = localTimer.initialSeconds > 0
    ? Math.min(100, (displaySeconds / localTimer.initialSeconds) * 100)
    : 0;

  // Warna progress berdasarkan sisa waktu
  const progressColor = progressPct > 50 ? 'bg-green-500'
    : progressPct > 20 ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="space-y-5">
      {/* Timer Display */}
      <div className={`rounded-2xl p-8 text-center relative overflow-hidden ${isRunning ? 'bg-indigo-600' : 'bg-slate-800'}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="w-64 h-64 rounded-full border-8 border-white absolute -top-16 -right-16" />
          <div className="w-32 h-32 rounded-full border-4 border-white absolute bottom-4 left-4" />
        </div>
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-3">
            {localTimer.title || 'Subathon Timer'}
          </p>
          <div className={`text-6xl font-black text-white tracking-tight font-mono transition-all ${!isRunning ? 'opacity-60' : ''}`}>
            {formatSeconds(displaySeconds)}
          </div>
          <p className="text-white/50 text-xs font-medium mt-3">
            {localTimer.mode === 'countdown' ? 'Countdown' : 'Count Up'} · 
            {isRunning ? <span className="text-green-300"> Berjalan</span> : <span className="text-slate-300"> Berhenti</span>}
          </p>
          {/* Progress Bar */}
          {localTimer.mode === 'countdown' && (
            <div className="mt-5 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progressColor}`}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Kontrol Utama */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => isRunning ? pauseMutation.mutate() : startMutation.mutate()}
          disabled={startMutation.isPending || pauseMutation.isPending}
          className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-2 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-60 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}>
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => { if (window.confirm('Reset timer ke waktu awal?')) resetMutation.mutate(); }}
          disabled={resetMutation.isPending}
          className="cursor-pointer active:scale-[0.97] flex flex-col items-center gap-2 py-4 rounded-2xl font-black text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all disabled:opacity-60">
          <RotateCcw size={20} />
          Reset
        </button>
        <button
          onClick={() => addTimeMutation.mutate(manualAdd)}
          disabled={addTimeMutation.isPending}
          className="cursor-pointer active:scale-[0.97] flex flex-col items-center gap-2 py-4 rounded-2xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-60">
          <Plus size={20} />
          +{formatSeconds(manualAdd)}
        </button>
      </div>

      {/* Slider tambah waktu manual */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tambah Waktu Manual</label>
          <span className="font-black text-indigo-600 text-sm">{formatSeconds(manualAdd)}</span>
        </div>
        <input
          type="range" min={30} max={3600} step={30} value={manualAdd}
          onChange={e => setManualAdd(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
          <span>30 detik</span><span>30 menit</span><span>1 jam</span>
        </div>
      </div>

      {/* Konfigurasi */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Konfigurasi Timer</p>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul Timer</label>
          <input value={localTimer.title || ''}
            onChange={e => upd('title', e.target.value)}
            placeholder="Subathon Timer"
            className="w-full p-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ id: 'countdown', label: '⏱ Countdown', desc: 'Waktu berkurang' }, { id: 'countup', label: '⏫ Count Up', desc: 'Waktu bertambah' }].map(m => (
              <button key={m.id} onClick={() => upd('mode', m.id)}
                className={`cursor-pointer active:scale-[0.97] p-3 rounded-xl border-2 text-left font-black text-xs transition-all ${localTimer.mode === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                {m.label}<br/><span className="font-medium text-[10px] text-slate-400">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Durasi awal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Awal (detik)</label>
            <input type="number" value={localTimer.initialSeconds}
              onChange={e => upd('initialSeconds', Number(e.target.value))}
              className="w-full p-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
            />
            <p className="text-[10px] text-slate-400">{formatSeconds(localTimer.initialSeconds)}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batas Maks (kosong=∞)</label>
            <input type="number" value={localTimer.maxSeconds ?? ''} placeholder="∞"
              onChange={e => upd('maxSeconds', e.target.value === '' ? null : Number(e.target.value))}
              className="w-full p-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
            />
            {localTimer.maxSeconds && <p className="text-[10px] text-slate-400">{formatSeconds(localTimer.maxSeconds)}</p>}
          </div>
        </div>

        {/* Auto-add dari donasi */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-slate-700 text-sm">Auto Tambah Waktu dari Donasi</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Waktu otomatis bertambah saat ada donasi masuk</p>
            </div>
            <button
              onClick={() => upd('autoAddEnabled', !localTimer.autoAddEnabled)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer ${localTimer.autoAddEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${localTimer.autoAddEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {localTimer.autoAddEnabled && (
            <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">+Detik per Tier</label>
                <input type="number" value={localTimer.addSecondsPerAmount}
                  onChange={e => upd('addSecondsPerAmount', Number(e.target.value))}
                  className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Per Rp (1 tier)</label>
                <input type="number" value={localTimer.addPerAmount}
                  onChange={e => upd('addPerAmount', Number(e.target.value))}
                  className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="col-span-2 text-[11px] text-indigo-600 font-bold bg-white rounded-xl px-3 py-2.5 border border-indigo-100">
                📌 Donasi Rp {(localTimer.addPerAmount || 10000).toLocaleString('id-ID')} → +{localTimer.addSecondsPerAmount || 60} detik<br/>
                Donasi Rp {((localTimer.addPerAmount || 10000) * 5).toLocaleString('id-ID')} → +{(localTimer.addSecondsPerAmount || 60) * 5} detik
              </div>
            </div>
          )}
        </div>

        <button onClick={save} disabled={configMutation.isPending}
          className={`cursor-pointer active:scale-[0.97] w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-green-500 text-white' : 'bg-slate-900 hover:bg-indigo-600 text-white'
          } disabled:opacity-70`}>
          {saved ? <><CheckCircle2 size={16} /> Tersimpan!</> : configMutation.isPending ? 'Menyimpan...' : <><Save size={16} /> Simpan Konfigurasi</>}
        </button>
      </div>

      {/* OBS Widget URL */}
      {overlayToken && (
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Widget URL untuk OBS (360×200px)</p>
          <div className="flex gap-2">
            <input readOnly value={`${BASE_URL}/api/subathon/public/${overlayToken}`}
              className="flex-1 bg-transparent font-mono text-xs text-indigo-600 font-bold outline-none truncate" />
            <button onClick={() => {
                navigator.clipboard.writeText(`${BASE_URL}/api/subathon/public/${overlayToken}`);
                setSubCopied(true);
                setTimeout(() => setSubCopied(false), 2000);
              }}
              className={`cursor-pointer active:scale-[0.97] px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${subCopied ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {subCopied ? <><CheckCircle2 size={12} /> Tersalin!</> : 'Salin'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LeaderboardSettings ──────────────────────────────────────────────────────

export const LeaderboardSettings = () => {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  useEffect(() => {
    if (data && !local) {
      const s = data.settings || data.overlaySetting || {};
      setLocal({
        leaderboardShowAmount: s.leaderboardShowAmount !== false,
        leaderboardLimit: s.leaderboardLimit || 10,
        leaderboardPeriod: s.leaderboardPeriod || 'alltime',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => alert(e.response?.data?.message || 'Gagal simpan'),
  });

  const upd = (k, v) => setLocal(s => ({ ...s, [k]: v }));

  if (isLoading || !local) return <div className="text-slate-400 text-sm animate-pulse py-4">Memuat...</div>;

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <Trophy size={20} className="text-amber-400" />
          <span className="font-black text-sm">Preview Leaderboard</span>
          <span className="ml-auto text-[10px] text-slate-400 font-medium">
            {local.leaderboardPeriod === 'today' ? 'Hari ini' : 'Semua waktu'}
          </span>
        </div>
        <div className="space-y-2">
          {[
            { rank: 1, name: 'Sultan Ganteng', amount: 500000, count: 12 },
            { rank: 2, name: 'Budi Gacor',     amount: 250000, count: 7  },
            { rank: 3, name: 'Anonymous',       amount: 100000, count: 3  },
          ].slice(0, Math.min(local.leaderboardLimit, 3)).map((d, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
              <span className="text-lg w-8 text-center">{['🥇','🥈','🥉'][i]}</span>
              <span className="flex-1 text-sm font-bold text-white/90 truncate">{d.name}</span>
              {local.leaderboardShowAmount && (
                <span className="font-black text-amber-400 text-sm">Rp {d.amount.toLocaleString('id-ID')}</span>
              )}
              <span className="text-white/40 text-xs font-medium">{d.count}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pengaturan */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">

        {/* Periode */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periode Leaderboard</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'alltime', label: '⏳ Semua Waktu', desc: 'Total donasi sejak awal' },
              { id: 'today',   label: '📅 Hari Ini',    desc: 'Donasi hari ini saja' },
            ].map(p => (
              <button key={p.id} onClick={() => upd('leaderboardPeriod', p.id)}
                className={`cursor-pointer active:scale-[0.97] p-4 rounded-xl border-2 text-left font-black text-xs transition-all ${
                  local.leaderboardPeriod === p.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}>
                {p.label}<br/>
                <span className="font-medium text-[10px] text-slate-400">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Jumlah donatur */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Donatur Ditampilkan</label>
            <span className="font-black text-indigo-600 text-sm">Top {local.leaderboardLimit}</span>
          </div>
          <input
            type="range" min={3} max={20} step={1} value={local.leaderboardLimit}
            onChange={e => upd('leaderboardLimit', Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>Top 3</span><span>Top 10</span><span>Top 20</span>
          </div>
        </div>

        {/* Tampilkan nominal */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <p className="font-black text-slate-700 text-sm">Tampilkan Nominal Donasi</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sembunyikan jika tidak ingin nominal terlihat publik</p>
          </div>
          <button
            onClick={() => upd('leaderboardShowAmount', !local.leaderboardShowAmount)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer ${local.leaderboardShowAmount ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${local.leaderboardShowAmount ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Info tambahan */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 font-medium">
          💡 Pengaturan ini memengaruhi widget leaderboard OBS dan tampilan di halaman donasi publik kamu.
        </div>

        <button
          onClick={() => saveMutation.mutate(local)}
          disabled={saveMutation.isPending}
          className={`cursor-pointer active:scale-[0.97] w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-green-500 text-white' : 'bg-slate-900 hover:bg-indigo-600 text-white'
          } disabled:opacity-70`}>
          {saved ? <><CheckCircle2 size={16} /> Tersimpan!</> : saveMutation.isPending ? 'Menyimpan...' : <><Save size={16} /> Simpan Pengaturan Leaderboard</>}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//
// PETUNJUK INTEGRASI ke DashboardStreamer.jsx
// ============================================
//
// 1. Import di DashboardStreamer.jsx:
//    import { PollManager, SubathonManager, LeaderboardSettings } from './StreamerExtras';
//
// 2. Tambah tab baru di Sidebar (sidebar.jsx) — tambahkan item:
//    { id: 'poll',     icon: <Vote size={20} />,    label: 'Poll & Voting' }
//    { id: 'subathon', icon: <Timer size={20} />,   label: 'Subathon' }
//    { id: 'leaderboard', icon: <Trophy size={20} />, label: 'Leaderboard' }
//
// 3. Di dalam <AnimatePresence> di DashboardStreamer, tambahkan:
//
//    {activeTab === 'poll' && (
//      <motion.div key="poll" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//        <div className="max-w-2xl space-y-5">
//          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
//            <SectionHeader icon={<Vote size={20} />} title="Poll & Voting" color="bg-violet-500" />
//            <PollManager overlayToken={user.overlayToken} />
//          </div>
//        </div>
//      </motion.div>
//    )}
//
//    {activeTab === 'subathon' && (
//      <motion.div key="subathon" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//        <div className="max-w-2xl space-y-5">
//          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
//            <SectionHeader icon={<Timer size={20} />} title="Subathon Timer" color="bg-indigo-500" />
//            <SubathonManager overlayToken={user.overlayToken} />
//          </div>
//        </div>
//      </motion.div>
//    )}
//
//    {activeTab === 'leaderboard' && (
//      <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//        <div className="max-w-2xl space-y-5">
//          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
//            <SectionHeader icon={<Trophy size={20} />} title="Pengaturan Leaderboard" color="bg-amber-500" />
//            <LeaderboardSettings />
//          </div>
//        </div>
//      </motion.div>
//    )}
//
// ─────────────────────────────────────────────────────────────────────────────