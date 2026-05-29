import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../lib/axiosInstance';
import toast from 'react-hot-toast';

const MaintenancePage = () => {
  const [settings, setSettings] = useState({
    auth: false,
    supporter: false,
    withdrawal: false,
    dashboard: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current settings
  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/maintenance/settings');
      setSettings(res.data);
    } catch (err) {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/api/maintenance/settings', settings);
      toast.success('✅ Pengaturan Maintenance berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const pages = [
    { key: 'auth', label: 'Halaman Login / Register', desc: 'Auth Page' },
    { key: 'supporter', label: 'Halaman Donasi (Supporter)', desc: '/donate/:username' },
    { key: 'withdrawal', label: 'Penarikan Dana (Streamer)', desc: 'Withdraw Page' },
    { key: 'dashboard', label: 'Dashboard Streamer', desc: 'Seluruh halaman dashboard' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-amber-500 p-3 rounded-none text-white">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black">Maintenance Mode</h2>
          <p className="text-slate-500">Nonaktifkan akses ke halaman tertentu</p>
        </div>
      </div>

      <div className="bg-white/30 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-6 rounded-none">
        <div className="grid gap-4">
          {pages.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-bold">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-14 h-8 rounded-none transition-all ${
                  settings[key] ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-none shadow transition-all ${settings[key] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="cursor-pointer active:scale-[0.99] mt-8 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98]"
        >
          {saving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan Maintenance'}
        </button>
      </div>
    </div>
  );
};

export default MaintenancePage;