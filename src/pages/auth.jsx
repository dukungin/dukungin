import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Animated background blobs ────────────────────────────────────────────────
const BgBlobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
    <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-violet-400/15 blur-3xl" style={{ animationDelay: '1s' }} />
    <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl" />
  </div>
);

// ─── Notification modal ───────────────────────────────────────────────────────
const NotifModal = ({ notification, onClose }) => (
  <AnimatePresence>
    {notification.show && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed z-[101] flex w-screen h-screen justify-center items-center bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96"
        >
          <div className="bg-white mx-auto w-[92vw] md:min-w-[26vw] rounded-3xl p-8 shadow-2xl text-center">
            <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{notification.title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{notification.message}</p>
            <button
              onClick={onClose}
              className={`cursor-pointer active:scale-[0.97] hover:brightness-95 w-full py-3.5 rounded-2xl font-black text-sm transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {notification.type === 'success' ? 'Lanjutkan' : 'Coba Lagi'}
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ─── Input field ──────────────────────────────────────────────────────────────
const AuthInput = ({ icon, type, value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
        {icon}
      </div>
      <input
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(e.target.value.replace(/<script.*?>.*?<\/script>/gi, ''))}
        placeholder={placeholder}
        className="w-full bg-slate-200/80 border border-slate-300 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal text-[15px]"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer z-10"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

// ─── Feature pill ─────────────────────────────────────────────────────────────
const Pill = ({ label }) => (
  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
    <span className="text-white/90 text-xs font-semibold">{label}</span>
  </div>
);

// ─── Main Auth ────────────────────────────────────────────────────────────────
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [isForgot, setIsForgot] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const navigate = useNavigate();

  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'success' });
  const notify = (title, message, type = 'success') => setNotification({ show: true, title, message, type });
  const closeNotif = () => setNotification(n => ({ ...n, show: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`https://server-dukungin-production.up.railway.app${endpoint}`, formData);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        notify('Berhasil!', res.data.message || 'Login berhasil!', 'success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        notify('Hai Streamer!', 'Akun kamu berhasil dibuat. Silakan login.', 'success');
        setFormData({ username: '', email: '', password: '' });
        setTimeout(() => { closeNotif(); setIsLogin(true); }, 2000);
      }
    } catch (err) {
      notify('Gagal', err.response?.data?.message || 'Koneksi terputus atau server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const res = await axios.post('https://server-dukungin-production.up.railway.app/api/auth/forgot-password', { email: emailReset });
      notify('Berhasil', res.data.message, 'success');
      setIsForgot(false);
    } catch (err) {
      notify('Gagal', err.response?.data?.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 font-sans flex flex-col lg:flex-row">

      <NotifModal notification={notification} onClose={closeNotif} />

      {/* ── LEFT / TOP: Brand Hero ── */}
      <div className="relative lg:w-[45%] lg:min-h-screen bg-indigo-600 flex flex-col justify-center overflow-hidden
                      px-4 pt-8 pb-8 lg:px-12 lg:pt-16 lg:pb-12">
        <BgBlobs />

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%">
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.8"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Jellyfish decoration */}

        <div className="relative z-10">
          {/* Logo */}
          <div className="hidden md:inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-2xl px-4 py-2 mb-8 lg:mb-6">
            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 font-black text-xs italic">S</span>
            </div>
            <span className="text-white font-black text-sm tracking-tight">Sawer-In From Indonesia 🚀</span>
          </div>
          <img src="/jellyfish.png" alt=""
            className="relative w-[14%] lg:w-[15%] mb-6 pointer-events-none select-none" />
          <img src="/jellyfish.png" alt=""
            className="absolute -top-4 -right-16 w-[26%] lg:w-[46%] -rotate-45 mb-6 pointer-events-none select-none" />

          {/* Headline */}
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-[1.15] tracking-tight">
            Mulai Terima<br />
            <span className="text-indigo-200 mr-1.5">Dukungan</span>
            Real-time.
          </h1>
          <p className="text-indigo-200 mt-3 font-medium text-sm lg:text-base leading-relaxed max-w-[90%]">
            Dashboard paling clean untuk para streamer Indonesia.
          </p>
        </div>

        {/* Pills — hidden on very small mobile to save space */}
        <div className="relative z-10 hidden sm:flex lg:flex flex-wrap gap-2 mt-6 lg:mt-12">
          <Pill label="Integrasi Midtrans" />
          <Pill label="Overlay OBS Custom" />
          <Pill label="Pencairan Cepat" />
        </div>
      </div>

      {/* ── RIGHT / BOTTOM: Form ── */}
      <div className="md:flex-1 flex items-center justify-center px-4 pb-0 pt-5 md:h-[100vh] h-max md:py-10 lg:px-0">
        <div className="w-full max-w-lg h-max">

          <AnimatePresence mode="wait">

            {/* ── FORGOT PASSWORD ── */}
            {isForgot ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <button onClick={() => setIsForgot(false)}
                  className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 text-sm font-semibold mb-8 transition-colors">
                  ← Kembali
                </button>
                <h2 className="text-2xl font-black text-slate-800 mb-1">Lupa Password?</h2>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  Masukkan email kamu dan kami akan kirim link reset.
                </p>
                <div className="space-y-6">
                  <AuthInput
                    icon={<Mail size={18} />}
                    placeholder="Email kamu"
                    value={emailReset}
                    onChange={setEmailReset}
                  />
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-100"
                  >
                    {loading
                      ? <div className="w-4 h-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      : 'Kirim Link Reset →'
                    }
                  </button>
                </div>
              </motion.div>

            ) : (

              /* ── LOGIN / REGISTER ── */
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                {/* Tab switcher */}
                <div className="flex border border-slate-200 bg-slate-100 rounded-2xl p-1 mb-8">
                  {['Login', 'Daftar'].map((label, i) => (
                    <button
                      key={label}
                      onClick={() => setIsLogin(i === 0)}
                      className={`cursor-pointer active:scale-[0.97] flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                        (isLogin && i === 0) || (!isLogin && i === 1)
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <h2 className="text-2xl md:flex flex-col hidden font-black text-slate-800 mb-1">
                  {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
                </h2>
                <p className="text-slate-500 text-sm font-medium mb-7 leading-relaxed">
                  {isLogin
                    ? 'Masuk untuk mengelola overlay kamu.'
                    : 'Daftar sekarang dan mulai kustomisasi alert.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <AuthInput
                      icon={<User size={18} />}
                      placeholder="Username"
                      value={formData.username}
                      onChange={v => setFormData(f => ({ ...f, username: v }))}
                    />
                  )}
                  <AuthInput
                    icon={<Mail size={18} />}
                    type="email"
                    placeholder="Alamat Email"
                    value={formData.email}
                    onChange={v => setFormData(f => ({ ...f, email: v }))}
                  />
                  <AuthInput
                    icon={<Lock size={18} />}
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={v => setFormData(f => ({ ...f, password: v }))}
                  />

                  {/* {isLogin && (
                    <div className="text-right">
                      <button type="button" onClick={() => setIsForgot(true)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                        Lupa Password?
                      </button>
                    </div>
                  )} */}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer active:scale-[0.97] hover:brightness-95 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[15px] hover:bg-indigo-700 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60 shadow-xl shadow-indigo-100"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {isLogin ? 'Login Dashboard' : 'Daftar Sekarang'}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <p className="mt-6 text-center text-slate-400 text-sm font-medium">
                  {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-1.5 text-indigo-600 font-black hover:underline"
                  >
                    {isLogin ? 'Daftar Gratis' : 'Login'}
                  </button>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;