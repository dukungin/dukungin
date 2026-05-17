// import axios from 'axios';
// import { AnimatePresence, motion } from 'framer-motion';
// import { ImageIcon, Loader2, Video, X, LogOut, User, ChevronDown, Heart, Eye, EyeOff, Mail, Lock, AtSign, Moon, Sun } from 'lucide-react';
// import { useCallback, useEffect, useRef, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { useTheme } from '../hooks/useTheme';
// import Badge from '../components/badge';
// import { VoiceRecorder } from '../components/voiceOver';

// // ============================================================
// // DETEKSI ENVIRONMENT
// // ============================================================
// const isProduction = import.meta.env.VITE_NODE_ENV === 'production';

// const MIDTRANS_CLIENT_KEY = isProduction
//   ? import.meta.env.VITE_MIDTRANS_CLIENT_KEY
//   : import.meta.env.VITE_DEV_MIDTRANS_CLIENT_KEY;

// const SNAP_URL = isProduction
//   ? 'https://app.midtrans.com/snap/snap.js'
//   : 'https://app.sandbox.midtrans.com/snap/snap.js';

// const BASE_URL = import.meta.env.VITE_API_URL;

// // ============================================================
// // AUTH HELPERS
// // ============================================================
// const getToken   = () => localStorage.getItem('token');
// const getPayload = () => {
//   const t = getToken();
//   if (!t) return null;
//   try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
// };
// const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// // ============================================================
// // HELPER — Media Detection
// // ============================================================
// const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

// const isYouTubeUrl = (url) => {
//   if (!url) return false;
//   const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i;
//   return ytRegex.test(url);
// };

// const getYouTubeEmbedUrl = (url) => {
//   if (!url) return '';
//   if (url.includes('youtu.be')) {
//     const videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
//     return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
//   }
//   try {
//     const urlObj = new URL(url);
//     const videoId = urlObj.searchParams.get('v');
//     if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
//   } catch { /* fallback */ }
//   return url;
// };

// const getYouTubeStartTime = (seconds) => {
//   if (!seconds || seconds < 0) return 0;
//   return Math.floor(seconds);
// };

// const YouTubeTimePicker = ({ startTime, onChange }) => {
//   const [hours, setHours] = useState(0);
//   const [minutes, setMinutes] = useState(0);
//   const [seconds, setSeconds] = useState(0);

//   useEffect(() => {
//     const totalSeconds = getYouTubeStartTime(startTime);
//     setHours(Math.floor(totalSeconds / 3600));
//     setMinutes(Math.floor((totalSeconds % 3600) / 60));
//     setSeconds(totalSeconds % 60);
//   }, [startTime]);

//   const handleTimeChange = () => {
//     const totalSeconds = hours * 3600 + minutes * 60 + seconds;
//     onChange(totalSeconds);
//   };

//   useEffect(() => {
//     handleTimeChange();
//   }, [hours, minutes, seconds]);

//   return (
//     <motion.div
//       initial={{ opacity: 0, height: 0 }}
//       animate={{ opacity: 1, height: 'auto' }}
//       className="mt-4 p-4 bg-gradient-to-r from-yellow-50/70 to-orange-50/70 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800 rounded-none space-y-3"
//     >
//       <div className="flex items-center gap-2">
//         <div>
//           <p className="text-xs font-black text-yellow-700 dark:text-yellow-400 leading-none">
//             Kustom Waktu Mulai Video
//           </p>
//           <p className="text-[10px] text-yellow-500 dark:text-yellow-400 font-medium mt-0.5">
//             Video akan dimulai dari waktu yang kamu pilih
//           </p>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-2">
//         {/* Hours */}
//         <div className="space-y-1">
//           <label className="block text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-wider text-center">
//             Jam
//           </label>
//           <input
//             type="number"
//             min="0"
//             max="23"
//             value={hours}
//             onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
//             className="w-full p-2 text-center rounded-none bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-700 focus:border-yellow-400 dark:focus:border-yellow-500 font-mono text-sm font-bold text-slate-700 dark:text-white outline-none"
//           />
//         </div>

//         {/* Minutes */}
//         <div className="space-y-1">
//           <label className="block text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-wider text-center">
//             Menit
//           </label>
//           <input
//             type="number"
//             min="0"
//             max="59"
//             value={minutes}
//             onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
//             className="w-full p-2 text-center rounded-none bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-700 focus:border-yellow-400 dark:focus:border-yellow-500 font-mono text-sm font-bold text-slate-700 dark:text-white outline-none"
//           />
//         </div>

//         {/* Seconds */}
//         <div className="space-y-1">
//           <label className="block text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-wider text-center">
//             Detik
//           </label>
//           <input
//             type="number"
//             min="0"
//             max="59"
//             value={seconds}
//             onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
//             className="w-full p-2 text-center rounded-none bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-700 focus:border-yellow-400 dark:focus:border-yellow-500 font-mono text-sm font-bold text-slate-700 dark:text-white outline-none"
//           />
//         </div>
//       </div>
// {/* 
//       <div className="text-center pt-2 border-t border-yellow-200 dark:border-yellow-800">
//         <p className="text-[10px] text-yellow-500 dark:text-yellow-400 font-medium">
//           Total: {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:
//           {seconds.toString().padStart(2, '0')}
//         </p>
//       </div> */}
//     </motion.div>
//   );
// };


// const getMediaType = (url) => {
//   if (!url) return null;
//   if (isYouTubeUrl(url)) return 'youtube';
//   if (isDirectVideoUrl(url)) return 'video';
//   return 'image';
// };

// // ============================================================
// // HELPER — format rupiah singkat
// // ============================================================
// const formatRp = (n) => {
//   if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}jt`;
//   if (n >= 1000) return `${n / 1000}K`;
//   return String(n);
// };

// // ============================================================
// // HELPER — cari eligible media trigger
// // ============================================================
// const getEligibleTrigger = (mediaTriggers = [], amount) => {
//   if (!mediaTriggers.length || !amount) return null;
//   const eligible = mediaTriggers
//     .filter((t) => Number(amount) >= t.minAmount)
//     .sort((a, b) => b.minAmount - a.minAmount);
//   return eligible[0] || null;
// };

// // ============================================================
// // AUTH MODAL COMPONENT
// // ============================================================
// const AuthModal = ({ isOpen, onClose, defaultTab = 'login', onAuthSuccess }) => {
//   const [tab, setTab] = useState(defaultTab);
//   const [showPass, setShowPass] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const [loginForm, setLoginForm] = useState({ email: '', password: '' });
//   const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

//   useEffect(() => {
//     setTab(defaultTab);
//     setError('');
//     setSuccess('');
//   }, [defaultTab, isOpen]);

//   // Lock body scroll when modal open
//   useEffect(() => {
//     if (isOpen) document.body.style.overflow = 'hidden';
//     else document.body.style.overflow = '';
//     return () => { document.body.style.overflow = ''; };
//   }, [isOpen]);

//   const handleLogin = async () => {
//     setError('');
//     if (!loginForm.email || !loginForm.password) return setError('Email dan password wajib diisi.');
//     setLoading(true);
//     try {
//       const res = await axios.post(`${BASE_URL}/api/auth/login`, loginForm);
//       localStorage.setItem('token', res.data.token);
//       onAuthSuccess(res.data);
//       onClose();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Login gagal. Coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRegister = async () => {
//     setError('');
//     if (!registerForm.username || !registerForm.email || !registerForm.password)
//       return setError('Semua field wajib diisi.');
//     if (registerForm.password.length < 6) return setError('Password minimal 6 karakter.');
//     setLoading(true);
//     try {
//       await axios.post(`${BASE_URL}/api/auth/register`, registerForm);
//       setSuccess('Registrasi berhasil! Cek email untuk verifikasi PIN, lalu login.');
//       setTab('login');
//       setLoginForm({ email: registerForm.email, password: '' });
//     } catch (err) {
//       setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-lg"
//           />

//           {/* Modal */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.93, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.93, y: 20 }}
//             transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
//             className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
//           >
//             <div className="relative overflow-hidden w-full md:max-w-md max-w-lg bg-white dark:bg-slate-900 rounded-none shadow-2xl shadow-indigo-200/50 dark:shadow-slate-800/50 border border-indigo-100 dark:border-slate-800 overflow-hidden pointer-events-auto">
//               {/* Header gradient stripe */}
//               <div className="relative h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500" />

//               <div className="p-7 space-y-5">
//                 {/* Close + Title */}
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="text-xl font-black text-slate-800 dark:text-white">
//                       {tab === 'login' ? '👋 Masuk Dulu' : '🚀 Daftar Sekarang'}
//                     </h2>
//                     <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
//                       {tab === 'login'
//                         ? 'Login agar donasi tercatat di riwayat kamu'
//                         : 'Buat akun gratis dan mulai mendukung kreator'}
//                     </p>
//                   </div>
//                   <button
//                     onClick={onClose}
//                     className="absolute top-0 right-0 cursor-pointer active:scale-[0.98] hover:brightness-90 w-10 h-10 bg-red-200 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-700/80 hover:text-white text-red-700 dark:text-slate-500 hover:dark:text-white flex items-center justify-center transition-all"
//                   >
//                     <X size={15} />
//                   </button>
//                 </div>

//                 {/* Error / Success */}
//                 <AnimatePresence>
//                   {error && (
//                     <motion.div
//                       initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                       className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-none text-xs font-bold text-red-600 dark:text-red-400"
//                     >
//                       <X size={13} /> {error}
//                     </motion.div>
//                   )}
//                   {success && (
//                     <motion.div
//                       initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                       className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-none text-xs font-bold text-green-700 dark:text-green-400"
//                     >
//                       ✅ {success}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* FORM */}
//                 <AnimatePresence mode="wait">
//                   {tab === 'login' ? (
//                     <motion.div
//                       key="login"
//                       initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
//                       className="space-y-3"
//                     >
//                       {/* Email */}
//                       <div className="relative">
//                         <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
//                         <input
//                           type="email"
//                           placeholder="Email kamu"
//                           value={loginForm.email}
//                           onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
//                           onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
//                           className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
//                         />
//                       </div>
//                       {/* Password */}
//                       <div className="relative">
//                         <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
//                         <input
//                           type={showPass ? 'text' : 'password'}
//                           placeholder="Password"
//                           value={loginForm.password}
//                           onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
//                           onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
//                           className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
//                         />
//                         <button
//                           onClick={() => setShowPass(!showPass)}
//                           className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-all"
//                         >
//                           {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
//                         </button>
//                       </div>
//                       <motion.button
//                         whileTap={{ scale: 0.97 }}
//                         onClick={handleLogin}
//                         disabled={loading}
//                         className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm cursor-pointer active:scale-[1] disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:brightness-85"
//                       >
//                         {loading ? <><Loader2 size={15} className="animate-spin" /> Masuk...</> : '→ Masuk Sekarang'}
//                       </motion.button>
//                     </motion.div>
//                   ) : (
//                     <motion.div
//                       key="register"
//                       initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
//                       className="space-y-3"
//                     >
//                       {/* Username */}
//                       <div className="relative">
//                         <AtSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
//                         <input
//                           type="text"
//                           placeholder="Username"
//                           value={registerForm.username}
//                           onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
//                           className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
//                         />
//                       </div>
//                       {/* Email */}
//                       <div className="relative">
//                         <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
//                         <input
//                           type="email"
//                           placeholder="Email kamu"
//                           value={registerForm.email}
//                           onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
//                           className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
//                         />
//                       </div>
//                       {/* Password */}
//                       <div className="relative">
//                         <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
//                         <input
//                           type={showPass ? 'text' : 'password'}
//                           placeholder="Password (min. 6 karakter)"
//                           value={registerForm.password}
//                           onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
//                           className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
//                         />
//                         <button
//                           onClick={() => setShowPass(!showPass)}
//                           className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-all"
//                         >
//                           {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
//                         </button>
//                       </div>
//                       <motion.button
//                         whileTap={{ scale: 0.97 }}
//                         onClick={handleRegister}
//                         disabled={loading}
//                         className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm shadow-lg shadow-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:brightness-110"
//                       >
//                         {loading ? <><Loader2 size={15} className="animate-spin" /> Mendaftar...</> : '🎉 Buat Akun Gratis'}
//                       </motion.button>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
//                   Dengan mendaftar, kamu menyetujui syarat & ketentuan Sawer.in
//                 </p>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };

