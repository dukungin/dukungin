import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Tambahkan import ini

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [isForgot, setIsForgot] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const [isVerify, setIsVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [pin, setPin] = useState(Array(6).fill(''));
  const [resendTimer, setResendTimer] = useState(60); // 60 detik
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  
  // State untuk Modal Response
  const navigate = useNavigate();

  // Helper untuk memicu notifikasi
  const [notification, setNotification] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });

  // Update fungsi notify untuk mendukung title & message
  const notify = (title, message, type = 'success') => {
    setNotification({ show: true, title, message, type });
  };

  // 🔥 Logic Timer Real-time
  useEffect(() => {
    let interval;
    if (isVerify && resendTimer > 0 && !canResend) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    
    // Cleanup interval saat komponen unmount atau state berubah
    return () => clearInterval(interval);
  }, [isVerify, resendTimer, canResend]);

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`http://localhost:5101${endpoint}`, formData);
      
      // BACKEND SUCCESS: Status 200 atau 201
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        // Ambil message "Login Berhasil" dari res.data.message backend
        notify("Berhasil!", res.data.message, "success"); 
        setTimeout(() => navigate('/dashboard'), 2000);
     } else {
        notify("Cek Email!", res.data.message, "success");

        setVerifyEmail(formData.email);

        setTimeout(() => {
          setIsVerify(true);
          setNotification(prev => ({ ...prev, show: false })); // 🔥 tutup modal
        }, 1500);

        return; // 🔥 penting supaya stop
      }
    } catch (err) {
        const status = err.response?.status;
        const errorMessage = err.response?.data?.message || "Terjadi kesalahan koneksi";

        // Jika status 403 (Belum Verifikasi)
        if (status === 403) {
          notify("Verifikasi Diperlukan", errorMessage, "error");
          setVerifyEmail(formData.email);
          // Beri jeda sedikit agar user bisa baca modal sebelum pindah ke form PIN
          setTimeout(() => {
            setIsVerify(true);
            setNotification(prev => ({ ...prev, show: false }));
          }, 2000);
          return;
        }

        // Error lainnya
        setNotification({
          show: true,
          title: isLogin ? "Gagal Masuk" : "Registrasi Gagal",
          message: errorMessage,
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
  };

  const handleChangePin = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // auto next
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyPin = async () => {
    try {
      setLoading(true);

      const finalPin = pin.join('');

      const res = await axios.post(
        'http://localhost:5101/api/auth/verify-pin',
        {
          email: verifyEmail,
          pin: finalPin
        }
      );

      notify("Berhasil", res.data.message, "success");

      setIsVerify(false);
      setIsLogin(true);

    } catch (err) {
      notify("Gagal", err.response?.data?.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5101/api/auth/resend-pin',
        { email: verifyEmail }
      );

      notify("Berhasil", res.data.message, "success");

      // 🔥 reset timer
      setResendTimer(60);
      setCanResend(false);

    } catch (err) {
      notify("Gagal", err.response?.data?.message, "error");
    }
  };

  const handleForgotPassword = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        'http://localhost:5101/api/auth/forgot-password',
        { email: emailReset }
      );

      notify("Berhasil", res.data.message, "success");
      setIsForgot(false);

    } catch (err) {
      notify("Gagal", err.response?.data?.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[100vh] bg-[#eef6ff] flex items-center overflow-hidden justify-center p-6 font-sans">
      
     <AnimatePresence>
        {notification.show && (
          <>
            {/* Overlay Biru Gelap Transparan */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md"
              onClick={() => setNotification({ ...notification, show: false })}
            />

            {/* Konten Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4"
            >
              <div className="bg-white rounded-[3rem] p-10 shadow-2xl text-center">
                {/* Icon dinamis berdasarkan type */}
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {notification.type === 'success' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                </div>

                <h3 className="text-3xl font-black text-slate-800 mb-3">
                  {notification.title}
                </h3>
                
                <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
                  {notification.message}
                </p>

                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                    notification.type === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-200' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200'
                  }`}
                >
                  {notification.type === 'success' ? 'Lanjutkan' : 'Perbaiki Data'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1100px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white flex overflow-hidden max-h-[90vh]"
      >
        {/* Left Side (Tetap sama seperti kodemu) */}
        <div className="hidden lg:flex w-1/2 bg-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full opacity-10">
                <svg width="100%" height="100%"><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
            </div>
            
            <div className="relative z-10">
                <div className="w-max px-4 py-1.5 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shadow-xl mb-6">Dukung-In</div>
                <h2 className="text-4xl font-black text-white leading-tight">Mulai Terima <br/> Dukungan Real-time.</h2>
                <p className="text-indigo-100 mt-4 font-medium text-lg w-[90%]">Dashboard paling clean untuk para streamer Indonesia.</p>
            </div>

            <div className="relative z-10 space-y-6">
                <FeatureItem label="Integrasi Xendit Otomatis" />
                <FeatureItem label="Overlay OBS Customizable" />
                <FeatureItem label="Pencairan Dana Cepat" />
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center relative">
          {isVerify ? (
              <>
                <h3 className="text-2xl font-black mb-4">Verifikasi PIN</h3>

                <div className="flex justify-center gap-3 mt-6">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleChangePin(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-14 h-16 text-center text-2xl font-black rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none bg-slate-100 focus:bg-white transition-all"
                    />
                  ))}
                </div>

                <button 
                  onClick={handleVerifyPin}
                  disabled={loading}
                  className="mt-4 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black"
                >
                  Verifikasi
                </button>

               <div className="mt-4 text-center">
                  {canResend ? (
                    <button 
                      onClick={handleResendPin}
                      className="cursor-pointer active:scale-[0.97] hover:brightness-90 text-indigo-600 font-bold hover:underline"
                    >
                      Kirim Ulang PIN
                    </button>
                  ) : (
                    <p className="text-slate-400 font-semibold">
                      Kirim ulang dalam {resendTimer}s
                    </p>
                  )}
                </div>

                <button 
                  onClick={() => setIsVerify(false)}
                  className="mt-3 text-sm cursor-pointer text-md underline text-indigo-500"
                >
                  Kembali
                </button>
              </>
            ) : isForgot ? (
              <>
                <h3 className="text-2xl font-black mb-4">Lupa Password</h3>

                <AuthInput
                  icon={<Mail size={20}/>}
                  placeholder="Masukkan Email"
                  onChange={(v) => setEmailReset(v)}
                />

                 <button 
                    type="submit" 
                    disabled={loading}
                    onClick={handleForgotPassword}
                    className="cursor-pointer active:scale-[0.97] hover:brightness-90 mt-4 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 group disabled:opacity-70"
                  >
                  Kirim Link Reset
                </button>

                <button onClick={() => setIsForgot(false)} className="text-md underline text-indigo-500 hover:text-indigo-600 mt-6 cursor-pointer active:scale-[0.97]">
                  Kembali ke login
                </button>
              </>
            ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-3xl font-black text-slate-800 mb-2">
                  {isLogin ? 'Selamat Datang!' : 'Buat Akun Baru'}
                </h3>
                <p className="text-slate-500 font-medium mb-10">
                  {isLogin ? 'Masuk untuk mengelola overlay kamu.' : 'Daftar sekarang dan mulai kustomisasi alert kamu.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <AuthInput 
                      icon={<User size={20}/>} 
                      placeholder="Username" 
                      value={formData.username}
                      onChange={(v) => setFormData({...formData, username: v})}
                    />
                  )}
                  <AuthInput 
                    icon={<Mail size={20}/>} 
                    type="email" 
                    placeholder="Alamat Email" 
                    value={formData.email}
                    onChange={(v) => setFormData({...formData, email: v})}
                  />
                  <AuthInput 
                    icon={<Lock size={20}/>} 
                    type="password" 
                    placeholder="Password" 
                    value={formData.password}
                    onChange={(v) => setFormData({...formData, password: v})}
                  />

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 group disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        {isLogin ? 'Login Dashboard' : 'Daftar Sekarang'}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-10 text-center text-slate-500 font-semibold">
                  {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-2 text-indigo-600 hover:underline font-black"
                  >
                    {isLogin ? 'Daftar Gratis' : 'Login di Sini'}
                  </button>
                </p>
                {isLogin && (
                  <p className="mt-4 text-center">
                    <button 
                      onClick={() => setIsForgot(true)} 
                      className="text-indigo-500 cursor-pointer active:scale-[0.97] hover:text-indigo-600 hover:underline"
                    >
                      Lupa Password?
                    </button>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Sub-components (Tetap sama dengan sedikit tuning style)
const AuthInput = ({ icon, type, value, onChange, placeholder }) => {
  // State lokal untuk handle show/hide khusus untuk input ini
  const [showPassword, setShowPassword] = useState(false);
  
  // Deteksi apakah ini input password
  const isPassword = type === 'password';

  // Proteksi XSS Sederhana: Membersihkan tag script jika user mencoba menyisipkannya
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/<script.*?>.*?<\/script>/gi, '');
    onChange(sanitizedValue);
  };

  return (
    <div className="relative group">
      {/* Icon Sisi Kiri */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10">
        {icon}
      </div>

      {/* Input Field */}
      <input 
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full bg-slate-100 border-2 border-transparent rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
      />

      {/* Icon Mata (Hanya muncul jika type="password") */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer z-10 p-1"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};

const FeatureItem = ({ label }) => (
  <div className="flex items-center gap-3 text-white font-bold">
    <div className="bg-white/20 p-1.5 rounded-full text-white shadow-inner"><CheckCircle2 size={16}/></div>
    <span className="text-sm lg:text-base">{label}</span>
  </div>
);

export default Auth;