import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronRight, Eye, EyeOff, HeadphonesIcon, LogOut, Moon, Sun, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TAB_LABELS = {
  settings:    'Editor Overlay',
  history:     'Riwayat Donasi',
  wallet:      'Penarikan Dana',
  poll:        'Poll & Voting',
  subathon:    'Subathon',
  leaderboard: 'Leaderboard',
  milestones:  'Milestones',
  community:   'Komunitas',
  contact:     'Bantuan & Kontak',
  admin:       'Permintaan Penarikan',
};

// ─── Theme hook ───────────────────────────────────────────────────────────────

const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sawer-theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sawer-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return { theme, toggle };
};

// ─── ThemeToggle button ───────────────────────────────────────────────────────

const ThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="cursor-pointer relative h-[38px] w-[70px] rounded-none border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center px-1 transition-all active:scale-[0.97] hover:brightness-95 overflow-hidden"
    >
      {/* Track */}
      <motion.div
        className="absolute inset-0 rounded-none"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Stars (dark mode) */}
      {isDark && (
        <>
          <span className="absolute top-1.5 right-3 w-0.5 h-0.5 bg-white rounded-none opacity-80" />
          <span className="absolute top-3 right-5 w-1 h-1 bg-white rounded-none opacity-60" />
          <span className="absolute bottom-2 right-2 w-0.5 h-0.5 bg-white rounded-none opacity-70" />
        </>
      )}

      {/* Sun rays (light mode) */}
      {!isDark && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30">
          <svg viewBox="0 0 16 16" fill="#f59e0b">
            <circle cx="8" cy="8" r="4" />
          </svg>
        </span>
      )}

      {/* Thumb */}
      <motion.div
        className="relative z-10 w-7 h-7 rounded-none shadow-sm flex items-center justify-center"
        animate={{ x: isDark ? 30 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          background: isDark ? '#1e1b4b' : '#ffffff',
          border: isDark ? '1px solid #4338ca' : '1px solid #e2e8f0',
        }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={13} className="text-indigo-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -30, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={13} className="text-amber-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};

// ─── TopNavbar ─────────────────────────────────────────────────────────────────

export const TopNavbar = ({ user, onLogout, onProfile, activeTab, setActiveTab, navbar }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(() => {
    const saved = localStorage.getItem('showBalance');
    // LocalStorage menyimpan string, jadi kita bandingkan dengan 'true'
    return saved === 'true'; 
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // 2. Gunakan useEffect untuk mensinkronisasi state ke localStorage jika diperlukan
  useEffect(() => {
    localStorage.setItem('showBalance', showBalance);
  }, [showBalance]);

  const handleShowBalance = () => {
    setShowBalance(prev => !prev); // Toggle state
  };

  return (
    <>
      <div className={`hidden md:flex sticky top-0 ${navbar ? 'z-[1]' : 'z-[3]'} w-full bg-white dark:bg-transparent backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-4`}>

        {/* Kiri: Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-md font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">Dashboard</span>
          <ChevronRight size={16} className="text-slate-400 dark:text-slate-600 flex-shrink-0" />
          <span className="text-md font-bold text-slate-700 dark:text-slate-200 truncate">
            {TAB_LABELS[activeTab] || activeTab}
          </span>
        </div>

        {/* Kanan */}
        <div className="flex items-center gap-2.5 flex-shrink-0">

          {/* Saldo */}
          <div className="hidden sm:flex items-center h-[40px] gap-2 rounded-none px-3.5 py-2 border border-slate-200/80 dark:border-slate-700 dark:bg-slate-800/60">
            <Wallet size={18} className="text-indigo-400" />
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-md tracking-wide">
              {showBalance 
                ? `Rp ${parseFloat(user.balance).toLocaleString('id-ID')}` 
                : "Rp *********"
              }
            </span>
             <button onClick={() => handleShowBalance()} className="cursor-pointer p-2 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Theme toggle */}
          <ThemeToggle theme={theme} onToggle={toggle} />

          {/* Bantuan */}
          <button
            onClick={() => setActiveTab('contact')}
            className={`cursor-pointer h-[40px] active:scale-[0.97] flex items-center gap-2 px-3.5 rounded-none border font-bold text-md transition-all ${
              activeTab === 'contact'
                ? 'bg-slate-800 dark:bg-slate-700 text-white border-transparent'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            <HeadphonesIcon size={14} />
            <span className="hidden md:inline">Bantuan</span>
          </button>

          {/* Komunitas */}
          <button
            onClick={() => setActiveTab('community')}
            className="cursor-pointer hover:brightness-90 h-[38px] active:scale-[0.97] relative flex items-center gap-2 px-3.5 py-3 rounded-none font-bold text-md overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #0f0c29, #302b63, #24243e, #0f0c29)',
              backgroundSize: '300% 100%',
              animation: 'rainbowSlide 3s ease-in-out infinite',
              boxShadow: '0 0 12px 1px rgba(48,43,99,0.4)',
            }}>
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(118deg, transparent 95%, rgba(255,255,255,0.1) 90%, transparent 85%)',
                backgroundSize: '250% 100%',
                animation: 'shimmerSlide 3s ease-in-out infinite',
              }}
            />
            <Users size={16} className="relative z-10 text-white/90" />
            <span className="hidden md:inline relative z-10 text-white/90 tracking-wide">Komunitas</span>
          </button>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLogout(v => !v)}
              className="cursor-pointer h-[38.4px] flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none px-1.5 py-3 transition-all active:scale-[0.97]"
            >
              <div className="w-8 h-8 rounded-none bg-indigo-600 flex items-center justify-center text-white font-bold text-md flex-shrink-0">
                {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = user.username?.charAt(0).toUpperCase() || '?';
                  }}
                />
              ) : (
                user.username?.charAt(0).toUpperCase() || '?'
              )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-md leading-tight">@{user.username}</p>
                {/* <p className="text-[11px] text-slate-400 font-bold truncate max-w-[120px]">{user.email}</p> */}
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 ml-0.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {showLogout && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLogout(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-none shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-20"
                  >
                    {/* Saldo mobile */}
                    <div className="sm:hidden px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
                      <Wallet size={13} className="text-indigo-400" />
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        Rp {parseFloat(user.balance).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Theme toggle in dropdown (mobile-friendly label) */}
                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                        {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                      </span>
                      <ThemeToggle theme={theme} onToggle={toggle} />
                    </div>

                    <div className="p-1 space-y-1">
                      <button
                        onClick={onProfile}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-none text-sm transition-all active:scale-[0.97]"
                      >
                        <div className="w-5 h-5 rounded-none bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        My Profile
                      </button>
                      <div className="w-[92%] mx-auto h-[0.5px] bg-slate-100 dark:bg-slate-800" />
                      <button
                        onClick={() => { setShowLogout(false); setShowLogoutConfirm(true); }}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold rounded-none text-sm transition-all active:scale-[0.97]"
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Logout */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-none p-10 z-[9999] shadow-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-none flex items-center justify-center">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Konfirmasi Keluar</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Apakah kamu yakin ingin mengakhiri sesi ini?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="cursor-pointer active:scale-[0.97] w-full py-4 bg-red-600 text-white rounded-none font-bold text-md shadow-xl shadow-red-200 dark:shadow-red-900/20 hover:bg-red-700 transition-all"
                >
                  Ya, Keluar
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="cursor-pointer active:scale-[0.97] w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-none font-bold text-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};