// // ============================================================
// // NAVBAR COMPONENT
// // ============================================================
// const SupporterNavbar = ({ onOpenAuth, authPayload, profile, onLogout, theme, toggleTheme }) => {
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropRef = useRef(null);

//   const isLoggedIn = !!authPayload;
//   const displayName  = profile?.username  || authPayload?.username  || '?';
//   const displayEmail = profile?.email     || authPayload?.email     || '';

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handler = (e) => {
//       if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3">
//       <div className="max-w-xl mx-auto flex items-center justify-between">
//         {/* Logo */}
//         <Link to="/" className="flex items-center gap-2">
//           <div className="w-9 h-9 bg-pink-200 rounded-none p-1.5 flex items-center justify-center">
//             <img src="/jellyfish.png" alt="icon" />
//           </div>
//           <span className="font-black text-sm text-slate-800 dark:text-white tracking-tight">TapTipTup</span>
//         </Link>

//         {/* Right side */}
//         <div className="flex items-center gap-2">
//           {/* === TOGGLE THEME === */}
//           <button 
//             onClick={toggleTheme} 
//             className="cursor-pointer active:scale-[0.97] h-[40px] w-[40px] flex items-center justify-center rounded-none border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-50 transition-all shadow-sm"
//           >
//             {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
//           </button>
          
//           {isLoggedIn ? (
//             <div className="relative" ref={dropRef}>
//               <button
//                 onClick={() => setDropdownOpen((v) => !v)}
//                 className="flex items-center gap-2 px-2 h-[40px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
//               >
//                 {/* Avatar inisial — GANTI INI */}
//                 <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-none flex items-center justify-center text-white font-black text-xs flex-shrink-0 overflow-hidden">
//                   {profile?.profilePicture ? (
//                     <img
//                       src={profile.profilePicture}
//                       alt={displayName}
//                       className="w-full h-full object-cover"
//                       onError={(e) => {
//                         e.target.style.display = 'none';
//                         e.target.parentElement.innerHTML = displayName.charAt(0).toUpperCase();
//                       }}
//                     />
//                   ) : (
//                     displayName.charAt(0).toUpperCase()
//                   )}
//                 </div>
//                 <span className="font-black text-sm text-slate-700 dark:text-white hidden sm:block max-w-[130px] truncate">
//                   @{displayName}
//                 </span>
//                 <ChevronDown
//                   size={13}
//                   className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
//                 />
//               </button>

//               <AnimatePresence>
//                 {dropdownOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -8, scale: 0.95 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -8, scale: 0.95 }}
//                     transition={{ duration: 0.15 }}
//                     className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-none shadow-xl shadow-slate-200/80 dark:shadow-slate-800/80 border border-slate-100 dark:border-slate-800 overflow-hidden"
//                   >
//                     {/* Info akun */}
//                     <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
//                       <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-none flex items-center justify-center text-white font-black text-sm flex-shrink-0">
//                         {displayName.charAt(0).toUpperCase()}
//                       </div>
//                       <div className="min-w-0">
//                         <p className="font-black text-slate-800 dark:text-white text-sm truncate">@{displayName}</p>
//                         <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{displayEmail}</p>
//                       </div>
//                     </div>

//                     <div className="p-1.5 space-y-0.5">
//                       <Link
//                         to="/dashboard"
//                         className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300"
//                         onClick={() => setDropdownOpen(false)}
//                       >
//                         <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 rounded-none flex items-center justify-center flex-shrink-0">
//                           <User size={13} className="text-indigo-500" />
//                         </div>
//                         Dashboard Saya
//                       </Link>
//                       <Link
//                         to="/dashboard?tab=myDonations"
//                         className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300"
//                         onClick={() => setDropdownOpen(false)}
//                       >
//                         <div className="w-7 h-7 bg-pink-50 dark:bg-pink-900/30 rounded-none flex items-center justify-center flex-shrink-0">
//                           <Heart size={13} className="text-pink-500" />
//                         </div>
//                         Riwayat Berdonasi Saya
//                       </Link>
//                     </div>

//                     <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
//                       <button
//                         onClick={() => { setDropdownOpen(false); onLogout(); }}
//                         className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-all text-sm font-bold text-red-500 dark:text-red-400 cursor-pointer"
//                       >
//                         <div className="w-7 h-7 bg-red-50 dark:bg-red-900/20 rounded-none flex items-center justify-center flex-shrink-0">
//                           <LogOut size={13} className="text-red-400" />
//                         </div>
//                         Keluar
//                       </button>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           ) : (
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => onOpenAuth('login')}
//                 className="px-4 py-2 bg-gradient-to-r active:scale-[0.98] from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm hover:brightness-110 transition-all cursor-pointer"
//               >
//                 Masuk
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// // ============================================================
// // SUB-COMPONENT — Media Input Section
// // ============================================================
// const MediaInputSection = ({ trigger, mediaUrl, setMediaUrl, startTime, setStartTime }) => {
//   const [previewError, setPreviewError] = useState(false);
//   const videoRef = useRef(null);
//   const isYouTube = isYouTubeUrl(mediaUrl);

//   useEffect(() => {
//     setPreviewError(false);
//   }, [mediaUrl]);

//   const mediaType = getMediaType(mediaUrl);
//   const hasPreview = mediaUrl && !previewError;

//   const allowImage = trigger.mediaType === 'image' || trigger.mediaType === 'both';
//   const allowVideo = trigger.mediaType === 'video' || trigger.mediaType === 'both';

//   const placeholderText =
//     allowImage && allowVideo
//       ? 'https://youtu.be/xxxx atau https://i.imgur.com/xxxx.jpg'
//       : allowVideo
//       ? 'https://youtu.be/xxxx atau https://example.com/video.mp4'
//       : 'https://i.imgur.com/contoh-gambar.jpg';

//   // MODIFIED: getYouTubeEmbedUrl dengan start time
//   const getYouTubeEmbedUrlWithTime = (url, startSeconds = 0) => {
//     if (!url) return '';
//     let embedUrl = getYouTubeEmbedUrl(url);
//     if (startSeconds > 0) {
//       const separator = embedUrl.includes('?') ? '&' : '?';
//       embedUrl += `${separator}start=${startSeconds}&autoplay=1&mute=1`;
//     }
//     return embedUrl;
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, height: 0, marginTop: 0 }}
//       animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
//       exit={{ opacity: 0, height: 0, marginTop: 0 }}
//       transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
//       className="overflow-hidden"
//     >
//       <div className="rounded-none border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/30 p-5 space-y-4">
//         {/* Badge unlock */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-7 h-7 rounded-none bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
//               {allowVideo && allowImage ? (
//                 <span className="flex items-center gap-0.5">
//                   <ImageIcon size={9} />
//                   <Video size={9} />
//                 </span>
//               ) : allowVideo ? (
//                 <Video size={13} />
//               ) : (
//                 <ImageIcon size={13} />
//               )}
//             </div>
//             <div>
//               <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 leading-none">
//                 🎉 {trigger.label || 'Media Alert'} Unlocked!
//               </p>
//               <p className="text-[10px] text-indigo-400 dark:text-indigo-500 font-medium mt-0.5">
//                 Tersedia mulai Rp {Number(trigger.minAmount).toLocaleString('id-ID')}
//               </p>
//             </div>
//           </div>
//           {mediaUrl && (
//             <button
//               onClick={() => {
//                 setMediaUrl('');
//                 setStartTime(0);
//               }}
//               className="w-6 h-6 rounded-none bg-indigo-100 dark:bg-indigo-900 hover:bg-red-100 dark:hover:bg-red-900 text-indigo-400 dark:text-indigo-500 flex items-center justify-center transition-all hover:text-red-500 dark:hover:text-red-400"
//             >
//               <X size={12} />
//             </button>
//           )}
//         </div>

//         {/* Tipe media yang diizinkan */}
//         <div className="flex items-center gap-2">
//           {allowImage && (
//             <span className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded-none text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
//               <ImageIcon size={10} /> Gambar / GIF
//             </span>
//           )}
//           {allowVideo && (
//             <span className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-purple-800 rounded-none text-[10px] font-bold text-purple-600 dark:text-purple-400">
//               <Video size={10} /> Video + YouTube
//             </span>
//           )}
//         </div>

//         {/* Input URL */}
//         <div className="space-y-1.5">
//           <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1">
//             Link Media (YouTube & External didukung)
//           </label>
//           <input
//             type="url"
//             value={mediaUrl}
//             onChange={(e) => {
//               setMediaUrl(e.target.value);
//               setStartTime(0); // Reset waktu saat ganti URL
//             }}
//             className="w-full p-4 rounded-none bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none font-mono text-xs text-slate-700 dark:text-white font-bold transition-all placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500"
//             placeholder={placeholderText}
//           />
//           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">
//             * Opsional — Gambar (jpg, gif, png, webp), Video langsung (.mp4), atau link YouTube
//           </p>
//         </div>

//         {/* ✅ YOUTUBE TIME PICKER — HANYA UNTUK YOUTUBE */}
//         <AnimatePresence>
//           {isYouTube && mediaUrl && (
//             <YouTubeTimePicker
//               startTime={startTime}
//               onChange={setStartTime}
//             />
//           )}
//         </AnimatePresence>

