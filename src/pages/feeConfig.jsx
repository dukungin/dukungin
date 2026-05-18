// feeConfigPage.jsx
// Tambahkan import ini di DashboardStreamer.jsx:
// import { FeeConfigPage } from './feeConfigPage';
//
// Tambahkan route di DashboardStreamer:
// {activeTab === 'feeConfig' && <FeeConfigPage />}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, Save, Settings2, ShieldCheck, Users, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/axiosInstance';

const fetchFeeConfig = async () => (await api.get('/api/overlay/settings')).data;
const saveFeeConfig  = async (d) => (await api.put('/api/overlay/settings', d)).data;

const FEE_PERCENT = 0.025;
const ADMIN_FEE   = 5000;

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID').format(Math.round(num));

// ─── Simulator ────────────────────────────────────────────────────────────────
const FeeSimulator = ({ feeBearer }) => {
  const [nominal, setNominal] = useState(100000);
  const amt = parseFloat(nominal) || 0;

  const percentFee = Math.round(amt * FEE_PERCENT);
  const totalFee   = percentFee + ADMIN_FEE;

  // Jika donor menanggung: donor bayar lebih
  const donorPays    = feeBearer === 'donor' ? amt + totalFee : amt;
  // Streamer terima bersih
  const streamerGets = feeBearer === 'donor' ? amt : amt - totalFee;

  const PRESETS = [10000, 50000, 100000, 500000, 1000000];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-none p-5 space-y-4">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        Simulasi Kalkulasi Fee
      </p>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(v => (
          <button
            key={v}
            onClick={() => setNominal(v)}
            className={`px-3 py-1.5 rounded-none text-xs font-black transition-all border-2 cursor-pointer active:scale-[0.97] ${
              nominal === v
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'
            }`}
          >
            {v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}K`}
          </button>
        ))}
      </div>

      {/* Input nominal */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</span>
        <input
          type="number"
          value={nominal}
          onChange={e => setNominal(Number(e.target.value))}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-none font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Nominal donasi</span>
          <span className="font-black text-slate-800 dark:text-slate-100">Rp {formatRupiah(amt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Fee 1.5%</span>
          <span className="font-bold text-red-400">- Rp {formatRupiah(percentFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Fee tetap</span>
          <span className="font-bold text-red-400">- Rp {formatRupiah(ADMIN_FEE)}</span>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-2">
          {feeBearer === 'donor' && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span className="font-bold">Donor membayar total</span>
              <span className="font-black">Rp {formatRupiah(donorPays)}</span>
            </div>
          )}
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span className="font-bold">Streamer menerima</span>
            <span className="font-black">Rp {formatRupiah(streamerGets)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const FeeConfigPage = () => {
  const queryClient = useQueryClient();
  const [feeBearer, setFeeBearer] = useState('streamer'); // 'streamer' | 'donor'
  const [saved, setSaved] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchFeeConfig,
  });

  useEffect(() => {
    if (profileData) {
      const s = profileData.settings || profileData.overlaySetting || {};
      setFeeBearer(s.feeBearer || 'streamer');
    }
  }, [profileData]);

  const saveMutation = useMutation({
    mutationFn: (bearer) => {
      const current = profileData?.settings || profileData?.overlaySetting || {};
      return saveFeeConfig({ ...current, feeBearer: bearer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => alert(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const OPTIONS = [
    {
      id: 'streamer',
      icon: <Wallet size={22} />,
      title: 'Streamer Menanggung',
      subtitle: 'Fee dipotong dari saldo kamu saat penarikan',
      desc: 'Donor cukup bayar sesuai nominal yang mereka ketik. Biaya admin (Rp 5.000 + 1.5%) akan dipotong dari saldo streamer saat melakukan penarikan dana.',
      badge: 'Ramah Donor',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
      borderActive: 'border-indigo-600',
      bgActive: 'bg-indigo-50 dark:bg-indigo-950/30',
      iconColor: 'bg-indigo-600',
    },
    {
      id: 'donor',
      icon: <Users size={22} />,
      title: 'Donor Menanggung',
      subtitle: 'Fee ditambahkan ke nominal yang donor bayarkan',
      desc: 'Donor akan membayar nominal + biaya admin (Rp 5.000 + 1.5%). Streamer menerima persis sesuai nominal yang diinput donor. Fee ditampilkan transparan di halaman donasi.',
      badge: 'Saldo Penuh',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      borderActive: 'border-emerald-500',
      bgActive: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'bg-emerald-500',
    },
  ];

  return (
    <motion.div
      className="w-full space-y-5 pb-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* ── Header ── */}
      <div className="bg-indigo-600 rounded-none p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">
            Pengaturan Biaya
          </p>
          <h2 className="text-3xl font-black tracking-tight">Fee Config.</h2>
          <p className="text-indigo-200 text-sm font-medium mt-1">
            Atur siapa yang menanggung biaya admin platform
          </p>
        </div>
        <img src="/jellyfish.png" alt="" className="absolute top-3 right-[-20px] md:right-[-40px] w-[15%] md:w-[17%] -rotate-25 opacity-90" />
        <img src="/jellyfish.png" alt="" className="absolute top-3 right-[130px] w-[7%] rotate-25 opacity-90" />
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-none px-5 py-4">
        <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
          Biaya admin platform adalah <strong>Rp 5.000 + 1.5%</strong> per transaksi donasi.
          Kamu bisa pilih apakah biaya ini ditanggung olehmu atau diteruskan ke donor.
          Pilihan ini akan tampil transparan di halaman donasi publik kamu.
        </p>
      </div>

      {/* ── Pilihan Mode ── */}
      <div className="bg-white dark:bg-slate-900 rounded-none p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-none text-white shadow-lg">
            <Settings2 size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
            Pilih Penanggung Fee
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400 font-bold gap-3">
            <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-none animate-spin" />
            Memuat konfigurasi...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setFeeBearer(opt.id)}
                className={`cursor-pointer active:scale-[0.98] text-left p-6 rounded-none border-2 transition-all space-y-4 ${
                  feeBearer === opt.id
                    ? `${opt.borderActive} ${opt.bgActive} shadow-lg`
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`${opt.iconColor} p-3 rounded-none text-white shadow-md flex-shrink-0`}>
                    {opt.icon}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-none text-[10px] font-black ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all ${
                      feeBearer === opt.id
                        ? `${opt.borderActive} bg-indigo-600`
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {feeBearer === opt.id && (
                        <div className="w-2 h-2 bg-white rounded-none" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-base">
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {opt.subtitle}
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-3">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* ── Simulator ── */}
        <FeeSimulator feeBearer={feeBearer} />

        {/* ── Ringkasan ── */}
        <div className={`flex items-start gap-3 rounded-none px-5 py-4 border transition-all ${
          feeBearer === 'streamer'
            ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
        }`}>
          <ShieldCheck size={16} className={`mt-0.5 flex-shrink-0 ${feeBearer === 'streamer' ? 'text-indigo-500' : 'text-emerald-500'}`} />
          <div>
            <p className={`font-black text-sm ${feeBearer === 'streamer' ? 'text-indigo-700 dark:text-indigo-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {feeBearer === 'streamer'
                ? 'Mode aktif: Streamer menanggung fee'
                : 'Mode aktif: Donor menanggung fee'}
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${feeBearer === 'streamer' ? 'text-indigo-600 dark:text-indigo-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
              {feeBearer === 'streamer'
                ? 'Halaman donasi tidak menampilkan fee tambahan. Donasi Rp 50.000 = donor bayar Rp 50.000.'
                : 'Halaman donasi menampilkan rincian fee secara transparan. Donasi Rp 50.000 = donor bayar Rp 50.000 + Rp 5.750 fee.'}
            </p>
          </div>
        </div>

        {/* ── Save Button ── */}
        <button
          onClick={() => saveMutation.mutate(feeBearer)}
          disabled={saveMutation.isPending}
          className="cursor-pointer active:scale-[0.98] hover:brightness-90 w-full bg-indigo-600 text-white py-4 rounded-none font-black text-base transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-none animate-spin" /> Menyimpan...</>
          ) : (
            <><Save size={18} /> Simpan Konfigurasi Fee</>
          )}
        </button>

        {/* Sukses notice */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-none px-5 py-4"
            >
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="font-black text-green-700 dark:text-green-400 text-sm">Konfigurasi berhasil disimpan!</p>
                <p className="text-[11px] text-green-600 dark:text-green-500 font-medium">
                  Halaman donasi publik kamu akan menyesuaikan tampilan fee secara otomatis.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Catatan ── */}
      <div className="bg-white dark:bg-slate-900 rounded-none p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Catatan Penting</p>
        <ul className="space-y-2">
          {[
            'Perubahan berlaku segera untuk semua donasi berikutnya.',
            'Donasi yang sudah dibuat sebelum perubahan ini tidak terpengaruh.',
            'Fee platform (Rp 5.000 + 1.5%) adalah biaya operasional layanan dan tidak bisa dihapus.',
            'Jika donor menanggung, nominal yang ditampilkan di halaman donasi sudah termasuk fee.',
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="text-indigo-400 font-black flex-shrink-0 mt-0.5">→</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};