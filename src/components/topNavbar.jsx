import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronRight, HeadphonesIcon, LogOut, Users, Wallet } from "lucide-react";
import { useState } from "react";
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
  contact: 'Bantuan & Kontak',
  admin:       'Permintaan Penarikan',
};

export const TopNavbar = ({ user, onLogout, onProfile, activeTab, setActiveTab }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <div className="sticky top-0 z-[3] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">

        {/* Kiri: Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-md font-medium text-slate-400 whitespace-nowrap">Dashboard</span>
          <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
          <span className="text-md font-medium text-slate-700 truncate">
            {TAB_LABELS[activeTab] || activeTab}
          </span>
        </div>

        {/* Kanan: Saldo + Komunitas + Avatar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">

          {/* Saldo */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-2 border border-slate-200/80"
            style={{
              background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
            }}>
            <Wallet size={18} className="text-indigo-400" />
            <span className="font-medium text-indigo-600 text-md tracking-wide">
              Rp {parseFloat(user.balance).toLocaleString('id-ID')}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('contact')}
            className={`cursor-pointer h-[40px] active:scale-[0.97] flex items-center gap-2 px-3.5 rounded-xl border border-slate-200 font-medium text-md transition-all ${
              activeTab === 'contact'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            <HeadphonesIcon size={14} />
            <span className="hidden md:inline">Bantuan</span>
          </button>

          {/* Komunitas */}
          <button
            onClick={() => setActiveTab('community')}
            className="cursor-pointer hover:brightness-90 h-[38px] active:scale-[0.97] relative flex items-center gap-2 px-3.5 py-3 rounded-xl font-medium text-md overflow-hidden"
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
              className="cursor-pointer h-[38px] flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-2.5 py-3 transition-all active:scale-[0.97]"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-medium text-md flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-medium text-slate-800 text-[14px] leading-tight">@{user.username}</p>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">{user.email}</p>
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
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20"
                  >
                    {/* Saldo mobile */}
                    <div className="sm:hidden px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                      <Wallet size={13} className="text-indigo-400" />
                      <span className="font-medium text-indigo-600 text-sm">
                        Rp {parseFloat(user.balance).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="p-1 space-y-1">
                      <button
                        onClick={onProfile}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-100 font-medium rounded-xl text-sm transition-all active:scale-[0.97]"
                      >
                        <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white font-medium text-[10px]">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        My Profile
                      </button>
                      <div className="w-[92%] mx-auto h-[0.5px] bg-slate-100" />
                      <button
                        onClick={() => { setShowLogout(false); setShowLogoutConfirm(true); }}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 font-medium rounded-xl text-sm transition-all active:scale-[0.97]"
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 z-[9999] shadow-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-medium text-slate-800 mb-2">Konfirmasi Keluar</h3>
              <p className="text-slate-500 font-medium mb-8">Apakah kamu yakin ingin mengakhiri sesi ini?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="cursor-pointer active:scale-[0.97] w-full py-4 bg-red-600 text-white rounded-2xl font-medium text-md shadow-xl shadow-red-200 hover:bg-red-700 transition-all"
                >
                  Ya, Logout
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="cursor-pointer active:scale-[0.97] w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-medium text-md hover:bg-slate-200 transition-all"
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