//         {/* PREVIEW */}
//         <AnimatePresence>
//           {hasPreview && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.96 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.96 }}
//               transition={{ duration: 0.25 }}
//               className="rounded-none overflow-hidden border border-indigo-100 dark:border-indigo-800 bg-slate-900 relative"
//               style={{ maxHeight: 200 }}
//             >
//               {mediaType === 'youtube' ? (
//                 <iframe
//                   src={getYouTubeEmbedUrlWithTime(mediaUrl, startTime)}
//                   className="w-full aspect-video"
//                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                   allowFullScreen
//                   onError={() => setPreviewError(true)}
//                 />
//               ) : mediaType === 'video' ? (
//                 <video
//                   ref={videoRef}
//                   src={mediaUrl}
//                   autoPlay
//                   muted
//                   loop
//                   playsInline
//                   className="w-full object-cover"
//                   style={{ maxHeight: 200 }}
//                   onError={() => setPreviewError(true)}
//                 />
//               ) : (
//                 <img
//                   src={mediaUrl}
//                   alt="Media preview"
//                   className="w-full object-cover"
//                   style={{ maxHeight: 200 }}
//                   onError={() => setPreviewError(true)}
//                 />
//               )}
//               <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/60 backdrop-blur-sm">
//                 <p className="text-[10px] text-white/90 font-bold">
//                   {mediaType === 'youtube' ? (
//                     <>
//                       ▶️ YouTube Video 
//                       {startTime > 0 && (
//                         <span className="ml-1 bg-yellow-500/30 px-1 py-0.5 rounded text-[9px]">
//                           {Math.floor(startTime / 60).toString().padStart(2, '0')}:
//                           {(startTime % 60).toString().padStart(2, '0')}
//                         </span>
//                       )}
//                     </>
//                   ) : mediaType === 'video' ? '🎬 Direct Video' : '🖼️ Gambar'}
//                   — Preview
//                 </p>
//               </div>
//             </motion.div>
//           )}

//           {previewError && mediaUrl && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="rounded-none border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs text-red-500 dark:text-red-400 font-bold flex items-center gap-2"
//             >
//               <X size={14} /> URL tidak valid atau media tidak dapat dimuat.
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </motion.div>
//   );
// };

//   const QuickAudioSection = ({ 
//     publicSounds = [], 
//     selectedSound, 
//     onSoundChange,
//     amount 
//   }) => {
//     const safePublicSounds = Array.isArray(publicSounds) ? publicSounds.slice(0, 7) : [];
//     const audioRef = useRef(null);
//     const [previewing, setPreviewing] = useState(null);
//     const [previewError, setPreviewError] = useState(null);
//     const timeoutRef = useRef(null);

//     const getAudioProxyUrl = useCallback((url) => {
//     if (!url) return '';
    
//     // ✅ Cloudinary URL — langsung pakai, tidak perlu proxy
//     if (
//       url.includes('cloudinary.com') ||
//       url.includes('res.cloudinary.com') ||
//       url.includes('/uploads/') ||
//       url.includes('railway.app') ||
//       url.includes(window.location.origin)
//     ) {
//       return url;
//     }
    
//     // Hanya proxy untuk URL eksternal lain (myinstants, dll)
//     return `/api/overlay/proxy-audio?url=${encodeURIComponent(url)}`;
//   }, []);

//   // ✅ INSTANT STOP + SWITCH
//   const stopPreview = useCallback(() => {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current.currentTime = 0;
//     }
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = null;
//     }
//     setPreviewing(null);
//     setPreviewError(null);
//   }, []);

//   const playPreview = useCallback((originalUrl) => {
//     // ✅ INSTANT STOP SEMUA YANG LAMA
//     stopPreview();
    
//     const proxyUrl = getAudioProxyUrl(originalUrl);
//     if (!proxyUrl || !audioRef.current) return;
    
//     // ✅ LOAD BARU
//     audioRef.current.src = proxyUrl;
//     audioRef.current.currentTime = 0;
//     setPreviewError(null);
    
//     const playPromise = audioRef.current.play();
    
//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           setPreviewing(originalUrl);
//         })
//         .catch((err) => {
//           console.warn('Play failed:', err);
//           setPreviewError(originalUrl);
//         });
//     } else {
//       setPreviewing(originalUrl);
//     }
    
//     // ✅ AUTO STOP 5s
//     timeoutRef.current = setTimeout(() => {
//       stopPreview();
//     }, 5000);
    
//     // ✅ EVENT LISTENERS
//     const handleEnded = () => stopPreview();
//     const handleError = () => {
//       setPreviewError(originalUrl);
//       stopPreview();
//     };
    
//     audioRef.current.onended = handleEnded;
//     audioRef.current.onerror = handleError;
//   }, [getAudioProxyUrl, stopPreview]);

//   // ✅ CLEANUP
//   useEffect(() => {
//     return () => {
//       stopPreview();
//     };
//   }, [stopPreview]);

//   if (safePublicSounds.length === 0 || amount === 0) return null;

//   return (
//     <div className="space-y-3">
//       <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
//         Pilih Suara Notif 🎵
//       </label>
      
//       <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
//         {/* No Sound */}
//         <button 
//           onClick={() => {
//             onSoundChange('');
//             stopPreview(); // Stop jika playing
//           }}
//           className={`group p-2.5 rounded-none border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-[0.99] hover:bg-slate-900 ${
//             !selectedSound 
//               ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 shadow-sm' 
//               : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300'
//           }`}
//         >
//           <span className="text-lg">🔇</span>
//           <span className="leading-tight text-slate-900 dark:text-white text-xs">No Sound</span>
//         </button>

//         {/* Sounds - INSTANT SWITCH */}
//         {safePublicSounds.map((sound, i) => {
//           const isPlaying = previewing === sound.url;
//           const hasError = previewError === sound.url;
          
//           return (
//             <button 
//               key={`${sound.url}-${i}`}
//               onClick={() => {
//                 if (hasError) return; // Skip jika error
//                 playPreview(sound.url); // ← INSTANT SWITCH
//                 onSoundChange(sound.url);
//               }}
//               disabled={hasError}
//               className={`group relative p-2.5 pb-3 rounded-none border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed overflow-hidden ${
//                 selectedSound === sound.url
//                   ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 shadow-sm ring-indigo-200/50' 
//                   : hasError
//                     ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-500'
//                     : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:shadow-md'
//               }`}
//               title={hasError 
//                 ? 'Audio bermasalah' 
//                 : isPlaying 
//                   ? 'Playing... (5s)' 
//                   : `${sound.label || `Sound ${i + 1}`} - Klik untuk dengar`
//               }
//             >
//               {/* OVERLAY - SMOOTH */}
//               {isPlaying && (
//                 <motion.div 
//                   layoutId="playing-overlay"
//                   className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 to-green-500/40 backdrop-blur-sm border-2 border-emerald-400 z-10 flex items-center justify-center"
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   exit={{ scale: 0 }}
//                 >
//                   <span className="text-xs font-bold text-emerald-900 drop-shadow-sm">🔊</span>
//                 </motion.div>
//               )}
//               {hasError && (
//                 <div className="absolute inset-0 bg-gradient-to-br from-red-400/40 to-rose-500/40 backdrop-blur-sm border-2 border-red-400 z-10 flex items-center justify-center">
//                   <span className="text-xs font-bold text-red-900">⚠</span>
//                 </div>
//               )}
              
//               {/* CONTENT */}
//               <span className="text-lg relative z-20">{sound.emoji || '🎵'}</span>
//               <span className="leading-tight text-slate-900 dark:text-white relative z-20 truncate max-w-[80%] text-xs font-medium">
//                 {sound.label || `S${i+1}`}
//               </span>
              
//               {/* TOOLTIP ERROR */}
//               {hasError && (
//                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-100 dark:bg-red-900/90 text-red-600 dark:text-red-300 text-[9px] px-2 py-1 rounded whitespace-nowrap shadow-lg border border-red-200 dark:border-red-700 z-20">
//                   Audio error
//                 </div>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* AUDIO PLAYER */}
//       <audio 
//         ref={audioRef} 
//         preload="metadata"
//         crossOrigin="anonymous"
//         className="hidden"
//       />
//     </div>
//   );
// };

// // ============================================================
// // MAIN COMPONENT
// // ============================================================
// const SupporterPage = () => {
//   const { username } = useParams();
//   const [streamer, setStreamer] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [snapReady, setSnapReady] = useState(false);
//   const [mediaUrl, setMediaUrl] = useState('');
//   const { theme, toggle: toggleTheme } = useTheme();  
//   const [startTime, setStartTime] = useState(0);
//   const [activeTab, setActiveTab] = useState('alert'); // 'alert' | 'mediashare' | 'voice'
//   const [form, setForm] = useState({
//     donorName: '',
//     isAnonymous: false,
//     email: '',
//     amount: 0,
//     voiceUrl: '',
//     message: '',
//     soundUrl: '', // ← NEW
//   });

  
//   // Auth state — semua dikelola di sini, dioper ke navbar sebagai props
//   const [authPayload, setAuthPayload] = useState(getPayload());
//   const [authProfile, setAuthProfile] = useState(null); // data lengkap dari API
//   const [authModalOpen, setAuthModalOpen] = useState(false);
//   const [authModalTab, setAuthModalTab] = useState('login');
//   const [badges, setBadges] = useState({ streamer: {}, donor: {} }); // ← DEFAULT OBJECT
  
//   const isLoggedIn = !!authPayload;
  
//   // Open auth modal helper
//   const openAuth = (tab = 'login') => {
//     setAuthModalTab(tab);
//     setAuthModalOpen(true);
//   };
  
//   // Logout: hapus token, reset semua auth state
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     setAuthPayload(null);
//     setAuthProfile(null);
//     setForm((prev) => ({ ...prev, donorName: '', email: '' }));
//   };
  
//   // After successful login — update payload + fetch profil lengkap
//   const handleAuthSuccess = async (data) => {
//     const newPayload = getPayload();
//     setAuthPayload(newPayload);
      
//     if (data?.user) {
//         setAuthProfile(data.user);
//         setForm((prev) => ({
//           ...prev,
//           donorName: data.user.username || prev.donorName,
//           email: data.user.email || prev.email,
//         }));
//       }
      
//       // ✅ FETCH BADGES SETELAH LOGIN
//       if (newPayload?.id) {
//         try {
//           const res = await axios.get(`${BASE_URL}/api/midtrans/badges`, { 
//             headers: authHeader() 
//           });
//           setBadges(res.data.badges || { streamer: {}, donor: {} });
//         } catch (err) {
//           console.log('Failed to fetch badges:', err);
//         }
//       }
//     };
    
//     // Load Midtrans Snap.js
//     useEffect(() => {
//       const existing = document.querySelector('script[src*="snap.js"]');
//       if (existing) { setSnapReady(true); return; }
//       const script = document.createElement('script');
//       script.src = SNAP_URL;
//       script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
//       script.onload = () => setSnapReady(true);
//       document.head.appendChild(script);
//     }, []);
    
//     // Fetch streamer
//     useEffect(() => {
//       if (!username) return;
//       const cleanUsername = username.replace(/^@+/, '');
//     axios
//     .get(`${BASE_URL}/api/overlay/public/${cleanUsername}`)
//     .then((res) => setStreamer(res.data))
//     .catch(() => alert('Streamer tidak ditemukan'));
//   }, [username]);
  
//   // Fetch profil lengkap jika sudah login (misal refresh halaman dengan token ada)
//   useEffect(() => {
//     if (!isLoggedIn) return;
//     axios
//       .get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })
//       .then((r) => {
//         const u = r.data?.user || r.data?.User;
//         if (u) {
//           setAuthProfile(u);
//           setForm((prev) => ({
//             ...prev,
//             donorName: u.username || prev.donorName,
//             email: u.email || prev.email,
//           }));
//         }
//       })
//       .catch(() => {});
//     }, [isLoggedIn]);
    
