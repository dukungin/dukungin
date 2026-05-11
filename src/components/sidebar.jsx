import { 
  History, 
  Layout, 
  LogOut, 
  ShieldAlert, 
  User, 
  Wallet, 
  X,
  AlertCircle, 
  Users,
  Vote,
  Timer,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const payload = getTokenPayload();
  const isSuperAdmin = payload?.role === 'superAdmin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); 
  };

  const menuItems = [
    { id: 'settings', label: 'Overlay Editor', icon: <Layout size={20} /> },
    { id: 'community', label: 'Community', icon: <Users size={20} /> },
    // { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    { id: 'history', label: 'Donation History', icon: <History size={20} /> },
    { id: 'wallet', label: 'Withdrawal', icon: <Wallet size={20} /> },
    { id: 'poll',     icon: <Vote size={20} />,    label: 'Poll & Voting' },
    { id: 'subathon', icon: <Timer size={20} />,   label: 'Subathon' },
    { id: 'leaderboard', icon: <Trophy size={20} />, label: 'Leaderboard' }
  ];

  return (
    <>
      {/* MODAL LOGOUT MODERN */}
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
              className="relative w-full max-w-md bg-white rounded-xl p-10 z-[9999] md:z-[3] shadow-2xl text-center overflow-hidden"
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

      {/* SIDEBAR ASIDE */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen overflow-y-auto w-full md:w-70 bg-white border-r border-slate-100 py-4 px-6 z-[99999] md:z-[1] flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* LOGO AREA */}
        <div className="flex items-center justify-between mb-13">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-200 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-indigo-100">
              <img src="/jellyfish.png" alt="icon" className='w-[60%]' />
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-800">SAWER.IN</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="relative left-3.5 w-max cursor-pointer active:scale-[0.95] hover:text-red-600 lg:hidden p-2 text-red-500">
            <X size={30} />
          </button>
        </div>

        <div className="pt-0 pb-2 px-1 mb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">All Streamer</p>
        </div>
        {/* NAVIGATION */}
        <nav className="flex-1 space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`cursor-pointer w-full flex items-center gap-4 px-4 p-3 rounded-2xl font-black transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-indigo-100' 
                  : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}

          <div className='w-full h-[1px] my-5 bg-slate-300'></div>
          {isSuperAdmin && (
            <>
              {/* <div className="pt-6 pb-2 px-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Super Admin</p>
              </div> */}
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsSidebarOpen(false);
                }}
                className={`cursor-pointer w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'text-slate-400 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert size={20} />
                <span className="text-sm">Req. withdrawals</span>
              </button>
            </>
          )}
        </nav>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={() => setShowLogoutConfirm(true)} // Pemicu modal
          className="md:hidden flex items-center gap-4 p-4 bg-red-100 text-red-500 hover:bg-red-50 rounded-2xl cursor-pointer active:scale-[0.98] font-black mt-auto transition-all"
        >
          <LogOut size={18} /> 
          <p className='text-sm ml-[3px]'>
            Keluar
          </p>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;