import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Copy,
  CreditCard,
  Menu,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  User,
  Wallet
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';

const WithdrawPage = () => {
  const [balance, setBalance] = useState(0);
  const [method, setMethod] = useState('BANK'); // BANK, DANA, GOPAY
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    channelCode: 'BCA',
    accountNumber: '',
    accountName: ''
  });

  // 1. Ambil Saldo Terbaru saat halaman dibuka
  useEffect(() => {
    fetchCurrentBalance();
  }, []);

  const fetchCurrentBalance = async () => {
    try {
      const res = await axios.get('https://server-dukungin-production.up.railway.app/api/overlay/my-settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Asumsi data user dikirim bersama settings atau buat endpoint khusus profile
      setBalance(res.data.User?.walletBalance || 0);
    } catch (err) {
      console.error("Gagal mengambil saldo");
    }
  };

  const handleWithdraw = async () => {
    if (parseFloat(formData.amount) > parseFloat(balance)) {
      return alert("Saldo tidak mencukupi!");
    }
    if (parseFloat(formData.amount) < 10000) {
      return alert("Minimal penarikan adalah Rp 10.000");
    }

    setLoading(true);
    try {
      await axios.post('https://server-dukungin-production.up.railway.app/api/xendit/withdraw', {
        ...formData,
        paymentMethod: method
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert("Permintaan penarikan berhasil dikirim!");
      fetchCurrentBalance(); // Refresh saldo setelah ditarik
    } catch (err) {
      alert(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6">
      
      {/* CARD SALDO UTAMA */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
            <Wallet size={120} />
        </div>
        <div className="relative z-10">
            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
            <h1 className="text-3xl font-black italic">
                Rp {parseFloat(balance).toLocaleString('id-ID')}
            </h1>
            {/* <div className="mt-6 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Siap Dicairkan
            </div> */}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <CreditCard className="text-indigo-600" /> Konfigurasi Pencairan
        </h2>
        
        {/* Pilihan Metode */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { id: 'BANK', label: 'Transfer Bank', icon: <CreditCard size={18}/> },
            { id: 'DANA', label: 'E-Wallet DANA', icon: <Smartphone size={18}/> },
            { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18}/> }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => {
                  setMethod(m.id);
                  setFormData({...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id});
              }}
              className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all font-black text-sm ${method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {method === 'BANK' && (
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bank</label>
                <select 
                    className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                    onChange={(e) => setFormData({...formData, channelCode: e.target.value})}
                >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="MANDIRI">Mandiri</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {method === 'BANK' ? "Nomor Rekening" : "Nomor Handphone"}
                </label>
                <input 
                    placeholder={method === 'BANK' ? "000-000-000" : "0812xxxx"}
                    className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Pemilik Akun</label>
            <input 
                placeholder="Sesuaikan dengan Buku Tabungan / Nama di App"
                className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                onChange={(e) => setFormData({...formData, accountName: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal yang Ingin Ditarik (IDR)</label>
            <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-600">Rp</span>
                <input 
                    type="number"
                    placeholder="Contoh: 100000"
                    className="w-full p-6 pl-14 bg-slate-900 text-white rounded-3xl font-black text-xl outline-none focus:ring-4 ring-indigo-100 transition-all"
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
            </div>
            <p className="text-[10px] text-slate-400 font-bold ml-1 italic">*Biaya admin penarikan Rp 5.000 akan memotong saldo utama.</p>
          </div>

          <button 
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? "Sedang Memproses..." : <><ArrowRight size={20}/> Ajukan Pencairan Dana</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardStreamer = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // --- States Data ---
  const [user, setUser] = useState({
    username: 'HudaDev',
    balance: 2500000,
    overlayUrl: 'https://donatepro.id/overlay/user-123-abc'
  });

  const [settings, setSettings] = useState({
    minDonate: 10000,
    maxDonate: 5000000,
    theme: 'modern',
    primaryColor: '#6366f1',
    textColor: '#ffffff',
    animation: 'bounce',

    // NEW
    baseDuration: 5, // detik default
    extraPerAmount: 10000, // tiap 10rb nambah durasi
    extraDuration: 1 // nambah 1 detik
  });

  const [history] = useState([
    { id: 1, donor: '@Zulion-Zx', amount: 50000, msg: 'Semangat skripsinya!', date: '2026-03-31 14:20', status: 'PAID' },
    { id: 2, donor: 'Anonim', amount: 15000, msg: 'Mantap bang!', date: '2026-03-31 12:05', status: 'PAID' },
    { id: 3, donor: 'Budi', amount: 100000, msg: 'Request lagu dong', date: '2026-03-30 22:10', status: 'PENDING' },
  ]);

  // --- Handlers ---
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('URL Berhasil disalin ke OBS!');
  };

  const calculateDuration = (amount) => {
    const { baseDuration, extraPerAmount, extraDuration } = settings;

    const bonusMultiplier = Math.floor(amount / extraPerAmount);
    const totalDuration = baseDuration + (bonusMultiplier * extraDuration);

    return totalDuration;
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 font-bold border border-white/10 backdrop-blur-md"
          >
            <CheckCircle2 size={18} className="text-green-500" /> Pengaturan Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE NAVBAR */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic">D</div>
          <span className="font-black text-sm tracking-tight">DUKUNG.IN</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-200 rounded-xl text-slate-600">
          <Menu size={24} />
        </button>
      </div>

      {/* SIDEBAR (Responsive) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 px-6 md:px-7 py-12 lg:py-4 max-w-7xl mx-auto w-full relative">
        
        {/* Dynamic Header */}
        <header className="flex flex-col mt-4 lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative">
          <div className="z-10">
            <h2 className="text-4xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">
              {activeTab === 'settings' ? 'Dashboard' : activeTab === 'history' ? 'Riwayat' : 'Profil'}
              <span className="text-indigo-600">.</span>
            </h2>
            <p className="text-slate-400 font-medium mt-1 flex items-center gap-2">
              Selamat datang kembali, <span className="text-slate-800 font-bold">@{user.username}</span>
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* VIEW: SETTINGS (OVERLAY EDITOR) */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              <section className="xl:col-span-7 space-y-8">
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<Settings size={20}/>} title="Konfigurasi Alert" color="bg-indigo-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
                    <InputField label="Minimal Donasi" type="number" value={settings.minDonate} onChange={(v) => setSettings({...settings, minDonate: v})} />
                    <InputField label="Maksimal Donasi" type="number" value={settings.maxDonate} onChange={(v) => setSettings({...settings, maxDonate: v})} />
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Tema Visual</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['modern', 'classic', 'minimal'].map(t => (
                          <button key={t} onClick={() => setSettings({...settings, theme: t})}
                            className={`py-4 rounded-2xl border-2 transition-all font-black text-sm capitalize ${settings.theme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
                          > {t} </button>
                        ))}
                      </div>
                    </div>
                    <InputField label="Warna Background" type="color" value={settings.primaryColor} onChange={(v) => setSettings({...settings, primaryColor: v})} />
                    <InputField label="Warna Teks" type="color" value={settings.textColor} onChange={(v) => setSettings({...settings, textColor: v})} />
                    <InputField 
                      label="Durasi Dasar (detik)" 
                      type="number" 
                      value={settings.baseDuration} 
                      onChange={(v) => setSettings({...settings, baseDuration: Number(v)})} 
                    />

                    <InputField 
                      label="Kelipatan Donasi (Rp)" 
                      type="number" 
                      value={settings.extraPerAmount} 
                      onChange={(v) => setSettings({...settings, extraPerAmount: Number(v)})} 
                    />

                    <InputField 
                      label="Tambahan Durasi per Kelipatan (detik)" 
                      type="number" 
                      value={settings.extraDuration} 
                      onChange={(v) => setSettings({...settings, extraDuration: Number(v)})} 
                    />
                  </div>
                  <div className="bg-slate-200 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">OBS URL</label>
                    <div className="flex gap-3">
                      <input readOnly value={user.overlayUrl} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 font-bold outline-none overflow-hidden text-ellipsis" />
                      <button onClick={() => copyToClipboard(user.overlayUrl)} className="text-slate-400 hover:text-indigo-600"><Copy size={18}/></button>
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                    {loading ? 'Proses...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </section>

              {/* LIVE PREVIEW SECTION */}
              <section className="xl:col-span-5">
                <div className="sticky top-12 bg-slate-900 rounded-3xl p-8 h-[500px] flex items-center justify-center relative overflow-hidden border-[12px] border-slate-800 shadow-2xl">
                  <div className="absolute top-6 left-8 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Preview</span>
                  </div>
                  <motion.div 
                    key={settings.theme + settings.primaryColor} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ 
                      backgroundColor: settings.primaryColor, color: settings.textColor,
                      borderRadius: settings.theme === 'modern' ? '1.5rem' : settings.theme === 'minimal' ? '0px' : '0.5rem',
                      textAlign: settings.theme === 'minimal' ? 'left' : 'center',
                    }}
                    className={`p-8 shadow-2xl w-full max-w-[280px] ${settings.theme === 'classic' ? 'border-4 border-white/20' : ''}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Baru Saja Memberi!</p>
                    <h4 className="text-2xl font-black">@HudaDev</h4>
                    <p className="text-lg font-bold">Rp 50.000</p>
                    <p className="mt-4 text-xs italic opacity-80 leading-relaxed font-medium">"Semangat terus ngodingnya bang!"</p>
                  </motion.div>
                </div>
              </section>
            </motion.div>
          )}

          {/* VIEW: HISTORY */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-10 py-6">Donatur</th>
                      <th className="px-10 py-6">Jumlah</th>
                      <th className="px-10 py-6">Pesan</th>
                      <th className="px-10 py-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-200/50 transition-all">
                        <td className="px-10 py-6 font-black text-slate-700">{item.donor}</td>
                        <td className="px-10 py-6 text-indigo-600 font-black">Rp {item.amount.toLocaleString()}</td>
                        <td className="px-10 py-6 text-slate-500 text-sm font-medium italic">"{item.msg}"</td>
                        <td className="px-10 py-6 text-center">
                          <span className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest ${item.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* VIEW: PROFILE (FIXED SINGLE COLUMN) */}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="max-w-5xl mx-auto space-y-6"
            >
              {/* 1. HERO PROFILE CARD */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 z-0"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  {/* Avatar Area */}
                  <div className="relative group">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl border-4 border-white hover:bg-indigo-600 transition-colors">
                      <Camera size={18} />
                    </button>
                  </div>

                  {/* Name & Quick Stats */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">@{user.username}</h2>
                      <span className="px-4 py-1.5 bg-green-100 relative top-1 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Verified Creator</span>
                    </div>
                    <p className="text-slate-400 font-medium">{user.email}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined Since</p>
                        <p className="font-bold text-slate-700">Jan 2026</p>
                      </div>
                      <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                        <p className="font-bold text-indigo-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SETTINGS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Account Details */}
                {/* <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<User size={18}/>} title="Profil Publik" color="bg-indigo-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    <InputField label="Display Name" defaultValue={user.username} placeholder="Nama di halaman donasi" />
                    <InputField label="Email Address" type="email" defaultValue={user.email} />
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio Singkat</label>
                      <textarea 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 h-32 transition-all"
                        placeholder="Ceritakan tentang kontenmu..."
                      ></textarea>
                    </div>
                  </div>
                </div> */}

                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<User size={18}/>} title="Profil Publik" color="bg-indigo-500" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    
                    {/* --- TAMBAHAN FIELD URL DONASI --- */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">
                        Link Halaman Donasi Kamu
                      </label>
                      <div className="flex gap-2 group">
                        <div className="relative flex-1">
                          <input 
                            readOnly 
                            value={`${window.location.origin}/${user.username}`} 
                            className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-5 font-mono text-sm text-indigo-600 font-bold outline-none group-hover:border-indigo-300 transition-all shadow-sm" 
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                            Public Link
                          </div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`${window.location.origin}/${user.username}`)}
                          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-95"
                          title="Salin Link"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1 italic">
                        *Bagikan link ini di bio Instagram, TikTok, atau deskripsi YouTube kamu.
                      </p>
                    </div>
                    {/* --- END TAMBAHAN --- */}

                    <InputField label="Display Name" defaultValue={user.username} placeholder="Nama di halaman donasi" />
                    <InputField label="Email Address" type="email" defaultValue={user.email} />
                    
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio Singkat</label>
                      <textarea 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 h-32 transition-all shadow-sm"
                        placeholder="Ceritakan tentang kontenmu..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Right Column: Security */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-xl text-white">
                  <SectionHeader icon={<ShieldCheck size={18}/>} title="Keamanan" color="bg-red-500" />
                  <div className="space-y-6 mt-10">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganti Password</p>
                      <input 
                        type="password" 
                        placeholder="Password Lama" 
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                      <input 
                        type="password" 
                        placeholder="Password Baru" 
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    
                    <div className="pt-6 border-t border-white/5">
                      <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2">
                          <Save size={18}/> Update Akun
                      </button>
                      <p className="text-[9px] text-center mt-4 text-slate-500 font-bold">Terakhir diperbarui: 2 jam yang lalu</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW: PROFILE (FIXED SINGLE COLUMN) */}
          {activeTab === 'wallet' && (
            <WithdrawPage />
          )}

        </AnimatePresence>
      </main>

      {/* OVERLAY UNTUK MOBILE MENU */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden" />
      )}
    </div>
  );
};

// --- Sub-Components ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-200'}`}>
    {React.cloneElement(icon, { size: 20 })} <span className="text-sm">{label}</span>
  </button>
);

const InputField = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{label}</label>
    <input className="w-full bg-slate-200 border-2 border-slate-50 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm shadow-sm" {...props} onChange={(e) => props.onChange?.(e.target.value)} />
  </div>
);

const SectionHeader = ({ icon, title, color }) => (
  <div className="flex items-center gap-4">
    <div className={`${color} p-3 rounded-2xl text-white shadow-lg`}>{icon}</div>
    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
  </div>
);

export default DashboardStreamer;