//     useEffect(() => {
//       if (!isLoggedIn || !authPayload?.id) return;
    
//       const fetchUserBadges = async () => {
//         try {
//           const res = await axios.get(`${BASE_URL}/api/midtrans/badges`, { 
//             headers: authHeader() 
//           });
//         setBadges(res.data.badges || { streamer: {}, donor: {} });
//       } catch (err) {
//         console.log('Failed to fetch badges:', err);
//       }
//     };
    
//     fetchUserBadges();
//   }, [isLoggedIn, authPayload?.id]);
  
//   const mediaTriggers =
//     streamer?.overlaySetting?.mediaTriggers || streamer?.OverlaySetting?.mediaTriggers || [];
//     const eligibleTrigger = getEligibleTrigger(mediaTriggers, form.amount);
    
//     useEffect(() => {
//     if (!eligibleTrigger) setMediaUrl('');
//   }, [eligibleTrigger]);
  
//   // Handle Donate
//   const handleDonate = async () => {
//     if (!form.amount || form.amount < 1000) return alert('Minimal donasi Rp 1.000');
//     if (!streamer?._id) return alert('Data streamer belum siap.');
    
//     const minDonate =
//     streamer?.overlaySetting?.minDonate || streamer?.OverlaySetting?.minDonate || 1000;
//     const maxDonate =
//     streamer?.overlaySetting?.maxDonate || streamer?.OverlaySetting?.maxDonate || 10000000;
    
//     if (form.amount < minDonate)
//       return alert(`Minimal donasi Rp ${minDonate.toLocaleString('id-ID')}`);
//     if (form.amount > maxDonate)
//       return alert(`Maksimal donasi Rp ${maxDonate.toLocaleString('id-ID')}`);
    
//     try {
//       setLoading(true);
      
//       const hasMedia = eligibleTrigger && mediaUrl.trim();
//       const detectedMediaType = getMediaType(mediaUrl?.trim());
      
//       if (hasMedia) {
//         if (eligibleTrigger.mediaType === 'image' && detectedMediaType !== 'image') {
//           return alert('Hanya gambar yang diizinkan untuk nominal ini.');
//         }
//         if (
//           eligibleTrigger.mediaType === 'video' &&
//           !['video', 'youtube'].includes(detectedMediaType)
//         ) {
//           return alert('Hanya video atau YouTube yang diizinkan untuk nominal ini.');
//         }
//       }
      
//       const payload = {
//         amount: Math.round(Number(form.amount)),
//         donorName: form.isAnonymous ? 'Anonim' : form.donorName || 'Anonim',
//         message: form.message,
//         userId: streamer._id,
//         email: form.email.trim() || 'guest@mail.com',
//         mediaUrl: hasMedia ? mediaUrl.trim() : null,
//         mediaType: detectedMediaType,
//         startTime: isYouTubeUrl(mediaUrl) ? startTime : 0, // ← NEW
//         donorUserId: authPayload?.id,
//         soundUrl: form.soundUrl || null,
//         voiceUrl: form.voiceUrl || null,   // ← TAMBAH INI
//       };
      
//       const res = await axios.post(`${BASE_URL}/api/midtrans/create-invoice`, payload);
      
//       if (res.data.token && snapReady && window.snap) {
//         window.snap.pay(res.data.token, {
//           onSuccess: () =>
//             (window.location.href = `/donation/success?username=${streamer.username}`),
//           onPending: () =>
//             (window.location.href = `/donation/pending?username=${streamer.username}`),
//           onError: () => alert('Pembayaran gagal.'),
//           onClose: () => {},
//         });
//       } else {
//         window.location.href = res.data.url;
//       }
//     } catch (err) {
//       console.error(err);
//       alert('Gagal membuat invoice.');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   if (!streamer) {
//     return (
//       <>
//         <SupporterNavbar 
//           onOpenAuth={openAuth} 
//           authPayload={authPayload} 
//           profile={authProfile} 
//           onLogout={handleLogout}
//           theme={theme}           
//           toggleTheme={toggleTheme} 
//           />
//         <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 bg-blue-50 dark:bg-slate-900 pt-16">
//           <Loader2 className="animate-spin mr-2" size={24} /> Memuat Profil...
//         </div>
//         <AuthModal
//           isOpen={authModalOpen}
//           onClose={() => setAuthModalOpen(false)}
//           defaultTab={authModalTab}
//           onAuthSuccess={handleAuthSuccess}
//           />
//       </>
//     );
//   }
  
//   const overlaySetting = streamer?.overlaySetting || streamer?.OverlaySetting || {};
//   const minDonate = overlaySetting?.minDonate || 1000;
//   const maxDonate = overlaySetting?.maxDonate || 10000000;
//   const quickAmounts = (
//     streamer?.overlaySetting?.quickAmounts ||
//     streamer?.OverlaySetting?.quickAmounts ||
//     [10000, 25000, 50000, 100000]
//   ).filter((v) => v >= minDonate && v <= maxDonate);
  
//   const sortedTriggers = [...mediaTriggers].sort((a, b) => a.minAmount - b.minAmount);
//   const publicSounds = Array.isArray(streamer?.overlaySetting?.publicSounds)
//   ? streamer.overlaySetting.publicSounds
//   : Array.isArray(streamer?.publicSounds)
//     ? streamer.publicSounds
//     : [];
    
//   return (
//     <>
//       {/* Auth Modal */}
//       <AuthModal
//         isOpen={authModalOpen}
//         onClose={() => setAuthModalOpen(false)}
//         defaultTab={authModalTab}
//         onAuthSuccess={handleAuthSuccess}
//         />

//       {/* Navbar */}
//       <SupporterNavbar 
//         onOpenAuth={openAuth} 
//         authPayload={authPayload} 
//         profile={authProfile} 
//         onLogout={handleLogout}
//         theme={theme}
//         toggleTheme={toggleTheme}
//       />


//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex justify-center items-start md:items-center p-4 md:p-6 font-sans pt-20 md:pt-24">
//         <div className="w-full max-w-xl space-y-5 py-4 md:py-0">
//           {/* Header Card */}
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-white dark:bg-slate-900 px-8 pt-8 pb-6 rounded-none shadow-xl shadow-indigo-100/50 dark:shadow-slate-800/50 text-center border border-indigo-100 dark:border-slate-800 relative overflow-hidden"
//           >
//             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500" />
//             {/* AVATAR WITH PROFILE PICTURE SUPPORT */}
//             <div className="w-20 h-20 mt-2 mx-auto rounded-none overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-5xl font-black shadow-lg mb-4 border-4 border-white dark:border-slate-900">
//               {streamer?.profilePicture ? (
//                 <img 
//                   src={streamer.profilePicture} 
//                   alt={streamer.username}
//                   className="w-full h-full object-cover"
//                   onError={(e) => {
//                     e.target.style.display = 'none';
//                     e.target.parentElement.innerHTML = streamer.username?.charAt(0).toUpperCase() || '?';
//                   }}
//                 />
//               ) : (
//                 streamer.username?.charAt(0).toUpperCase() || '?'
//               )}
//             </div>
//             <h1 className="text-2xl font-black text-slate-800 dark:text-white">@{streamer.username}</h1>
//             <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{streamer.donateIntro || 'Support aku biar makin semangat 🚀'}</p>

//             {/* Login status badge */}
//             {isLoggedIn ? (
//               <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-none text-[10px] font-black text-green-700 dark:text-green-400">
//                 ✓ Donasi akan tercatat di riwayat akun kamu
//               </div>
//             ) : (
//               <div className="mt-4 flex items-center justify-center gap-1.5">
//                 <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
//                   Punya akun?
//                 </span>
//                 <button
//                   onClick={() => openAuth('login')}
//                   className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
//                   >
//                   Masuk dulu
//                 </button>
//               </div>
//             )}
//             {isLoggedIn && (
//               <div className="w-max flex flex-wrap gap-1.5 justify-center h-max mx-auto text-center mt-6">
//                 {/* Streamer Badges */}
//                 {badges.streamer?.['10k'] && <Badge type="streamer" name="10k" active />}
//                 {badges.streamer?.['50k'] && <Badge type="streamer" name="50k" active />}
//                 {badges.streamer?.['100k'] && <Badge type="streamer" name="100k" active />}
//                 {badges.streamer?.['500k'] && <Badge type="streamer" name="500k" active />}
//                 {badges.streamer?.['1jt'] && <Badge type="streamer" name="1jt" active />}
                
//                 {/* Donor Badges */}
//                 {badges.donor?.['1x'] && <Badge type="donor" name="1x" active />}
//                 {badges.donor?.['5x'] && <Badge type="donor" name="5x" active />}
//                 {badges.donor?.['10k'] && <Badge type="donor" name="10k" active />}
//                 {badges.donor?.['50k'] && <Badge type="donor" name="50k" active />}
//               </div>
//             )}
//           </motion.div>

//           {/* Form Card */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="bg-white dark:bg-slate-900 p-7 rounded-none shadow-xl shadow-indigo-100/50 dark:shadow-slate-800/50 border border-indigo-100 dark:border-slate-800 space-y-5"
//           >
//             {/* Quick Amounts */}
//             {quickAmounts.length > 0 && (
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
//                   Pilih Nominal Cepat
//                 </label>
//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                   {quickAmounts.map((val) => (
//                     <button
//                       key={val}
//                       onClick={() => setForm({ ...form, amount: val })}
//                       className={`cursor-pointer py-4 rounded-none font-black text-sm transition-all border-2 active:scale-[0.99] ${
//                         form.amount === val
//                           ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
//                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300'
//                       }`}
//                     >
//                       Rp {val.toLocaleString('id-ID')}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Kustom Amount + Trigger Info */}
//             <div>
//               <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
//                 Nominal Kustom
//               </label>
//               <div className="relative">
//                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 dark:text-indigo-400 text-sm">
//                   Rp
//                 </span>
//                 <input
//                   type="number"
//                   value={form.amount || ''}
//                   onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
//                   className="w-full p-4 pl-12 rounded-none font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
//                   placeholder="Nominal Kustom..."
//                 />
//               </div>

//               {sortedTriggers.length > 0 && (
//                 <div className="mt-3 space-y-1.5">
//                   {sortedTriggers.map((t, i) => {
//                     const reached = form.amount >= t.minAmount;
//                     const isNext =
//                       !reached &&
//                       (i === 0 || form.amount >= sortedTriggers[i - 1]?.minAmount);
//                     if (!reached && !isNext) return null;

//                     return (
//                       <div
//                         key={i}
//                         className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded-none ${
//                           reached 
//                             ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
//                             : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
//                         }`}
//                       >
//                         <span>{reached ? '✅' : '🔒'}</span>
//                         <span>
//                           {reached ? (
//                             <>{t.label || 'Media Alert'} unlocked!</>
//                           ) : (
//                             <>
//                               Donasi Rp {Number(t.minAmount).toLocaleString('id-ID')} untuk unlock{' '}
//                               {t.label}
//                             </>
//                           )}
//                         </span>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             {/* Message */}
//             <div>
//               <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
//                 Pesan Dukungan
//               </label>
//               <textarea
//                 value={form.message}
//                 onChange={(e) => setForm({ ...form, message: e.target.value })}
//                 className="w-full p-4 rounded-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 min-h-[90px] outline-none transition-all resize-none text-slate-700 dark:text-white dark:placeholder:text-slate-500"
//                 placeholder="Semangat terus bang! 🔥"
//               />
//             </div>

