import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const TopNavbar = ({ user, onLogout, onProfile }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); 
  };

  return (
    <>
      <div className="sticky top-0 z-[3] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        {/* Kanan: Saldo + Avatar */}
        <div className="w-full justify-between flex items-center gap-3">
          {/* Saldo */}
          <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
            <Wallet size={16} className="text-indigo-500" />
            <span className="font-black text-indigo-700 text-sm">
              Rp {parseFloat(user.balance).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLogout(v => !v)}
              className="cursor-pointer flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl px-3 py-2 transition-all active:scale-[0.97]"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-black text-slate-800 text-xs leading-tight">@{user.username}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{user.email}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 ml-1">
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
                    {/* Saldo (mobile) */}
                    <div className="sm:hidden px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                      <Wallet size={14} className="text-indigo-500" />
                      <span className="font-black text-indigo-700 text-sm">
                        Rp {parseFloat(user.balance).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="p-1 space-y-1">
                      <button
                        onClick={() => setShowLogoutConfirm(true)} 
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-100 font-medium rounded-xl text-sm transition-all active:scale-[0.97]"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                      <div className="w-[92%] mx-auto h-[1px] bg-slate-200"></div>
                      <button
                        onClick={onProfile} 
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-slate-900 hover:bg-slate-100 font-medium rounded-xl text-sm transition-all active:scale-[0.97]"
                      >
                        <LogOut size={16} />
                        My Profile
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6">
            {/* Backdrop Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 z-[9999] md:z-[3] shadow-2xl text-center overflow-hidden"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={40} />
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">Konfirmasi Keluar</h3>
              <p className="text-slate-500 font-medium mb-8">
                Apakah kamu yakin ingin mengakhiri sesi ini?
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout}
                  className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all"
                >
                  Ya, Logout
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 active:scale-[0.98] transition-all"
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