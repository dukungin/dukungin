import {
    History,
    Layout,
    LogOut,
    User,
    Wallet,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Hapus token dari localStorage
    localStorage.removeItem('token');
    // 2. (Opsional) Hapus data user lainnya jika ada
    // localStorage.clear(); 
    
    // 3. Arahkan ke halaman login
    alert("Berhasil logout!");
    navigate('/login'); 
  };

  const menuItems = [
    { id: 'settings', label: 'Overlay Editor', icon: <Layout size={20} /> },
    { id: 'history', label: 'Donation History', icon: <History size={20} /> },
    { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    { id: 'wallet', label: 'Withdrawal', icon: <Wallet size={20} /> },
  ];

  return (
    <aside className={`
      fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-100 p-8 flex flex-col z-[60] transition-transform duration-300
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* LOGO AREA */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-indigo-100">
            D
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-800">DUKUNG.In</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="lg:hidden p-2 text-slate-400"
        >
          <X />
        </button>
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
            className={`cursor-pointer w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                : 'text-slate-400 hover:bg-slate-200'
            }`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* LOGOUT BUTTON */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 rounded-2xl cursor-pointer active:scale-[0.98] font-black mt-auto transition-all"
      >
        <LogOut size={20} /> Logout
      </button>
    </aside>
  );
};

export default Sidebar;