//             {/* Media Input */}
//             <AnimatePresence>
//               {eligibleTrigger && (
//                 <MediaInputSection
//                   trigger={eligibleTrigger}
//                   mediaUrl={mediaUrl}
//                   setMediaUrl={setMediaUrl}
//                   startTime={startTime}
//                   setStartTime={setStartTime}
//                 />
//               )}
//             </AnimatePresence>

//             {publicSounds.length > 0 && (
//               <QuickAudioSection
//                 publicSounds={publicSounds}
//                 selectedSound={form.soundUrl}
//                 onSoundChange={(url) => setForm({ ...form, soundUrl: url })}
//                 amount={form.amount}
//               />
//             )}

//             {/* ── Voice Message ── */}
//             <div>
//               <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
//                 Pesan Suara {' '}
//                 <span className="normal-case font-medium text-slate-300 dark:text-slate-600">
//                   (opsional)
//                 </span>
//               </label>
//               <VoiceRecorder
//                 onVoiceReady={(url) => setForm(f => ({ ...f, voiceUrl: url || '' }))}
//                 maxSeconds={60}
//                 disabled={form.amount < 1000}
//               />
//               {form.amount < 1000 && (
//                 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1.5 ml-1">
//                   Masukkan nominal donasi dulu untuk mengaktifkan voice message
//                 </p>
//               )}
//             </div>

//             {/* Nama & Email */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
//                   Nama
//                 </label>
//                 <input
//                   type="text"
//                   disabled={form.isAnonymous || isLoggedIn}
//                   value={form.isAnonymous ? '' : form.donorName}
//                   onChange={(e) => setForm({ ...form, donorName: e.target.value })}
//                   className="w-full p-4 rounded-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 disabled:opacity-40 outline-none transition-all text-slate-700 dark:text-white"
//                   placeholder="Nama kamu"
//                 />
//                 {isLoggedIn && !form.isAnonymous && (
//                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 ml-1">
//                     Dari akun kamu
//                   </p>
//                 )}
//               </div>
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
//                   Email (opsional)
//                 </label>
//                 <input
//                   type="email"
//                   disabled={isLoggedIn}
//                   value={form.email}
//                   onChange={(e) => setForm({ ...form, email: e.target.value })}
//                   className="w-full p-4 rounded-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 disabled:opacity-40 outline-none transition-all text-slate-700 dark:text-white"
//                   placeholder="email@kamu.com"
//                 />
//               </div>
//             </div>

//             {/* Anonymous toggle */}
//             <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
//               <div
//                 onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
//                 className={`w-10 h-6 rounded-none relative flex-shrink-0 transition-all cursor-pointer ${
//                   form.isAnonymous ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
//                 }`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 bg-white rounded-none shadow transition-all ${
//                     form.isAnonymous ? 'left-5' : 'left-1'
//                   }`}
//                 />
//               </div>
//               Donasi sebagai anonim
//             </label>

//             {/* Login prompt (jika belum login) */}
//             <AnimatePresence>
//               {!isLoggedIn && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="overflow-hidden"
//                 >
//                   <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-none">
//                     <div>
//                       <p className="text-xs font-black text-indigo-700 dark:text-indigo-400">
//                         Donasi kamu tidak akan tercatat
//                       </p>
//                       <p className="text-[10px] text-indigo-400 dark:text-indigo-500 font-medium mt-0.5">
//                         Masuk atau daftar agar donasi muncul di riwayat akun
//                       </p>
//                     </div>
//                     <div className="flex items-center gap-2 flex-shrink-0 ml-3">
//                       <button
//                         onClick={() => openAuth('login')}
//                         className="px-3 py-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-none hover:bg-indigo-50 dark:hover:bg-slate-100 transition-all cursor-pointer"
//                       >
//                         Masuk
//                       </button>
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             <hr className="border-slate-100 dark:border-slate-800" />

//             {/* Submit Button */}
//             <motion.button
//               // whileHover={{ scale: 1 }}
//               whileTap={{ scale: 0.99 }}
//               onClick={handleDonate}
//               disabled={loading || !form.amount}
//               className="cursor-pointer w-full py-3 bg-gradient-to-r from-blue-700 to-blue-700 text-white rounded-none font-black text-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 size={20} className="animate-spin" /> Memproses...
//                 </>
//               ) : (
//                 <>
//                   💜 Kirim Donasi
//                   {form.amount > 0 ? ` Rp ${Number(form.amount).toLocaleString('id-ID')}` : ''}
//                 </>
//               )}
//             </motion.button>
//           </motion.div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default SupporterPage;


import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ImageIcon, Loader2, Video, X, LogOut, User,
  ChevronDown, Heart, Eye, EyeOff, Mail, Lock,
  AtSign, Moon, Sun, Bell, Mic, Film,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import Badge from '../components/badge';
import { VoiceRecorder } from '../components/voiceOver';

// ============================================================
// DETEKSI ENVIRONMENT
// ============================================================
const isProduction = import.meta.env.VITE_NODE_ENV === 'production';

const MIDTRANS_CLIENT_KEY = isProduction
  ? import.meta.env.VITE_MIDTRANS_CLIENT_KEY
  : import.meta.env.VITE_DEV_MIDTRANS_CLIENT_KEY;

const SNAP_URL = isProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

const BASE_URL = import.meta.env.VITE_API_URL;

// ============================================================
// AUTH HELPERS
// ============================================================
const getToken   = () => localStorage.getItem('token');
const getPayload = () => {
  const t = getToken();
  if (!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
};
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// ============================================================
// HELPER — Media Detection
// ============================================================
const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const isGifUrl = (url) => /\.(gif)(\?.*)?$/i.test(url);

const isYouTubeUrl = (url) => {
  if (!url) return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url);
};

const getMediaType = (url) => {
  if (!url) return null;
  if (isYouTubeUrl(url)) return 'youtube';
  if (isDirectVideoUrl(url)) return 'video';
  if (isGifUrl(url)) return 'gif';
  return 'image'; // jpg, png, webp, dll
};

const getYouTubeStartTime = (seconds) => {
  if (!seconds || seconds < 0) return 0;
  return Math.floor(seconds);
};

const getMediaType = (url) => {
  if (!url) return null;
  if (isYouTubeUrl(url)) return 'youtube';
  if (isDirectVideoUrl(url)) return 'video';
  return 'image';
};

const formatRp = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}jt`;
  if (n >= 1000) return `${n / 1000}K`;
  return String(n);
};

const getEligibleTrigger = (mediaTriggers = [], amount) => {
  if (!mediaTriggers.length || !amount) return null;
  const eligible = mediaTriggers
    .filter((t) => Number(amount) >= t.minAmount)
    .sort((a, b) => b.minAmount - a.minAmount);
  return eligible[0] || null;
};

// ============================================================
// YouTubeTimePicker
// ============================================================
const YouTubeTimePicker = ({ startTime, onChange }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const totalSeconds = getYouTubeStartTime(startTime);
    setHours(Math.floor(totalSeconds / 3600));
    setMinutes(Math.floor((totalSeconds % 3600) / 60));
    setSeconds(totalSeconds % 60);
  }, [startTime]);

  useEffect(() => {
    onChange(hours * 3600 + minutes * 60 + seconds);
  }, [hours, minutes, seconds]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 p-4 bg-gradient-to-r from-yellow-50/70 to-orange-50/70 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800 rounded-none space-y-3"
    >
      <p className="text-xs font-black text-yellow-700 dark:text-yellow-400 leading-none">
        Kustom Waktu Mulai Video
      </p>
      <p className="text-[10px] text-yellow-500 dark:text-yellow-400 font-medium">
        Video akan dimulai dari waktu yang kamu pilih
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Jam', value: hours, set: setHours, max: 23 },
          { label: 'Menit', value: minutes, set: setMinutes, max: 59 },
          { label: 'Detik', value: seconds, set: setSeconds, max: 59 },
        ].map(({ label, value, set, max }) => (
          <div key={label} className="space-y-1">
            <label className="block text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-wider text-center">
              {label}
            </label>
            <input
              type="number"
              min="0"
              max={max}
              value={value}
              onChange={(e) => set(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
              className="w-full p-2 text-center rounded-none bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-700 focus:border-yellow-400 font-mono text-sm font-bold text-slate-700 dark:text-white outline-none"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================
// AUTH MODAL
// ============================================================
const AuthModal = ({ isOpen, onClose, defaultTab = 'login', onAuthSuccess }) => {
  const [tab, setTab] = useState(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  useEffect(() => { setTab(defaultTab); setError(''); setSuccess(''); }, [defaultTab, isOpen]);
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogin = async () => {
    setError('');
    if (!loginForm.email || !loginForm.password) return setError('Email dan password wajib diisi.');
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, loginForm);
      localStorage.setItem('token', res.data.token);
      onAuthSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Coba lagi.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError('');
    if (!registerForm.username || !registerForm.email || !registerForm.password)
      return setError('Semua field wajib diisi.');
    if (registerForm.password.length < 6) return setError('Password minimal 6 karakter.');
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, registerForm);
      setSuccess('Registrasi berhasil! Cek email untuk verifikasi PIN, lalu login.');
      setTab('login');
      setLoginForm({ email: registerForm.email, password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-lg"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="relative overflow-hidden w-full md:max-w-md max-w-lg bg-white dark:bg-slate-900 rounded-none shadow-2xl border border-indigo-100 dark:border-slate-800 pointer-events-auto">
              <div className="relative h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500" />
              <div className="p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                      {tab === 'login' ? '👋 Masuk Dulu' : '🚀 Daftar Sekarang'}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {tab === 'login'
                        ? 'Login agar donasi tercatat di riwayat kamu'
                        : 'Buat akun gratis dan mulai mendukung kreator'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="absolute top-0 right-0 cursor-pointer w-10 h-10 bg-red-200 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-700/80 hover:text-white text-red-700 dark:text-slate-500 flex items-center justify-center transition-all"
                  >
                    <X size={15} />
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-none text-xs font-bold text-red-600 dark:text-red-400"
                    >
                      <X size={13} /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-none text-xs font-bold text-green-700 dark:text-green-400"
                    >
                      ✅ {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {tab === 'login' ? (
                    <motion.div key="login" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-3">
                      <div className="relative">
                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                        <input type="email" placeholder="Email kamu" value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all" />
                      </div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                        <input type={showPass ? 'text' : 'password'} placeholder="Password" value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all" />
                        <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 hover:text-slate-500 transition-all">
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogin} disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:brightness-85">
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Masuk...</> : '→ Masuk Sekarang'}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="register" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3">
                      <div className="relative">
                        <AtSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                        <input type="text" placeholder="Username" value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all" />
                      </div>
                      <div className="relative">
                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                        <input type="email" placeholder="Email kamu" value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all" />
                      </div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                        <input type={showPass ? 'text' : 'password'} placeholder="Password (min. 6 karakter)" value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 rounded-none text-sm font-bold text-slate-700 dark:text-white outline-none transition-all" />
                        <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-all">
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleRegister} disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:brightness-110">
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Mendaftar...</> : '🎉 Buat Akun Gratis'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tab switch */}
                <div className="flex items-center justify-center gap-1 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {tab === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                  </span>
                  <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                    className="font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                    {tab === 'login' ? 'Daftar gratis' : 'Masuk'}
                  </button>
                </div>

                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Dengan mendaftar, kamu menyetujui syarat & ketentuan Sawer.in
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// NAVBAR
// ============================================================
const SupporterNavbar = ({ onOpenAuth, authPayload, profile, onLogout, theme, toggleTheme }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);
  const isLoggedIn = !!authPayload;
  const displayName  = profile?.username  || authPayload?.username  || '?';
  const displayEmail = profile?.email     || authPayload?.email     || '';

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-pink-200 rounded-none p-1.5 flex items-center justify-center">
            <img src="/jellyfish.png" alt="icon" />
          </div>
          <span className="font-black text-sm text-slate-800 dark:text-white tracking-tight">TapTipTup</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="cursor-pointer h-[40px] w-[40px] flex items-center justify-center rounded-none border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-50 transition-all shadow-sm">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isLoggedIn ? (
            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-2 h-[40px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none transition-all cursor-pointer border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-none flex items-center justify-center text-white font-black text-xs flex-shrink-0 overflow-hidden">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt={displayName} className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = displayName.charAt(0).toUpperCase(); }} />
                  ) : displayName.charAt(0).toUpperCase()}
                </div>
                <span className="font-black text-sm text-slate-700 dark:text-white hidden sm:block max-w-[130px] truncate">@{displayName}</span>
                <ChevronDown size={13} className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-none shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-none flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 dark:text-white text-sm truncate">@{displayName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{displayEmail}</p>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300">
                        <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 rounded-none flex items-center justify-center flex-shrink-0">
                          <User size={13} className="text-indigo-500" />
                        </div>
                        Dashboard Saya
                      </Link>
                      <Link to="/dashboard?tab=myDonations" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-all text-sm font-bold text-slate-700 dark:text-slate-300">
                        <div className="w-7 h-7 bg-pink-50 dark:bg-pink-900/30 rounded-none flex items-center justify-center flex-shrink-0">
                          <Heart size={13} className="text-pink-500" />
                        </div>
                        Riwayat Berdonasi Saya
                      </Link>
                    </div>
                    <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => { setDropdownOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-all text-sm font-bold text-red-500 dark:text-red-400 cursor-pointer">
                        <div className="w-7 h-7 bg-red-50 dark:bg-red-900/20 rounded-none flex items-center justify-center flex-shrink-0">
                          <LogOut size={13} className="text-red-400" />
                        </div>
                        Keluar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => onOpenAuth('login')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-none font-black text-sm hover:brightness-110 transition-all cursor-pointer active:scale-[0.98]">
              Masuk
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// ============================================================
// MEDIA INPUT SECTION
// ============================================================
const MediaInputSection = ({ trigger, mediaUrl, setMediaUrl, startTime, setStartTime }) => {
  const [previewError, setPreviewError] = useState(false);
  const videoRef = useRef(null);
  const isYouTube = isYouTubeUrl(mediaUrl);

  useEffect(() => { setPreviewError(false); }, [mediaUrl]);

  const mediaType = getMediaType(mediaUrl);
  const isGif = mediaType === 'gif';
  const hasPreview = mediaUrl && !previewError;
  const allowImage = trigger.mediaType === 'image' || trigger.mediaType === 'both';
  const allowVideo = trigger.mediaType === 'video' || trigger.mediaType === 'both';

  const placeholderText =
    allowImage && allowVideo
      ? 'https://i.imgur.com/xxxx.gif atau https://youtu.be/xxxx'
      : allowVideo
        ? 'https://youtu.be/xxxx atau https://example.com/video.mp4'
        : 'https://i.imgur.com/contoh-gambar.jpg';

  const getYouTubeEmbedUrlWithTime = (url, startSeconds = 0) => {
    if (!url) return '';
    let embedUrl = getYouTubeEmbedUrl(url);
    if (startSeconds > 0) {
      const separator = embedUrl.includes('?') ? '&' : '?';
      embedUrl += `${separator}start=${startSeconds}&autoplay=1&mute=1`;
    }
    return embedUrl;
  };

  return (
    <div className="rounded-none border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/30 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-none bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
            {allowVideo && allowImage
              ? <span className="flex items-center gap-0.5"><ImageIcon size={9} /><Video size={9} /></span>
              : allowVideo ? <Video size={13} /> : <ImageIcon size={13} />}
          </div>
          <div>
            <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 leading-none">
              🎉 {trigger.label || 'Media Alert'} Unlocked!
            </p>
            <p className="text-[10px] text-indigo-400 dark:text-indigo-500 font-medium mt-0.5">
              Tersedia mulai Rp {Number(trigger.minAmount).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        {mediaUrl && (
          <button onClick={() => { setMediaUrl(''); setStartTime(0); }}
            className="w-6 h-6 rounded-none bg-indigo-100 dark:bg-indigo-900 hover:bg-red-100 dark:hover:bg-red-900 text-indigo-400 flex items-center justify-center transition-all hover:text-red-500">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Badge tipe media */}
      <div className="flex items-center gap-2">
        {allowImage && (
          <span className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 rounded-none text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            <ImageIcon size={10} /> Gambar / GIF
          </span>
        )}
        {allowVideo && (
          <span className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-purple-800 rounded-none text-[10px] font-bold text-purple-600 dark:text-purple-400">
            <Video size={10} /> Video + YouTube
          </span>
        )}
      </div>

      {/* Input URL */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1">
          Link Media (YouTube & External didukung)
        </label>
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => { setMediaUrl(e.target.value); setStartTime(0); }}
          className="w-full p-4 rounded-none bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-800 focus:border-indigo-400 outline-none font-mono text-xs text-slate-700 dark:text-white font-bold transition-all placeholder:font-sans placeholder:text-slate-400"
          placeholder={placeholderText}
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">
          * Opsional — Gambar (jpg, gif, png), Video (.mp4), atau YouTube
        </p>
      </div>

      {/* YouTube time picker */}
      <AnimatePresence>
        {isYouTube && mediaUrl && (
          <YouTubeTimePicker startTime={startTime} onChange={setStartTime} />
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {hasPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="rounded-none overflow-hidden border border-indigo-100 dark:border-indigo-800 bg-slate-900 relative"
            style={{ maxHeight: 200 }}
          >
            {
            mediaType === 'gif' ? (
              <img src={mediaUrl} alt="GIF preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
            ) :
            mediaType === 'youtube' ? (
              <iframe
                src={getYouTubeEmbedUrlWithTime(mediaUrl, startTime)}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setPreviewError(true)}
              />
            ) : mediaType === 'video' ? (
              <video ref={videoRef} src={mediaUrl} autoPlay muted loop playsInline
                className="w-full object-cover" style={{ maxHeight: 200 }}
                onError={() => setPreviewError(true)} />
            ) : (
              <img src={mediaUrl} alt="Media preview" className="w-full object-cover"
                style={{ maxHeight: 200 }} onError={() => setPreviewError(true)} />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/60 backdrop-blur-sm">
              <p className="text-[10px] text-white/90 font-bold">
                {mediaType === 'youtube' ? (
                  <>▶️ YouTube {startTime > 0 && (
                    <span className="ml-1 bg-yellow-500/30 px-1 py-0.5 text-[9px]">
                      {Math.floor(startTime / 60).toString().padStart(2, '0')}:{(startTime % 60).toString().padStart(2, '0')}
                    </span>
                  )}</>
                ) : mediaType === 'video' ? '🎬 Direct Video' : '🖼️ Gambar'}
                {' '}— Preview
              </p>
            </div>
          </motion.div>
        )}
        {previewError && mediaUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-none border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs text-red-500 font-bold flex items-center gap-2">
            <X size={14} /> URL tidak valid atau media tidak dapat dimuat.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// QUICK AUDIO SECTION
// ============================================================
const QuickAudioSection = ({ publicSounds = [], selectedSound, onSoundChange, amount }) => {
  const safePublicSounds = Array.isArray(publicSounds) ? publicSounds.slice(0, 7) : [];
  const audioRef = useRef(null);
  const [previewing, setPreviewing] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const timeoutRef = useRef(null);

  const getAudioProxyUrl = useCallback((url) => {
    if (!url) return '';
    if (
      url.includes('cloudinary.com') || url.includes('res.cloudinary.com') ||
      url.includes('/uploads/') || url.includes('railway.app') || url.includes(window.location.origin)
    ) return url;
    return `/api/overlay/proxy-audio?url=${encodeURIComponent(url)}`;
  }, []);

  const stopPreview = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setPreviewing(null);
    setPreviewError(null);
  }, []);

  const playPreview = useCallback((originalUrl) => {
    stopPreview();
    const proxyUrl = getAudioProxyUrl(originalUrl);
    if (!proxyUrl || !audioRef.current) return;
    audioRef.current.src = proxyUrl;
    audioRef.current.currentTime = 0;
    setPreviewError(null);
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => setPreviewing(originalUrl)).catch(() => setPreviewError(originalUrl));
    } else { setPreviewing(originalUrl); }
    timeoutRef.current = setTimeout(() => stopPreview(), 5000);
    audioRef.current.onended = () => stopPreview();
    audioRef.current.onerror = () => { setPreviewError(originalUrl); stopPreview(); };
  }, [getAudioProxyUrl, stopPreview]);

  useEffect(() => () => stopPreview(), [stopPreview]);

  if (safePublicSounds.length === 0 || amount === 0) return null;

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
        Pilih Suara Notif 🎵
      </label>
      <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
        <button
          onClick={() => { onSoundChange(''); stopPreview(); }}
          className={`group p-2.5 rounded-none border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-[0.99] hover:bg-slate-900 ${
            !selectedSound
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300'
          }`}
        >
          <span className="text-lg">🔇</span>
          <span className="leading-tight text-slate-900 dark:text-white text-xs">No Sound</span>
        </button>
        {safePublicSounds.map((sound, i) => {
          const isPlaying = previewing === sound.url;
          const hasError = previewError === sound.url;
          return (
            <button
              key={`${sound.url}-${i}`}
              onClick={() => { if (hasError) return; playPreview(sound.url); onSoundChange(sound.url); }}
              disabled={hasError}
              className={`group relative p-2.5 pb-3 rounded-none border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed overflow-hidden ${
                selectedSound === sound.url
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 shadow-sm'
                  : hasError
                    ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
              }`}
            >
              {isPlaying && (
                <motion.div layoutId="playing-overlay"
                  className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 to-green-500/40 backdrop-blur-sm border-2 border-emerald-400 z-10 flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <span className="text-xs font-bold text-emerald-900 drop-shadow-sm">🔊</span>
                </motion.div>
              )}
              {hasError && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-400/40 to-rose-500/40 backdrop-blur-sm border-2 border-red-400 z-10 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-900">⚠</span>
                </div>
              )}
              <span className="text-lg relative z-20">{sound.emoji || '🎵'}</span>
              <span className="leading-tight text-slate-900 dark:text-white relative z-20 truncate max-w-[80%] text-xs font-medium">
                {sound.label || `S${i + 1}`}
              </span>
            </button>
          );
        })}
      </div>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" className="hidden" />
    </div>
  );
};

// ============================================================
// TAB SELECTOR COMPONENT
// ============================================================
const DonationTabs = ({ activeTab, onTabChange, mediaTriggers, amount, minDonate }) => {
  const minMedia = mediaTriggers.length > 0
    ? Math.min(...mediaTriggers.map(t => t.minAmount))
    : null;

  const tabs = [
    {
      id: 'alert',
      label: 'Alert',
      icon: Bell,
      locked: false,
      lockMsg: null,
      desc: 'Donasi + suara notif',
    },
    {
      id: 'mediashare',
      label: 'Media Share',
      icon: Film,
      locked: minMedia === null, // locked kalau tidak ada trigger sama sekali
      lockMsg: minMedia ? `Min. Rp ${formatRp(minMedia)}` : 'Tidak tersedia',
      desc: 'Kirim video / gambar',
      warning: minMedia !== null && amount < minMedia,
      warningMsg: minMedia ? `Perlu Rp ${Number(minMedia).toLocaleString('id-ID')}` : null,
    },
    {
      id: 'voice',
      label: 'Voice',
      icon: Mic,
      locked: false,
      lockMsg: null,
      desc: 'Rekam pesan suara',
      warning: amount < minDonate,
      warningMsg: `Perlu Rp ${Number(minDonate).toLocaleString('id-ID')}`,
    },
  ];

  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
        Tipe Donasi
      </label>
      <div className="grid grid-cols-3 gap-0 border-2 border-slate-100 dark:border-slate-700 rounded-none overflow-hidden">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const isLocked = tab.locked;
          const hasWarning = tab.warning && !isActive;

          return (
            <button
              key={tab.id}
              onClick={() => !isLocked && onTabChange(tab.id)}
              disabled={isLocked}
              className={`
                relative flex flex-col items-center justify-center gap-1 py-3 px-1
                text-[10px] font-black transition-all cursor-pointer select-none
                ${idx < tabs.length - 1 ? 'border-r-2 border-slate-100 dark:border-slate-700' : ''}
                ${isLocked
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
                  : isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon size={15} className={isActive ? 'text-white' : isLocked ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'} />
              <span className={isActive ? 'text-white' : ''}>{tab.label}</span>
              {isLocked && (
                <span className="text-[8px] opacity-60 font-medium">🔒 {tab.lockMsg}</span>
              )}
              {/* Warning dot — nominal belum cukup tapi belum aktif */}
              {hasWarning && !isLocked && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const SupporterPage = () => {
  const { username } = useParams();
  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [startTime, setStartTime] = useState(0);
  const { theme, toggle: toggleTheme } = useTheme();

  // ── Tab state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('alert'); // 'alert' | 'mediashare' | 'voice'

  const [form, setForm] = useState({
    donorName: '',
    isAnonymous: false,
    email: '',
    amount: 0,
    voiceUrl: '',
    message: '',
    soundUrl: '',
  });

  const [authPayload, setAuthPayload] = useState(getPayload());
  const [authProfile, setAuthProfile] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [badges, setBadges] = useState({ streamer: {}, donor: {} });

  const isLoggedIn = !!authPayload;

  const openAuth = (tab = 'login') => { setAuthModalTab(tab); setAuthModalOpen(true); };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthPayload(null);
    setAuthProfile(null);
    setForm((prev) => ({ ...prev, donorName: '', email: '' }));
  };

  const handleAuthSuccess = async (data) => {
    const newPayload = getPayload();
    setAuthPayload(newPayload);
    if (data?.user) {
      setAuthProfile(data.user);
      setForm((prev) => ({ ...prev, donorName: data.user.username || prev.donorName, email: data.user.email || prev.email }));
    }
    if (newPayload?.id) {
      try {
        const res = await axios.get(`${BASE_URL}/api/midtrans/badges`, { headers: authHeader() });
        setBadges(res.data.badges || { streamer: {}, donor: {} });
      } catch { /* silently fail */ }
    }
  };

  // Load Midtrans Snap.js
  useEffect(() => {
    const existing = document.querySelector('script[src*="snap.js"]');
    if (existing) { setSnapReady(true); return; }
    const script = document.createElement('script');
    script.src = SNAP_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => setSnapReady(true);
    document.head.appendChild(script);
  }, []);

  // Fetch streamer
  useEffect(() => {
    if (!username) return;
    const cleanUsername = username.replace(/^@+/, '');
    axios.get(`${BASE_URL}/api/overlay/public/${cleanUsername}`)
      .then((res) => setStreamer(res.data))
      .catch(() => alert('Streamer tidak ditemukan'));
  }, [username]);

  // Fetch profil jika sudah login
  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })
      .then((r) => {
        const u = r.data?.user || r.data?.User;
        if (u) {
          setAuthProfile(u);
          setForm((prev) => ({ ...prev, donorName: u.username || prev.donorName, email: u.email || prev.email }));
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Fetch badges
  useEffect(() => {
    if (!isLoggedIn || !authPayload?.id) return;
    axios.get(`${BASE_URL}/api/midtrans/badges`, { headers: authHeader() })
      .then((res) => setBadges(res.data.badges || { streamer: {}, donor: {} }))
      .catch(() => {});
  }, [isLoggedIn, authPayload?.id]);

  const mediaTriggers = streamer?.overlaySetting?.mediaTriggers || streamer?.OverlaySetting?.mediaTriggers || [];
  const eligibleTrigger = getEligibleTrigger(mediaTriggers, form.amount);

  // Reset mediaUrl kalau trigger hilang
  useEffect(() => {
    if (!eligibleTrigger) { setMediaUrl(''); setStartTime(0); }
  }, [eligibleTrigger]);

  // ── Handle Donate ──────────────────────────────────────────
  const handleDonate = async () => {
    const overlaySetting = streamer?.overlaySetting || streamer?.OverlaySetting || {};
    const minDonate = overlaySetting?.minDonate || 1000;
    const maxDonate = overlaySetting?.maxDonate || 10000000;

    if (!form.amount || form.amount < minDonate)
      return alert(`Minimal donasi Rp ${minDonate.toLocaleString('id-ID')}`);
    if (form.amount > maxDonate)
      return alert(`Maksimal donasi Rp ${maxDonate.toLocaleString('id-ID')}`);
    if (!form.message.trim())
      return alert('Pesan dukungan tidak boleh kosong');
    if (!streamer?._id) return alert('Data streamer belum siap.');

    if (activeTab === 'mediashare') {
      const minMedia = mediaTriggers.length > 0 ? Math.min(...mediaTriggers.map(t => t.minAmount)) : null;
      if (minMedia && form.amount < minMedia)
        return alert(`Media Share butuh minimal Rp ${minMedia.toLocaleString('id-ID')}`);
      if (!mediaUrl.trim())
        return alert('Link media wajib diisi untuk Media Share');
    }

    if (activeTab === 'voice' && !form.voiceUrl?.trim())
      return alert('Rekam atau upload voice message dulu');

    try {
      setLoading(true);
      const isMediaShareTab = activeTab === 'mediashare';
      const hasMedia = (isMediaShareTab || getMediaType(mediaUrl) === 'gif') && mediaUrl.trim();
      const detectedMediaType = hasMedia ? getMediaType(mediaUrl.trim()) : null;

      if (hasMedia && eligibleTrigger) {
        if (eligibleTrigger.mediaType === 'image' && detectedMediaType !== 'image') {
          return alert('Hanya gambar yang diizinkan untuk nominal ini.');
        }
        if (eligibleTrigger.mediaType === 'video' && !['video', 'youtube'].includes(detectedMediaType)) {
          return alert('Hanya video atau YouTube yang diizinkan untuk nominal ini.');
        }
      }

      const payload = {
        amount: Math.round(Number(form.amount)),
        donorName: form.isAnonymous ? 'Anonim' : form.donorName || 'Anonim',
        message: form.message,
        userId: streamer._id,
        email: form.email.trim() || 'guest@mail.com',
        donorUserId: authPayload?.id,

        // Media Logic Baru
        mediaUrl: hasMedia ? mediaUrl.trim() : null,
        mediaType: detectedMediaType,
        isMediaShare: isMediaShareTab && detectedMediaType !== 'gif', // GIF bukan Media Share
        startTime: hasMedia && isYouTubeUrl(mediaUrl) ? startTime : 0,

        soundUrl: activeTab === 'alert' ? (form.soundUrl || null) : null,
        voiceUrl: activeTab === 'voice' ? (form.voiceUrl || null) : null,
      };

      const res = await axios.post(`${BASE_URL}/api/midtrans/create-invoice`, payload);

      if (res.data.token && snapReady && window.snap) {
        window.snap.pay(res.data.token, {
          onSuccess: () => (window.location.href = `/donation/success?username=${streamer.username}`),
          onPending: () => (window.location.href = `/donation/pending?username=${streamer.username}`),
          onError:   () => alert('Pembayaran gagal.'),
          onClose:   () => {},
        });
      } else {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat invoice.');
    } finally {
      setLoading(false);
    }
  };

  if (!streamer) {
    return (
      <>
        <SupporterNavbar onOpenAuth={openAuth} authPayload={authPayload} profile={authProfile} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
        <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 bg-blue-50 dark:bg-slate-900 pt-16">
          <Loader2 className="animate-spin mr-2" size={24} /> Memuat Profil...
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  const overlaySetting = streamer?.overlaySetting || streamer?.OverlaySetting || {};
  const minDonate  = overlaySetting?.minDonate  || 1000;
  const maxDonate  = overlaySetting?.maxDonate  || 10000000;

  const quickAmounts = (
    streamer?.overlaySetting?.quickAmounts ||
    streamer?.OverlaySetting?.quickAmounts ||
    [10000, 25000, 50000, 100000]
  ).filter((v) => v >= minDonate && v <= maxDonate);

  const sortedTriggers = [...mediaTriggers].sort((a, b) => a.minAmount - b.minAmount);

  const publicSounds = Array.isArray(streamer?.overlaySetting?.publicSounds)
    ? streamer.overlaySetting.publicSounds
    : Array.isArray(streamer?.publicSounds) ? streamer.publicSounds : [];

  const minMedia = mediaTriggers.length > 0
    ? Math.min(...mediaTriggers.map(t => t.minAmount))
    : null;

  // ── Validasi tombol submit ─────────────────────────────────
  const isSubmitDisabled = (() => {
    if (loading) return true;
    if (!form.amount || form.amount < minDonate) return true;
    if (!form.message.trim()) return true;

    if (activeTab === 'mediashare') {
      // nominal harus cukup trigger
      if (!eligibleTrigger) return true;
      // link media wajib diisi
      if (!mediaUrl.trim()) return true;
    }

    if (activeTab === 'voice') {
      // voice url wajib ada (sudah direkam/upload)
      if (!form.voiceUrl?.trim()) return true;
    }

    return false;
  })();

  // ── Hint teks kenapa tombol disabled ──────────────────────
  const submitHint = (() => {
    if (!form.amount || form.amount < minDonate)
      return `Masukkan nominal min. Rp ${Number(minDonate).toLocaleString('id-ID')}`;
    if (!form.message.trim())
      return 'Pesan dukungan tidak boleh kosong';
    if (activeTab === 'mediashare') {
      if (!eligibleTrigger)
        return `Nominal min. Rp ${Number(minMedia).toLocaleString('id-ID')} untuk Media Share`;
      if (!mediaUrl.trim())
        return 'Link media wajib diisi untuk Media Share';
    }
    if (activeTab === 'voice' && !form.voiceUrl?.trim())
      return 'Rekam atau upload voice message dulu';
    return null;
  })();

  return (
    <>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} onAuthSuccess={handleAuthSuccess} />
      <SupporterNavbar onOpenAuth={openAuth} authPayload={authPayload} profile={authProfile} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex justify-center items-start md:items-center p-4 md:p-6 font-sans pt-20 md:pt-24">
        <div className="w-full max-w-xl space-y-5 py-4 md:py-0">

          {/* ── Header Card ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 px-8 pt-8 pb-6 rounded-none shadow-xl shadow-indigo-100/50 dark:shadow-slate-800/50 text-center border border-indigo-100 dark:border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500" />
            <div className="w-20 h-20 mt-2 mx-auto rounded-none overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-5xl font-black shadow-lg mb-4 border-4 border-white dark:border-slate-900">
              {streamer?.profilePicture ? (
                <img src={streamer.profilePicture} alt={streamer.username} className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = streamer.username?.charAt(0).toUpperCase() || '?'; }} />
              ) : (streamer.username?.charAt(0).toUpperCase() || '?')}
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">@{streamer.username}</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{streamer.donateIntro || 'Support aku biar makin semangat 🚀'}</p>

            {isLoggedIn ? (
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-none text-[10px] font-black text-green-700 dark:text-green-400">
                ✓ Donasi akan tercatat di riwayat akun kamu
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Punya akun?</span>
                <button onClick={() => openAuth('login')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Masuk dulu
                </button>
              </div>
            )}

            {isLoggedIn && (
              <div className="w-max flex flex-wrap gap-1.5 justify-center h-max mx-auto text-center mt-6">
                {badges.streamer?.['10k'] && <Badge type="streamer" name="10k" active />}
                {badges.streamer?.['50k'] && <Badge type="streamer" name="50k" active />}
                {badges.streamer?.['100k'] && <Badge type="streamer" name="100k" active />}
                {badges.streamer?.['500k'] && <Badge type="streamer" name="500k" active />}
                {badges.streamer?.['1jt'] && <Badge type="streamer" name="1jt" active />}
                {badges.donor?.['1x'] && <Badge type="donor" name="1x" active />}
                {badges.donor?.['5x'] && <Badge type="donor" name="5x" active />}
                {badges.donor?.['10k'] && <Badge type="donor" name="10k" active />}
                {badges.donor?.['50k'] && <Badge type="donor" name="50k" active />}
              </div>
            )}
          </motion.div>

          {/* ── Form Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-7 rounded-none shadow-xl shadow-indigo-100/50 dark:shadow-slate-800/50 border border-indigo-100 dark:border-slate-800 space-y-5"
          >

            {/* Quick Amounts */}
            {quickAmounts.length > 0 && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  Pilih Nominal Cepat
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      onClick={() => setForm({ ...form, amount: val })}
                      className={`cursor-pointer py-4 rounded-none font-black text-sm transition-all border-2 active:scale-[0.99] ${
                        form.amount === val
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Rp {val.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Amount */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Nominal Kustom
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 dark:text-indigo-400 text-sm">Rp</span>
                <input
                  type="number"
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full p-4 pl-12 rounded-none font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                  placeholder="Nominal Kustom..."
                />
              </div>

              {/* Trigger hints */}
              {sortedTriggers.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {sortedTriggers.map((t, i) => {
                    const reached = form.amount >= t.minAmount;
                    const isNext = !reached && (i === 0 || form.amount >= sortedTriggers[i - 1]?.minAmount);
                    if (!reached && !isNext) return null;
                    return (
                      <div key={i} className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded-none ${
                        reached ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500'
                      }`}>
                        <span>{reached ? '✅' : '🔒'}</span>
                        <span>
                          {reached
                            ? <>{t.label || 'Media Alert'} unlocked!</>
                            : <>Donasi Rp {Number(t.minAmount).toLocaleString('id-ID')} untuk unlock {t.label}</>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Pesan Dukungan
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-4 rounded-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 min-h-[90px] outline-none transition-all resize-none text-slate-700 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Semangat terus bang! 🔥"
              />
            </div>

            {/* ═══════════════════════════════════════════════
                TAB SELECTOR
            ════════════════════════════════════════════════ */}
            <DonationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              mediaTriggers={mediaTriggers}
              amount={form.amount}
              minDonate={minDonate}
            />

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">

              {/* ── TAB: ALERT ── */}
              {activeTab === 'alert' && (
                <motion.div
                  key="tab-alert"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {publicSounds.length > 0 && form.amount >= minDonate ? (
                    <QuickAudioSection
                      publicSounds={publicSounds}
                      selectedSound={form.soundUrl}
                      onSoundChange={(url) => setForm({ ...form, soundUrl: url })}
                      amount={form.amount}
                    />
                  ) : form.amount > 0 && form.amount < minDonate ? (
                    <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-none">
                      <Bell size={18} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400">Donasi Alert Biasa</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          Masukkan nominal min. Rp {Number(minDonate).toLocaleString('id-ID')} untuk aktifkan pilihan suara
                        </p>
                      </div>
                    </div>
                  ) : publicSounds.length === 0 ? (
                    <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-none">
                      <Bell size={18} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400">Donasi Alert Biasa</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          Notifikasi donasi akan muncul di OBS streamer
                        </p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* ── TAB: MEDIA SHARE ── */}
              {activeTab === 'mediashare' && (
                <motion.div
                  key="tab-mediashare"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {mediaTriggers.length === 0 ? (
                    <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-none">
                      <Film size={18} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400">Media Share Tidak Tersedia</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          Streamer belum mengaktifkan fitur Media Share
                        </p>
                      </div>
                    </div>
                  ) : !eligibleTrigger ? (
                    // Nominal belum cukup — warning
                    <div className="flex items-center gap-3 px-4 py-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-none">
                      <span className="text-2xl flex-shrink-0">🔒</span>
                      <div>
                        <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                          Nominal belum cukup untuk Media Share
                        </p>
                        <p className="text-[10px] text-amber-500 dark:text-amber-500 font-medium mt-0.5">
                          Donasi minimal Rp {Number(minMedia).toLocaleString('id-ID')} untuk mengirim media
                        </p>
                        <button
                          onClick={() => setForm({ ...form, amount: minMedia })}
                          className="mt-2 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-none hover:bg-amber-600 transition-all cursor-pointer"
                        >
                          Set Rp {Number(minMedia).toLocaleString('id-ID')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Eligible — tampilkan media input
                    <MediaInputSection
                      trigger={eligibleTrigger}
                      mediaUrl={mediaUrl}
                      setMediaUrl={setMediaUrl}
                      startTime={startTime}
                      setStartTime={setStartTime}
                    />
                  )}
                </motion.div>
              )}

              {/* ── TAB: VOICE ── */}
              {activeTab === 'voice' && (
                <motion.div
                  key="tab-voice"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {form.amount < minDonate ? (
                    // Nominal belum cukup — warning
                    <div className="flex items-center gap-3 px-4 py-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-none">
                      <span className="text-2xl flex-shrink-0">🔒</span>
                      <div>
                        <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                          Voice Message belum aktif
                        </p>
                        <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                          Masukkan nominal minimal Rp {Number(minDonate).toLocaleString('id-ID')} untuk merekam suara
                        </p>
                        <button
                          onClick={() => setForm({ ...form, amount: minDonate })}
                          className="mt-2 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-none hover:bg-amber-600 transition-all cursor-pointer"
                        >
                          Set Rp {Number(minDonate).toLocaleString('id-ID')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-none">
                        <Mic size={13} className="text-violet-500 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                          Rekam pesan suaramu — max 60 detik
                        </p>
                      </div>
                      <VoiceRecorder
                        onVoiceReady={(url) => setForm(f => ({ ...f, voiceUrl: url || '' }))}
                        maxSeconds={60}
                        disabled={false}
                      />
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* ── Nama & Email ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Nama</label>
                <input
                  type="text"
                  disabled={form.isAnonymous || isLoggedIn}
                  value={form.isAnonymous ? '' : form.donorName}
                  onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                  className="w-full p-4 rounded-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 disabled:opacity-40 outline-none transition-all text-slate-700 dark:text-white"
                  placeholder="Nama kamu"
                />
                {isLoggedIn && !form.isAnonymous && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 ml-1">Dari akun kamu</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email (opsional)</label>
                <input
                  type="email"
                  disabled={isLoggedIn}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-4 rounded-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 disabled:opacity-40 outline-none transition-all text-slate-700 dark:text-white"
                  placeholder="email@kamu.com"
                />
              </div>
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <div
                onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
                className={`w-10 h-6 rounded-none relative flex-shrink-0 transition-all cursor-pointer ${form.isAnonymous ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-none shadow transition-all ${form.isAnonymous ? 'left-5' : 'left-1'}`} />
              </div>
              Donasi sebagai anonim
            </label>

            {/* Login prompt */}
            <AnimatePresence>
              {!isLoggedIn && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-none">
                    <div>
                      <p className="text-xs font-black text-indigo-700 dark:text-indigo-400">Donasi kamu tidak akan tercatat</p>
                      <p className="text-[10px] text-indigo-400 dark:text-indigo-500 font-medium mt-0.5">Masuk atau daftar agar donasi muncul di riwayat akun</p>
                    </div>
                    <button
                      onClick={() => openAuth('login')}
                      className="ml-3 flex-shrink-0 px-3 py-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-none hover:bg-indigo-50 transition-all cursor-pointer"
                    >
                      Masuk
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Submit hint */}
            <AnimatePresence>
              {isSubmitDisabled && !loading && submitHint && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-none"
                >
                  <span className="text-slate-300 dark:text-slate-600 flex-shrink-0">⚠️</span>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{submitHint}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileTap={!isSubmitDisabled ? { scale: 0.99 } : {}}
              onClick={handleDonate}
              disabled={isSubmitDisabled}
              className={`w-full py-3 rounded-none font-black text-lg flex items-center justify-center gap-2 transition-all ${
                isSubmitDisabled
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'cursor-pointer bg-gradient-to-r from-blue-700 to-blue-700 text-white hover:brightness-110'
              }`}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <>
                  {activeTab === 'alert' && '🔔'}
                  {activeTab === 'mediashare' && '🎬'}
                  {activeTab === 'voice' && '🎙️'}
                  {' '}Kirim Donasi
                  {form.amount > 0 ? ` Rp ${Number(form.amount).toLocaleString('id-ID')}` : ''}
                </>
              )}
            </motion.button>

          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SupporterPage;