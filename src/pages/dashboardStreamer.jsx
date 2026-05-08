// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';
// import { AnimatePresence, motion } from 'framer-motion';
// import {
//   ArrowRight,
//   Camera,
//   CheckCircle2,
//   Copy,
//   CreditCard,
//   Menu,
//   RefreshCw,
//   Save,
//   Settings,
//   ShieldCheck,
//   Smartphone,
//   User,
//   Wallet
// } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { io } from 'socket.io-client';
// import Sidebar from '../components/sidebar';

// const BASE_URL = 'https://server-dukungin-production.up.railway.app';

// const authHeader = () => ({
//   Authorization: `Bearer ${localStorage.getItem('token')}`
// });

// // ─── API Functions ────────────────────────────────────────────────────────────

// const fetchProfile = async () => {
//   const res = await axios.get(`${BASE_URL}/api/overlay/settings`, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// const fetchHistory = async () => {
//   const res = await axios.get(`${BASE_URL}/api/donations/history`, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// const saveSettings = async (settings) => {
//   const res = await axios.put(`${BASE_URL}/api/overlay/settings`, settings, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// const updateProfile = async (profileData) => {
//   const res = await axios.put(`${BASE_URL}/api/auth/profile`, profileData, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// const changePassword = async (passwordData) => {
//   const res = await axios.put(`${BASE_URL}/api/auth/change-password`, passwordData, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// const postWithdraw = async (withdrawData) => {
//   const res = await axios.post(`${BASE_URL}/api/midtrans/withdraw`, withdrawData, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// // Tambah di API functions
// const fetchAdminWithdrawals = async () => {
//   const res = await axios.get(`${BASE_URL}/api/midtrans/admin/withdrawals`, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// const updateWithdrawalStatus = async ({ id, status }) => {
//   const res = await axios.put(`${BASE_URL}/api/midtrans/admin/withdrawals/${id}`, { status }, {
//     headers: authHeader()
//   });
//   return res.data;
// };

// // ─── WithdrawPage ─────────────────────────────────────────────────────────────

// const WithdrawPage = () => {
//   const queryClient = useQueryClient();
//   const [method, setMethod] = useState('BANK');
//   const [formData, setFormData] = useState({
//     amount: '',
//     channelCode: 'BCA',
//     accountNumber: '',
//     accountName: ''
//   });

//   // Ambil saldo dari cache profile (sudah di-fetch di parent)
//   const { data: profileData } = useQuery({
//     queryKey: ['profile'],
//     queryFn: fetchProfile,
//     refetchInterval: 30000 // refresh tiap 30 detik
//   });

//   const balance = profileData?.User?.walletBalance || profileData?.walletBalance || 0;

//   const withdrawMutation = useMutation({
//     mutationFn: postWithdraw,
//     onSuccess: () => {
//       // Invalidate profile agar saldo ter-refresh otomatis
//       queryClient.invalidateQueries({ queryKey: ['profile'] });
//       alert('Permintaan penarikan berhasil dikirim!');
//       setFormData({ amount: '', channelCode: method === 'BANK' ? 'BCA' : method, accountNumber: '', accountName: '' });
//     },
//     onError: (err) => {
//       alert(err.response?.data?.message || 'Terjadi kesalahan');
//     }
//   });

//   const handleWithdraw = () => {
//     if (parseFloat(formData.amount) > parseFloat(balance)) {
//       return alert('Saldo tidak mencukupi!');
//     }
//     if (parseFloat(formData.amount) < 10000) {
//       return alert('Minimal penarikan adalah Rp 10.000');
//     }
//     withdrawMutation.mutate({ ...formData, paymentMethod: method });
//   };

//   return (
//     <div className="w-full mx-auto space-y-6">
//       <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
//         <div className="absolute top-0 right-0 p-12 opacity-10">
//           <Wallet size={120} />
//         </div>
//         <div className="relative z-10">
//           <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
//           <h1 className="text-3xl font-black italic">
//             Rp {parseFloat(balance).toLocaleString('id-ID')}
//           </h1>
//         </div>
//       </div>

//       <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
//         <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
//           <CreditCard className="text-indigo-600" /> Konfigurasi Pencairan
//         </h2>

//         <div className="grid grid-cols-3 gap-4 mb-10">
//           {[
//             { id: 'BANK', label: 'Transfer Bank', icon: <CreditCard size={18} /> },
//             { id: 'DANA', label: 'E-Wallet DANA', icon: <Smartphone size={18} /> },
//             { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18} /> }
//           ].map(m => (
//             <button
//               key={m.id}
//               onClick={() => {
//                 setMethod(m.id);
//                 setFormData({ ...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id });
//               }}
//               className={`cursor-pointer active:scale-[0.97] hover:bg-blue-50 flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all font-black text-sm ${method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
//             >
//               {m.icon} {m.label}
//             </button>
//           ))}
//         </div>

//         <div className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {method === 'BANK' && (
//               <div className="flex flex-col gap-3">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bank</label>
//                 <select
//                   className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
//                   onChange={(e) => setFormData({ ...formData, channelCode: e.target.value })}
//                 >
//                   <option value="BCA">BCA (Bank Central Asia)</option>
//                   <option value="BNI">BNI (Bank Negara Indonesia)</option>
//                   <option value="MANDIRI">Mandiri</option>
//                   <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
//                 </select>
//               </div>
//             )}

//             <div className="flex flex-col gap-3">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
//                 {method === 'BANK' ? 'Nomor Rekening' : 'Nomor Handphone'}
//               </label>
//               <input
//                 value={formData.accountNumber}
//                 placeholder={method === 'BANK' ? '000-000-000' : '0812xxxx'}
//                 className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
//                 onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="flex flex-col gap-3">
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Pemilik Akun</label>
//             <input
//               value={formData.accountName}
//               placeholder="Sesuaikan dengan Buku Tabungan / Nama di App"
//               className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
//               onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
//             />
//           </div>

//           <div className="flex flex-col gap-3 pt-4">
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal yang Ingin Ditarik (IDR)</label>
//             <div className="relative">
//               <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-white">Rp</span>
//               <input
//                 type="number"
//                 value={formData.amount}
//                 placeholder="Contoh: 100000"
//                 className="w-full p-6 pl-14 bg-slate-900 text-white rounded-3xl font-black text-xl outline-none focus:ring-4 ring-indigo-100 transition-all"
//                 onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//               />
//             </div>
//             <p className="text-[10px] text-slate-400 font-bold ml-1 italic">*Biaya admin penarikan Rp 5.000 akan memotong saldo utama.</p>
//           </div>

//           <button
//             onClick={handleWithdraw}
//             disabled={withdrawMutation.isPending}
//             className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-4 disabled:opacity-70"
//           >
//             {withdrawMutation.isPending
//               ? <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Sedang Memproses...</>
//               : <><ArrowRight size={20} /> Ajukan Pencairan Dana</>
//             }
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Komponen halaman admin — taruh di bawah WithdrawPage
// const AdminWithdrawalPage = () => {
//   const queryClient = useQueryClient();

//   const { data: withdrawals = [], isLoading } = useQuery({
//     queryKey: ['adminWithdrawals'],
//     queryFn: fetchAdminWithdrawals,
//     refetchInterval: 30000,
//   });

//   const updateMutation = useMutation({
//     mutationFn: updateWithdrawalStatus,
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }),
//     onError: (err) => alert(err.response?.data?.message || 'Gagal update status'),
//   });

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
//         <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100">
//           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Semua Request Penarikan</p>
//           <span className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
//             Super Admin Only
//           </span>
//         </div>

//         {isLoading ? (
//           <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3">
//             <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
//             Memuat data...
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left min-w-[900px]">
//               <thead>
//                 <tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
//                   <th className="px-8 py-6">Streamer</th>
//                   <th className="px-8 py-6">Jumlah</th>
//                   <th className="px-8 py-6">Metode</th>
//                   <th className="px-8 py-6">Rekening</th>
//                   <th className="px-8 py-6">Nama</th>
//                   <th className="px-8 py-6">Ref</th>
//                   <th className="px-8 py-6 text-center">Status</th>
//                   <th className="px-8 py-6 text-center">Aksi</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {withdrawals.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="text-center py-16 text-slate-400 font-bold">
//                       Tidak ada request penarikan pending
//                     </td>
//                   </tr>
//                 ) : withdrawals.map((wd) => (
//                   <tr key={wd._id} className="hover:bg-slate-50 transition-all">
//                     <td className="px-8 py-5 font-black text-slate-700">
//                       @{wd.userId?.username || '-'}
//                       <p className="text-[10px] text-slate-400 font-medium">{wd.userId?.email}</p>
//                     </td>
//                     <td className="px-8 py-5 text-indigo-600 font-black">
//                       Rp {Number(wd.amount).toLocaleString('id-ID')}
//                     </td>
//                     <td className="px-8 py-5 font-bold text-slate-600">{wd.paymentMethod}</td>
//                     <td className="px-8 py-5 font-bold text-slate-600">{wd.channelCode} - {wd.accountNumber}</td>
//                     <td className="px-8 py-5 font-bold text-slate-600">{wd.accountName}</td>
//                     <td className="px-8 py-5 font-mono text-[10px] text-slate-400">{wd.midtransReference}</td>
//                     <td className="px-8 py-5 text-center">
//                       <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
//                         wd.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
//                         wd.status === 'FAILED' ? 'bg-red-100 text-red-600' :
//                         'bg-amber-100 text-amber-600'
//                       }`}>
//                         {wd.status}
//                       </span>
//                     </td>
//                     <td className="px-8 py-5 text-center">
//                       {wd.status === 'PENDING' && (
//                         <div className="flex gap-2 justify-center">
//                           <button
//                             onClick={() => updateMutation.mutate({ id: wd._id, status: 'COMPLETED' })}
//                             disabled={updateMutation.isPending}
//                             className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black hover:bg-green-700 transition-all disabled:opacity-50"
//                           >
//                             Approve
//                           </button>
//                           <button
//                             onClick={() => updateMutation.mutate({ id: wd._id, status: 'FAILED' })}
//                             disabled={updateMutation.isPending}
//                             className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black hover:bg-red-700 transition-all disabled:opacity-50"
//                           >
//                             Tolak
//                           </button>
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const getTokenPayload = () => {
//   const token = localStorage.getItem('token');
//   if (!token) return null;
//   try {
//     return JSON.parse(atob(token.split('.')[1]));
//   } catch {
//     return null;
//   }
// };

// // Di dalam DashboardStreamer component
// const tokenPayload = getTokenPayload();
// console.log('payload:', tokenPayload)
// const isSuperAdmin = tokenPayload?.role === "superAdmin";

// // ─── Main Dashboard ───────────────────────────────────────────────────────────

// const DashboardStreamer = () => {
//   const queryClient = useQueryClient();
//   const [activeTab, setActiveTab] = useState('settings');
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [showToast, setShowToast] = useState(false);
//   const [localSettings, setLocalSettings] = useState(null);
//   const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
//   const [donationToasts, setDonationToasts] = useState([]);

//   // ── Queries ──────────────────────────────────────────────────────────────────

//   const { data: profileData, isLoading: profileLoading } = useQuery({
//     queryKey: ['profile'],
//     queryFn: fetchProfile,
//     refetchInterval: 30000, // polling tiap 30 detik
//     onSuccess: (data) => {
//       // Sync local settings hanya saat pertama kali load
//       if (!localSettings) {
//         setLocalSettings(data.settings || data.overlaySetting || {
//           minDonate: 10000,
//           maxDonate: 5000000,
//           theme: 'modern',
//           primaryColor: '#6366f1',
//           textColor: '#ffffff',
//           animation: 'bounce',
//           baseDuration: 5,
//           extraPerAmount: 10000,
//           extraDuration: 1
//         });
//       }
//     }
//   });

//   const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
//     queryKey: ['donationHistory'],
//     queryFn: fetchHistory,
//     refetchInterval: activeTab === 'history' ? 15000 : false, // realtime saat tab history aktif
//     enabled: activeTab === 'history'
//   });

//   // ── Mutations ─────────────────────────────────────────────────────────────────

//   const saveSettingsMutation = useMutation({
//     mutationFn: saveSettings,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['profile'] });
//       setShowToast(true);
//       setTimeout(() => setShowToast(false), 3000);
//     },
//     onError: (err) => {
//       alert(err.response?.data?.message || 'Gagal menyimpan pengaturan');
//     }
//   });

//   const updateProfileMutation = useMutation({
//     mutationFn: updateProfile,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['profile'] });
//       setShowToast(true);
//       setTimeout(() => setShowToast(false), 3000);
//     },
//     onError: (err) => {
//       alert(err.response?.data?.message || 'Gagal update profil');
//     }
//   });

//   const changePasswordMutation = useMutation({
//     mutationFn: changePassword,
//     onSuccess: () => {
//       setPasswordForm({ oldPassword: '', newPassword: '' });
//       alert('Password berhasil diubah!');
//     },
//     onError: (err) => {
//       alert(err.response?.data?.message || 'Gagal ganti password');
//     }
//   });

//   // ── Derived state ─────────────────────────────────────────────────────────────

//   const user = {
//     username: profileData?.user?.username || profileData?.User?.username || 'Streamer',
//     email: profileData?.user?.email || profileData?.User?.email || '',
//     balance: profileData?.User?.walletBalance || profileData?.walletBalance || 0,
//     overlayToken: profileData?.user?.overlayToken || profileData?.User?.overlayToken || '',
//     overlayUrl: `${window.location.origin}/overlay/${profileData?.user?.overlayToken || profileData?.User?.overlayToken || ''}`
//   };

//   useEffect(() => {
//     if (!user.overlayToken) return;

//     const socket = io(BASE_URL);

//     socket.on('connect', () => {
//       console.log('[Socket] Connected:', socket.id);
//       socket.emit('join-overlay', user.overlayToken);
//       console.log('[Socket] Joined room:', user.overlayToken);
//     });

//     socket.on('new-donation', (data) => {
//       console.log('[Socket] new-donation received:', data);
//       const id = Date.now();
//       setDonationToasts(prev => [...prev, { id, ...data }]);
//       setTimeout(() => {
//         setDonationToasts(prev => prev.filter(t => t.id !== id));
//       }, 6000);
//     });

//     socket.on('disconnect', () => {
//       console.log('[Socket] Disconnected');
//     });

//     return () => socket.disconnect();
//   }, [user.overlayToken]);

//   const settings = localSettings || {
//     minDonate: 10000,
//     maxDonate: 5000000,
//     theme: 'modern',
//     primaryColor: '#6366f1',
//     textColor: '#ffffff',
//     animation: 'bounce',
//     baseDuration: 5,
//     extraPerAmount: 10000,
//     extraDuration: 1
//   };

//   const history = historyData?.donations || historyData || [];

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     alert('URL Berhasil disalin!');
//   };

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">

//       {/* Toast */}
//       <AnimatePresence>
//         {showToast && (
//           <motion.div
//             initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
//             className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 font-bold border border-white/10 backdrop-blur-md"
//           >
//             <CheckCircle2 size={18} className="text-green-500" /> Pengaturan Tersimpan!
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Donation Toast Notifications */}
//       <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
//         <AnimatePresence>
//           {donationToasts.map((toast) => (
//             <motion.div
//               key={toast.id}
//               initial={{ x: 100, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               exit={{ x: 100, opacity: 0 }}
//               className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex items-start gap-4"
//             >
//               {/* Icon */}
//               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0">
//                 💜
//               </div>
//               {/* Content */}
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 mb-1">
//                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Donasi Masuk!</span>
//                   <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
//                 </div>
//                 <p className="font-black text-slate-800 text-sm truncate">
//                   {toast.donorName}
//                 </p>
//                 <p className="text-indigo-600 font-black text-lg">
//                   Rp {Number(toast.amount).toLocaleString('id-ID')}
//                 </p>
//                 {toast.message && (
//                   <p className="text-slate-500 text-xs font-medium italic mt-1 line-clamp-2">
//                     "{toast.message}"
//                   </p>
//                 )}
//               </div>
//               {/* Close */}
//               <button
//                 onClick={() => setDonationToasts(prev => prev.filter(t => t.id !== toast.id))}
//                 className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-lg leading-none"
//               >
//                 ×
//               </button>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>

//       {/* Mobile Navbar */}
//       <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex justify-between items-center">
//         <div className="flex items-center gap-2">
//           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic">D</div>
//           <span className="font-black text-sm tracking-tight">DUKUNG.IN</span>
//         </div>
//         <button onClick={() => setIsSidebarOpen(true)} className="cursor-pointer active:scale-[0.97] hover:brightness-95 p-2 bg-slate-200 rounded-xl text-slate-600">
//           <Menu size={24} />
//         </button>
//       </div>

//       <Sidebar
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isSidebarOpen={isSidebarOpen}
//         setIsSidebarOpen={setIsSidebarOpen}
//       />

//       <main className="flex-1 px-6 md:px-7 py-12 lg:py-4 max-w-7xl mx-auto w-full relative">

//         {/* Header */}
//         <header className="flex flex-col mt-4 lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative">
//           <div className="z-10">
//             <h2 className="text-4xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">
//               {activeTab === 'settings' ? 'Dashboard' : activeTab === 'history' ? 'Riwayat' : activeTab === 'wallet' ? 'Wallet' : 'Profil'}
//               <span className="text-indigo-600">.</span>
//             </h2>
//             <p className="text-slate-400 font-medium mt-1 flex items-center gap-2">
//               Selamat datang kembali, <span className="text-slate-800 font-bold">@{user.username}</span>
//             </p>
//           </div>

//           {/* Refetch indicator */}
//           {(profileLoading || historyLoading) && (
//             <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
//               <RefreshCw size={14} className="animate-spin" /> Memperbarui data...
//             </div>
//           )}
//         </header>

//         <AnimatePresence mode="wait">

//           {/* SETTINGS */}
//           {activeTab === 'settings' && (
//             <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-12 gap-10">
//               <section className="xl:col-span-7 space-y-8">
//                 <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
//                   <SectionHeader icon={<Settings size={20} />} title="Konfigurasi Alert" color="bg-indigo-500" />
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
//                     <InputField label="Minimal Donasi" type="number" value={settings.minDonate} onChange={(v) => setLocalSettings({ ...settings, minDonate: v })} />
//                     <InputField label="Maksimal Donasi" type="number" value={settings.maxDonate} onChange={(v) => setLocalSettings({ ...settings, maxDonate: v })} />
//                     <div className="md:col-span-2">
//                       <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Tema Visual</label>
//                       <div className="grid grid-cols-3 gap-3">
//                         {['modern', 'classic', 'minimal'].map(t => (
//                           <button key={t} onClick={() => setLocalSettings({ ...settings, theme: t })}
//                             className={`py-4 rounded-2xl border-2 transition-all font-black text-sm capitalize ${settings.theme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
//                           >{t}</button>
//                         ))}
//                       </div>
//                     </div>
//                     <InputField label="Warna Background" type="color" value={settings.primaryColor} onChange={(v) => setLocalSettings({ ...settings, primaryColor: v })} />
//                     <InputField label="Warna Teks" type="color" value={settings.textColor} onChange={(v) => setLocalSettings({ ...settings, textColor: v })} />
//                     <InputField label="Durasi Dasar (detik)" type="number" value={settings.baseDuration} onChange={(v) => setLocalSettings({ ...settings, baseDuration: Number(v) })} />
//                     <InputField label="Kelipatan Donasi (Rp)" type="number" value={settings.extraPerAmount} onChange={(v) => setLocalSettings({ ...settings, extraPerAmount: Number(v) })} />
//                     <InputField label="Tambahan Durasi per Kelipatan (detik)" type="number" value={settings.extraDuration} onChange={(v) => setLocalSettings({ ...settings, extraDuration: Number(v) })} />
//                   </div>

//                   <div className="bg-slate-200 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
//                     <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">OBS URL</label>
//                     <div className="flex gap-3">
//                       <input readOnly value={user.overlayUrl} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 font-bold outline-none overflow-hidden text-ellipsis" />
//                       <button onClick={() => copyToClipboard(user.overlayUrl)} className="text-slate-400 hover:text-indigo-600"><Copy size={18} /></button>
//                     </div>
//                   </div>

//                   <button
//                     onClick={() => saveSettingsMutation.mutate(settings)}
//                     disabled={saveSettingsMutation.isPending}
//                     className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-70"
//                   >
//                     {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
//                   </button>
//                 </div>
//               </section>

//               {/* Live Preview */}
//               <section className="xl:col-span-5">
//                 <div className="sticky top-12 bg-slate-900 rounded-3xl p-8 h-[500px] flex items-center justify-center relative overflow-hidden border-[12px] border-slate-800 shadow-2xl">
//                   <div className="absolute top-6 left-8 flex items-center gap-2">
//                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
//                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Preview</span>
//                   </div>
//                   <motion.div
//                     key={settings.theme + settings.primaryColor}
//                     initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//                     style={{
//                       backgroundColor: settings.primaryColor,
//                       color: settings.textColor,
//                       borderRadius: settings.theme === 'modern' ? '1.5rem' : settings.theme === 'minimal' ? '0px' : '0.5rem',
//                       textAlign: settings.theme === 'minimal' ? 'left' : 'center',
//                     }}
//                     className={`p-8 shadow-2xl w-full md:max-w-[280px] ${settings.theme === 'classic' ? 'border-4 border-white/20' : ''}`}
//                   >
//                     <p className="text-[10px] font-black uppercase tracking-widest mb-2">Baru Saja Memberi!</p>
//                     <h4 className="text-2xl font-black">@{user.username}</h4>
//                     <p className="text-lg font-bold">Rp 50.000</p>
//                     <p className="mt-4 text-xs italic opacity-80 leading-relaxed font-medium">"Semangat terus ngodingnya bang!"</p>
//                   </motion.div>
//                 </div>
//               </section>
//             </motion.div>
//           )}

//           {/* HISTORY */}
//           {activeTab === 'history' && (
//             <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
//               {/* Realtime refresh indicator */}
//               <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100">
//                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Riwayat Donasi</p>
//                 <div className="flex items-center gap-2 text-xs text-green-500 font-bold">
//                   <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
//                   Auto-refresh 15s
//                   <button onClick={() => refetchHistory()} className="ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
//                     <RefreshCw size={14} />
//                   </button>
//                 </div>
//               </div>

//               {historyLoading ? (
//                 <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3">
//                   <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
//                   Memuat riwayat...
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-left min-w-[700px]">
//                     <thead>
//                       <tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
//                         <th className="px-10 py-6">Donatur</th>
//                         <th className="px-10 py-6">Jumlah</th>
//                         <th className="px-10 py-6">Pesan</th>
//                         <th className="px-10 py-6 text-center">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                       {history.length === 0 ? (
//                         <tr>
//                           <td colSpan={4} className="text-center py-16 text-slate-400 font-bold">Belum ada donasi</td>
//                         </tr>
//                       ) : history.map((item, idx) => (
//                         <tr key={item.id || idx} className="hover:bg-slate-200/50 transition-all">
//                           <td className="px-10 py-6 font-black text-slate-700">{item.donor || item.donorName}</td>
//                           <td className="px-10 py-6 text-indigo-600 font-black">Rp {Number(item.amount).toLocaleString('id-ID')}</td>
//                           <td className="px-10 py-6 text-slate-500 text-sm font-medium italic">"{item.msg || item.message}"</td>
//                           <td className="px-10 py-6 text-center">
//                             <span className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest ${item.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
//                               {item.status}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </motion.div>
//           )}

//           {/* PROFILE */}
//           {activeTab === 'profile' && (
//             <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-6">

//               {/* Hero Profile Card */}
//               <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
//                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 z-0"></div>
//                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
//                   <div className="relative group">
//                     <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white shadow-xl transition-transform duration-500">
//                       {user.username.charAt(0).toUpperCase()}
//                     </div>
//                   </div>
//                   <div className="flex-1 text-center md:text-left space-y-2">
//                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
//                       <h2 className="text-4xl font-black text-slate-800 tracking-tighter">@{user.username}</h2>
//                       <span className="px-4 py-1.5 bg-green-100 relative top-1 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Verified Creator</span>
//                     </div>
//                     <p className="text-slate-400 font-medium">{user.email}</p>
//                     <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
//                       <div>
//                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
//                         <p className="font-bold text-indigo-600">Active</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Public Profile */}
//                 <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
//                   <SectionHeader icon={<User size={18} />} title="Profil Publik" color="bg-indigo-500" />
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
//                     <div className="md:col-span-2">
//                       <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">Link Halaman Donasi Kamu</label>
//                       <div className="flex gap-2 group">
//                         <div className="relative flex-1">
//                           <input
//                             readOnly
//                             value={`${window.location.origin}/${user.username}`}
//                             className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-5 font-mono text-sm text-indigo-600 font-bold outline-none group-hover:border-indigo-300 transition-all shadow-sm"
//                           />
//                           <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
//                             Public Link
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => copyToClipboard(`${window.location.origin}/${user.username}`)}
//                           className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-95"
//                         >
//                           <Copy size={20} />
//                         </button>
//                       </div>
//                       <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1 italic">*Bagikan link ini di bio Instagram, TikTok, atau deskripsi YouTube kamu.</p>
//                     </div>

//                     <InputField label="Display Name" defaultValue={user.username} placeholder="Nama di halaman donasi" />
//                     <InputField label="Email Address" type="email" defaultValue={user.email} />
//                     <div className="md:col-span-2">
//                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio Singkat</label>
//                       <textarea
//                         className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 h-32 transition-all shadow-sm"
//                         placeholder="Ceritakan tentang kontenmu..."
//                       ></textarea>
//                     </div>

//                     <div className="md:col-span-2">
//                       <button
//                         onClick={() => updateProfileMutation.mutate({ username: user.username, email: user.email })}
//                         disabled={updateProfileMutation.isPending}
//                         className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70"
//                       >
//                         <Save size={18} />
//                         {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Security */}
//                 <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
//                   <SectionHeader icon={<ShieldCheck size={18} />} title="Keamanan" color="bg-red-500" />
//                   <div className="space-y-6 mt-10">
//                     <div className="space-y-4">
//                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganti Password</p>
//                       <input
//                         type="password"
//                         value={passwordForm.oldPassword}
//                         placeholder="Password Lama"
//                         className="w-full p-4 bg-blue-600/10 border border-black/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm"
//                         onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
//                       />
//                       <input
//                         type="password"
//                         value={passwordForm.newPassword}
//                         placeholder="Password Baru"
//                         className="w-full p-4 bg-blue-600/10 border border-black/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm"
//                         onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
//                       />
//                     </div>
//                     <div className="pt-6 border-t border-white/5">
//                       <button
//                         onClick={() => changePasswordMutation.mutate(passwordForm)}
//                         disabled={changePasswordMutation.isPending}
//                         className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70"
//                       >
//                         <Save size={18} />
//                         {changePasswordMutation.isPending ? 'Memproses...' : 'Update Password'}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* WALLET */}
//           {activeTab === 'wallet' && (
//             <WithdrawPage />
//           )}

//           {/* ADMIN — hanya superAdmin */}
//           {activeTab === 'admin' && isSuperAdmin && (
//             <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//               <AdminWithdrawalPage />
//             </motion.div>
//           )}

//           {/* Jika bukan superAdmin tapi coba akses tab admin */}
//           {activeTab === 'admin' && !isSuperAdmin && (
//             <motion.div key="forbidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               className="flex flex-col items-center justify-center py-32 text-slate-400"
//             >
//               <p className="text-6xl mb-4">🔒</p>
//               <p className="font-black text-xl">Akses Ditolak</p>
//               <p className="font-medium text-sm mt-2">Halaman ini hanya untuk Super Admin</p>
//             </motion.div>
//           )}

//         </AnimatePresence>
//       </main>

//       {isSidebarOpen && (
//         <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden" />
//       )}
//     </div>
//   );
// };

// // ─── Sub Components ───────────────────────────────────────────────────────────

// const InputField = ({ label, ...props }) => (
//   <div className="w-full">
//     <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{label}</label>
//     <input
//       className="w-full bg-slate-200 border-2 border-slate-50 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm shadow-sm"
//       {...props}
//       onChange={(e) => props.onChange?.(e.target.value)}
//     />
//   </div>
// );

// const SectionHeader = ({ icon, title, color }) => (
//   <div className="flex items-center gap-4">
//     <div className={`${color} p-3 rounded-2xl text-white shadow-lg`}>{icon}</div>
//     <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
//   </div>
// );

// export default DashboardStreamer;



import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  ImageIcon,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Timer,
  Trash2,
  User,
  Video,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../components/sidebar';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ─── API ──────────────────────────────────────────────────────────────────────

const fetchProfile    = async () => (await axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })).data;
const fetchHistory    = async () => (await axios.get(`${BASE_URL}/api/donations/history`, { headers: authHeader() })).data;
const saveSettings    = async (s) => (await axios.put(`${BASE_URL}/api/overlay/settings`, s, { headers: authHeader() })).data;
const updateProfile   = async (d) => (await axios.put(`${BASE_URL}/api/auth/profile`, d, { headers: authHeader() })).data;
const changePassword  = async (d) => (await axios.put(`${BASE_URL}/api/auth/change-password`, d, { headers: authHeader() })).data;
const postWithdraw    = async (d) => (await axios.post(`${BASE_URL}/api/midtrans/withdraw`, d, { headers: authHeader() })).data;
const fetchAdminWDs   = async () => (await axios.get(`${BASE_URL}/api/midtrans/admin/withdrawals`, { headers: authHeader() })).data;
const updateWDStatus  = async ({ id, status }) => (await axios.put(`${BASE_URL}/api/midtrans/admin/withdrawals/${id}`, { status }, { headers: authHeader() })).data;

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  minDonate: 10000,
  maxDonate: 5000000,
  theme: 'modern',
  primaryColor: '#6366f1',
  textColor: '#ffffff',
  animation: 'bounce',
  maxWidth: 280,
  overlayPosition: 'bottom-right',
  baseDuration: 5,
  extraPerAmount: 10000,
  extraDuration: 1,
  durationTiers: [
    { minAmount: 0,     maxAmount: 4999,  duration: 5  },
    { minAmount: 5000,  maxAmount: 49999, duration: 10 },
    { minAmount: 50000, maxAmount: null,  duration: 20 },
  ],
  mediaTriggers: [],
};

// ─── Helper: hitung durasi dari tiers ────────────────────────────────────────

const getDuration = (settings, amount) => {
  const tiers = settings.durationTiers || [];
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
    for (const t of sorted) {
      if (amount >= t.minAmount && (t.maxAmount === null || amount <= t.maxAmount)) {
        return t.duration;
      }
    }
  }
  const extras = Math.floor(amount / (settings.extraPerAmount || 10000));
  return (settings.baseDuration || 5) + extras * (settings.extraDuration || 1);
};

const getMedia = (settings, amount) => {
  const triggers = settings.mediaTriggers || [];
  if (!triggers.length) return null;
  const eligible = triggers.filter(t => amount >= t.minAmount).sort((a, b) => b.minAmount - a.minAmount);
  return eligible[0] || null;
};

// ─── WithdrawPage ─────────────────────────────────────────────────────────────

const WithdrawPage = () => {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState('BANK');
  const [formData, setFormData] = useState({ amount: '', channelCode: 'BCA', accountNumber: '', accountName: '' });

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile, refetchInterval: 30000 });
  const balance = profileData?.User?.walletBalance || profileData?.walletBalance || 0;

  const withdrawMutation = useMutation({
    mutationFn: postWithdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Permintaan penarikan berhasil dikirim!');
      setFormData({ amount: '', channelCode: method === 'BANK' ? 'BCA' : method, accountNumber: '', accountName: '' });
    },
    onError: (err) => alert(err.response?.data?.message || 'Terjadi kesalahan'),
  });

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Wallet size={120} /></div>
        <div className="relative z-10">
          <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
          <h1 className="text-3xl font-black italic">Rp {parseFloat(balance).toLocaleString('id-ID')}</h1>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><CreditCard className="text-indigo-600" /> Konfigurasi Pencairan</h2>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[{ id: 'BANK', label: 'Transfer Bank', icon: <CreditCard size={18} /> }, { id: 'DANA', label: 'E-Wallet DANA', icon: <Smartphone size={18} /> }, { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18} /> }].map(m => (
            <button key={m.id} onClick={() => { setMethod(m.id); setFormData({ ...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id }); }}
              className={`cursor-pointer active:scale-[0.97] hover:bg-blue-50 flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all font-black text-sm ${method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {method === 'BANK' && (
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bank</label>
                <select className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" onChange={(e) => setFormData({ ...formData, channelCode: e.target.value })}>
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="MANDIRI">Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                </select>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{method === 'BANK' ? 'Nomor Rekening' : 'Nomor Handphone'}</label>
              <input value={formData.accountNumber} placeholder={method === 'BANK' ? '000-000-000' : '0812xxxx'} className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Pemilik Akun</label>
            <input value={formData.accountName} placeholder="Sesuaikan dengan Buku Tabungan / Nama di App" className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal yang Ingin Ditarik (IDR)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-white">Rp</span>
              <input type="number" value={formData.amount} placeholder="Contoh: 100000" className="w-full p-6 pl-14 bg-slate-900 text-white rounded-3xl font-black text-xl outline-none focus:ring-4 ring-indigo-100 transition-all" onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold ml-1 italic">*Biaya admin penarikan Rp 5.000 akan memotong saldo utama.</p>
          </div>
          <button onClick={() => { if (parseFloat(formData.amount) > parseFloat(balance)) return alert('Saldo tidak mencukupi!'); if (parseFloat(formData.amount) < 10000) return alert('Minimal penarikan adalah Rp 10.000'); withdrawMutation.mutate({ ...formData, paymentMethod: method }); }} disabled={withdrawMutation.isPending}
            className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-4 disabled:opacity-70">
            {withdrawMutation.isPending ? <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Sedang Memproses...</> : <><ArrowRight size={20} /> Ajukan Pencairan Dana</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AdminWithdrawalPage ──────────────────────────────────────────────────────

const AdminWithdrawalPage = () => {
  const queryClient = useQueryClient();
  const { data: withdrawals = [], isLoading } = useQuery({ queryKey: ['adminWithdrawals'], queryFn: fetchAdminWDs, refetchInterval: 30000 });
  const updateMutation = useMutation({ mutationFn: updateWDStatus, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }), onError: (err) => alert(err.response?.data?.message || 'Gagal update status') });
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Semua Request Penarikan</p>
          <span className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Super Admin Only</span>
        </div>
        {isLoading ? <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3"><div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />Memuat data...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead><tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">{['Streamer','Jumlah','Metode','Rekening','Nama','Ref','Status','Aksi'].map(h => <th key={h} className="px-8 py-6">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {withdrawals.length === 0 ? <tr><td colSpan={8} className="text-center py-16 text-slate-400 font-bold">Tidak ada request penarikan</td></tr>
                : withdrawals.map(wd => (
                  <tr key={wd._id} className="hover:bg-slate-50 transition-all">
                    <td className="px-8 py-5 font-black text-slate-700">@{wd.userId?.username || '-'}<p className="text-[10px] text-slate-400 font-medium">{wd.userId?.email}</p></td>
                    <td className="px-8 py-5 text-indigo-600 font-black">Rp {Number(wd.amount).toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 font-bold text-slate-600">{wd.paymentMethod}</td>
                    <td className="px-8 py-5 font-bold text-slate-600">{wd.channelCode} - {wd.accountNumber}</td>
                    <td className="px-8 py-5 font-bold text-slate-600">{wd.accountName}</td>
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-400">{wd.midtransReference}</td>
                    <td className="px-8 py-5 text-center"><span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${wd.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : wd.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{wd.status}</span></td>
                    <td className="px-8 py-5 text-center">{wd.status === 'PENDING' && <div className="flex gap-2 justify-center"><button onClick={() => updateMutation.mutate({ id: wd._id, status: 'COMPLETED' })} disabled={updateMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black hover:bg-green-700 transition-all disabled:opacity-50">Approve</button><button onClick={() => updateMutation.mutate({ id: wd._id, status: 'FAILED' })} disabled={updateMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black hover:bg-red-700 transition-all disabled:opacity-50">Tolak</button></div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DurationTiersEditor ──────────────────────────────────────────────────────

const DurationTiersEditor = ({ tiers, onChange }) => {
  const addTier = () => onChange([...tiers, { minAmount: 0, maxAmount: null, duration: 10 }]);
  const removeTier = (i) => onChange(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i, key, val) => onChange(tiers.map((t, idx) => idx === i ? { ...t, [key]: val === '' ? null : Number(val) } : t));

  return (
    <div className="space-y-3">
      {tiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min (Rp)</label>
              <input type="number" value={tier.minAmount} onChange={e => updateTier(i, 'minAmount', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max (Rp, kosong=∞)</label>
              <input type="number" value={tier.maxAmount ?? ''} placeholder="∞" onChange={e => updateTier(i, 'maxAmount', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Durasi (detik)</label>
              <input type="number" value={tier.duration} onChange={e => updateTier(i, 'duration', e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 p-1">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button onClick={addTier} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Ketentuan Durasi
      </button>
    </div>
  );
};

// ─── MediaTriggersEditor ──────────────────────────────────────────────────────

const MediaTriggersEditor = ({ triggers, onChange }) => {
  const add = () => onChange([...triggers, { minAmount: 50000, mediaUrl: '', mediaType: 'image', label: '' }]);
  const remove = (i) => onChange(triggers.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(triggers.map((t, idx) => idx === i ? { ...t, [key]: val } : t));

  return (
    <div className="space-y-4">
      {triggers.map((t, i) => (
        <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {t.mediaType === 'video' ? <Video size={16} className="text-indigo-500" /> : <ImageIcon size={16} className="text-indigo-500" />}
              <span className="font-black text-slate-700 text-sm">{t.label || `Media ${i + 1}`}</span>
            </div>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 size={15} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Label (opsional)</label>
              <input value={t.label} placeholder="contoh: Sultan Alert" onChange={e => update(i, 'label', e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Donasi (Rp)</label>
              <input type="number" value={t.minAmount} onChange={e => update(i, 'minAmount', Number(e.target.value))}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">URL Gambar / Video</label>
            <input value={t.mediaUrl} placeholder="https://cdn.kamu.com/sultan-alert.gif" onChange={e => update(i, 'mediaUrl', e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400 font-mono" />
          </div>

          {/* Preview kecil */}
          {t.mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900" style={{ maxHeight: 140 }}>
              {t.mediaType === 'video'
                ? <video src={t.mediaUrl} muted loop autoPlay className="w-full object-cover" style={{ maxHeight: 140 }} />
                : <img src={t.mediaUrl} alt="preview" className="w-full object-cover" style={{ maxHeight: 140 }} onError={e => e.target.style.display = 'none'} />
              }
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipe:</label>
            {['image', 'video'].map(type => (
              <button key={type} onClick={() => update(i, 'mediaType', type)}
                className={`px-4 py-2 rounded-xl font-black text-xs border-2 transition-all flex items-center gap-1.5 ${t.mediaType === type ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                {type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />} {type === 'video' ? 'Video' : 'Gambar'}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={add} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl font-black text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Tambah Media Alert
      </button>
    </div>
  );
};

// ─── YouTubeLivePreview ───────────────────────────────────────────────────────

const YouTubeLivePreview = ({ settings, username }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [currentDonor, setCurrentDonor] = useState(null);
  const timerRef = useRef(null);
  const donorIdxRef = useRef(0);

  const donors = [
    { name: 'Budi Santoso',  amount: 50000,  msg: 'Semangat terus ngodingnya bang!' },
    { name: 'Siti Rahayu',   amount: 150000, msg: 'Mantap kontennya, keep it up!' },
    { name: 'Anonim',        amount: 10000,  msg: 'Good luck!' },
    { name: 'RizkyDev',      amount: 200000, msg: 'Dukung terus creator lokal!' },
  ];

  const triggerDemo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const d = donors[donorIdxRef.current % donors.length];
    donorIdxRef.current++;
    setCurrentDonor(d);
    setShowAlert(false);
    setTimeout(() => { setAnimKey(k => k + 1); setShowAlert(true); }, 50);
    const dur = getDuration(settings, d.amount);
    timerRef.current = setTimeout(() => setShowAlert(false), dur * 1000 + 500);
  };

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const posMap = {
    'top-left':      { top: '14%', left: '2%' },
    'top-right':     { top: '14%', right: '2%' },
    'bottom-left':   { bottom: '18%', left: '2%' },
    'bottom-right':  { bottom: '18%', right: '2%' },
    'top-center':    { top: '14%', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '18%', left: '50%', transform: 'translateX(-50%)' },
  };

  const animVariants = {
    bounce: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: [0.5, 1.08, 1], opacity: 1, transition: { duration: 0.5 } }, exit: { scale: 0.8, opacity: 0, transition: { duration: 0.3 } } },
    'slide-left': { initial: { x: -80, opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }, exit: { x: -60, opacity: 0, transition: { duration: 0.3 } } },
    'slide-right': { initial: { x: 80, opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }, exit: { x: 60, opacity: 0, transition: { duration: 0.3 } } },
    fade: { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0, y: -8, transition: { duration: 0.3 } } },
  };

  const anim = animVariants[settings.animation] || animVariants.bounce;
  const pos = posMap[settings.overlayPosition || 'bottom-right'];
  const bg = settings.primaryColor || '#6366f1';
  const fg = settings.textColor || '#ffffff';
  const maxW = settings.maxWidth || 280;
  const theme = settings.theme || 'modern';

  const media = currentDonor ? getMedia(settings, currentDonor.amount) : null;
  const dur = currentDonor ? getDuration(settings, currentDonor.amount) : 5;

  const renderAlert = () => {
    if (!currentDonor) return null;
    const inner = (
      <div>
        {/* Text part */}
        {theme === 'modern' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💜</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Donasi Masuk!</div>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>@{currentDonor.name} · Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
              <div style={{ fontSize: 9, opacity: 0.7, fontStyle: 'italic', marginTop: 2 }}>"{currentDonor.msg}"</div>
            </div>
          </div>
        )}
        {theme === 'classic' && (
          <div style={{ padding: '10px 14px', border: '2px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Donasi Masuk!</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 9, opacity: 0.6, fontStyle: 'italic', marginTop: 2 }}>"{currentDonor.msg}"</div>
          </div>
        )}
        {theme === 'minimal' && (
          <div style={{ padding: '8px 12px', borderLeft: '3px solid rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 9, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Donasi Masuk</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Rp {currentDonor.amount.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>@{currentDonor.name}</div>
            <div style={{ fontSize: 9, opacity: 0.55, fontStyle: 'italic', marginTop: 1 }}>"{currentDonor.msg}"</div>
          </div>
        )}

        {/* Media di bawah pesan */}
        {media && media.mediaUrl && (
          <div style={{ overflow: 'hidden', borderBottomLeftRadius: theme === 'modern' ? 12 : 0, borderBottomRightRadius: theme === 'modern' ? 12 : 0, maxHeight: 120 }}>
            {media.mediaType === 'video'
              ? <video src={media.mediaUrl} autoPlay muted loop style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
              : <img src={media.mediaUrl} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
            }
            {media.label && (
              <div style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontWeight: 800, textAlign: 'center', padding: '3px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {media.label}
              </div>
            )}
          </div>
        )}
      </div>
    );

    const wrapStyle = {
      backgroundColor: theme === 'minimal' ? 'transparent' : bg,
      color: fg,
      maxWidth: `${maxW}px`,
      width: '100%',
      borderRadius: theme === 'modern' ? 14 : theme === 'classic' ? 4 : 0,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    };

    return <div style={wrapStyle}>{inner}</div>;
  };

  return (
    <div className="sticky top-12 space-y-3">
      {/* YouTube mock frame */}
      <div className="relative overflow-hidden border-[10px] border-slate-800 rounded-2xl shadow-2xl" style={{ aspectRatio: '16/9', background: '#000' }}>
        {/* Stream BG */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(155deg,#1a1a2e 0%,#0d0d1a 60%,#12121f 100%)' }}>
          <span style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.04)', letterSpacing: -3, userSelect: 'none' }}>LIVE</span>
        </div>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-2" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.65) 0%,transparent 100%)' }}>
          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[8px] font-black flex-shrink-0">YT</div>
          <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-wide">LIVE</span>
          <span className="text-white text-[9px] font-medium opacity-80 flex-1 truncate">Ngoding Bareng | Bikin Fitur Donasi dari 0</span>
          <span className="text-white text-[8px] opacity-50 flex-shrink-0">2.1K menonton</span>
        </div>
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-4" style={{ background: 'linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 100%)' }}>
          <div className="h-0.5 bg-white/20 rounded mb-2 relative"><div className="absolute left-0 top-0 h-full bg-red-600 rounded" style={{ width: '38%' }} /></div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs">⏸</span><span className="text-white/80 text-xs">🔊</span>
            <span className="text-white/60 text-[9px] font-mono ml-1">1:23:47</span>
            <div className="ml-auto flex gap-2 text-white/70 text-xs">⚙ ⛶</div>
          </div>
        </div>
        {/* Alert overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {showAlert && (
              <motion.div key={animKey} initial={anim.initial} animate={anim.animate} exit={anim.exit}
                style={{ position: 'absolute', ...pos, zIndex: 10 }}>
                {renderAlert()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute top-2 right-3"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse block" /></div>
      </div>

      {/* Info strip */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1 flex-wrap gap-1">
        <span>Lebar: <span className="text-indigo-600">{maxW}px</span></span>
        <span>Tema: <span className="text-indigo-600">{theme}</span></span>
        <span>Durasi demo: <span className="text-indigo-600">{currentDonor ? dur : '-'}s</span></span>
        <span>Media: <span className="text-indigo-600">{currentDonor && media ? media.label || media.mediaType : 'tidak ada'}</span></span>
      </div>

      <button onClick={triggerDemo}
        className="w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-sm border-2 border-indigo-100 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Simulasi Donasi Masuk
      </button>
    </div>
  );
};

// ─── Token helpers ────────────────────────────────────────────────────────────

const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};
const tokenPayload = getTokenPayload();
const isSuperAdmin = tokenPayload?.role === 'superAdmin';

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const DashboardStreamer = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [donationToasts, setDonationToasts] = useState([]);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    refetchInterval: 30000,
    onSuccess: (data) => {
      if (!localSettings) {
        const s = data.settings || data.overlaySetting || {};
        setLocalSettings({ ...DEFAULT_SETTINGS, ...s });
      }
    }
  });

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: fetchHistory,
    refetchInterval: activeTab === 'history' ? 15000 : false,
    enabled: activeTab === 'history',
  });

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal menyimpan pengaturan'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal update profil'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => { setPasswordForm({ oldPassword: '', newPassword: '' }); alert('Password berhasil diubah!'); },
    onError: (err) => alert(err.response?.data?.message || 'Gagal ganti password'),
  });

  const user = {
    username: profileData?.user?.username || profileData?.User?.username || 'Streamer',
    email: profileData?.user?.email || profileData?.User?.email || '',
    balance: profileData?.User?.walletBalance || profileData?.walletBalance || 0,
    overlayToken: profileData?.user?.overlayToken || profileData?.User?.overlayToken || '',
    overlayUrl: `${window.location.origin}/overlay/${profileData?.user?.overlayToken || profileData?.User?.overlayToken || ''}`,
  };

  useEffect(() => {
    if (!user.overlayToken) return;
    const socket = io(BASE_URL);
    socket.on('connect', () => socket.emit('join-overlay', user.overlayToken));
    socket.on('new-donation', (data) => {
      const id = Date.now();
      setDonationToasts(prev => [...prev, { id, ...data }]);
      setTimeout(() => setDonationToasts(prev => prev.filter(t => t.id !== id)), 6000);
    });
    return () => socket.disconnect();
  }, [user.overlayToken]);

  const settings = localSettings || DEFAULT_SETTINGS;
  const history = historyData?.donations || historyData || [];
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('URL Berhasil disalin!'); };

  const upd = (key, val) => setLocalSettings(s => ({ ...s, [key]: val }));

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">

      {/* Save Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 font-bold border border-white/10 backdrop-blur-md">
            <CheckCircle2 size={18} className="text-green-500" /> Pengaturan Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donation Toast */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {donationToasts.map(toast => (
            <motion.div key={toast.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
              className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0">💜</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Donasi Masuk!</span>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                </div>
                <p className="font-black text-slate-800 text-sm truncate">{toast.donorName}</p>
                <p className="text-indigo-600 font-black text-lg">Rp {Number(toast.amount).toLocaleString('id-ID')}</p>
                {toast.message && <p className="text-slate-500 text-xs font-medium italic mt-1 line-clamp-2">"{toast.message}"</p>}
              </div>
              <button onClick={() => setDonationToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-lg leading-none">×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic">D</div>
          <span className="font-black text-sm tracking-tight">DUKUNG.IN</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="cursor-pointer active:scale-[0.97] p-2 bg-slate-200 rounded-xl text-slate-600"><Menu size={24} /></button>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 px-6 md:px-7 py-12 lg:py-4 max-w-7xl mx-auto w-full relative">
        <header className="flex flex-col mt-4 lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative">
          <div className="z-10">
            <h2 className="text-4xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">
              {activeTab === 'settings' ? 'Dashboard' : activeTab === 'history' ? 'Riwayat' : activeTab === 'wallet' ? 'Wallet' : 'Profil'}<span className="text-indigo-600">.</span>
            </h2>
            <p className="text-slate-400 font-medium mt-1">Selamat datang kembali, <span className="text-slate-800 font-bold">@{user.username}</span></p>
          </div>
          {(profileLoading || historyLoading) && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold"><RefreshCw size={14} className="animate-spin" /> Memperbarui data...</div>
          )}
        </header>

        <AnimatePresence mode="wait">

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-12 gap-10">

              <section className="xl:col-span-7 space-y-6">

                {/* Card 1: Konfigurasi Alert */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<Settings size={20} />} title="Konfigurasi Alert" color="bg-indigo-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <InputField label="Minimal Donasi" type="number" value={settings.minDonate} onChange={v => upd('minDonate', v)} />
                    <InputField label="Maksimal Donasi" type="number" value={settings.maxDonate} onChange={v => upd('maxDonate', v)} />

                    {/* Tema */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Tema Visual</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['modern', 'classic', 'minimal'].map(t => (
                          <button key={t} onClick={() => upd('theme', t)}
                            className={`py-4 rounded-2xl border-2 transition-all font-black text-sm capitalize ${settings.theme === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-50' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}>{t}</button>
                        ))}
                      </div>
                    </div>

                    <InputField label="Warna Background" type="color" value={settings.primaryColor} onChange={v => upd('primaryColor', v)} />
                    <InputField label="Warna Teks" type="color" value={settings.textColor} onChange={v => upd('textColor', v)} />

                    {/* Animasi */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Animasi Masuk</label>
                      <select value={settings.animation} onChange={e => upd('animation', e.target.value)}
                        className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all">
                        <option value="bounce">Bounce</option>
                        <option value="slide-left">Slide Kiri</option>
                        <option value="slide-right">Slide Kanan</option>
                        <option value="fade">Fade</option>
                      </select>
                    </div>

                    {/* Posisi */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posisi Overlay di Layar</label>
                      <select value={settings.overlayPosition || 'bottom-right'} onChange={e => upd('overlayPosition', e.target.value)}
                        className="w-full p-5 bg-slate-200 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all">
                        <option value="top-left">Kiri Atas</option>
                        <option value="top-right">Kanan Atas</option>
                        <option value="bottom-left">Kiri Bawah</option>
                        <option value="bottom-right">Kanan Bawah</option>
                        <option value="top-center">Tengah Atas</option>
                        <option value="bottom-center">Tengah Bawah</option>
                      </select>
                    </div>

                    {/* Max width slider */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                        Lebar Maks Overlay OBS <span className="text-indigo-500 normal-case font-bold ml-1">({settings.maxWidth || 280}px)</span>
                      </label>
                      <input type="range" min={180} max={600} step={10} value={settings.maxWidth || 280}
                        onChange={e => upd('maxWidth', Number(e.target.value))} className="w-full accent-indigo-600" />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-0.5">
                        <span>180px (compact)</span><span>390px (standar)</span><span>600px (lebar)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Durasi Bertingkat */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<Timer size={20} />} title="Durasi Tampil per Nominal" color="bg-amber-500" />
                  <p className="text-xs text-slate-400 font-medium mt-3 mb-6">
                    Atur berapa lama alert muncul berdasarkan nominal donasi. Overlay akan menggunakan ketentuan pertama yang cocok (dari bawah ke atas).
                  </p>
                  <DurationTiersEditor
                    tiers={settings.durationTiers || []}
                    onChange={v => upd('durationTiers', v)}
                  />
                </div>

                {/* Card 3: Media Alert */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<ImageIcon size={20} />} title="Media Alert (Gambar / Video)" color="bg-purple-500" />
                  <p className="text-xs text-slate-400 font-medium mt-3 mb-6">
                    Tambah gambar atau video yang muncul <strong>di bawah pesan</strong> saat nominal donasi mencapai batas minimum yang kamu tentukan. Jika ada beberapa trigger, sistem akan memilih yang minAmount-nya paling tinggi.
                  </p>
                  <MediaTriggersEditor
                    triggers={settings.mediaTriggers || []}
                    onChange={v => upd('mediaTriggers', v)}
                  />
                </div>

                {/* OBS URL + Simpan */}
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                  <div className="bg-slate-200 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">OBS URL</label>
                    <div className="flex gap-3">
                      <input readOnly value={user.overlayUrl} className="flex-1 bg-transparent font-mono text-sm text-indigo-600 font-bold outline-none overflow-hidden text-ellipsis" />
                      <button onClick={() => copyToClipboard(user.overlayUrl)} className="text-slate-400 hover:text-indigo-600"><Copy size={18} /></button>
                    </div>
                  </div>
                  <button onClick={() => saveSettingsMutation.mutate(settings)} disabled={saveSettingsMutation.isPending}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2">
                    <Save size={20} />
                    {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                  </button>
                </div>
              </section>

              {/* Right: YouTube Preview */}
              <section className="xl:col-span-5">
                <YouTubeLivePreview settings={settings} username={user.username} />
              </section>
            </motion.div>
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Riwayat Donasi</p>
                <div className="flex items-center gap-2 text-xs text-green-500 font-bold">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Auto-refresh 15s
                  <button onClick={() => refetchHistory()} className="ml-2 text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCw size={14} /></button>
                </div>
              </div>
              {historyLoading ? <div className="flex items-center justify-center py-20 text-slate-400 font-bold gap-3"><div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />Memuat riwayat...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead><tr className="bg-slate-200/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">{['Donatur','Jumlah','Pesan','Status'].map((h,i) => <th key={h} className={`px-10 py-6${i===3?' text-center':''}`}>{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-400 font-bold">Belum ada donasi</td></tr>
                      : history.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-200/50 transition-all">
                          <td className="px-10 py-6 font-black text-slate-700">{item.donor || item.donorName}</td>
                          <td className="px-10 py-6 text-indigo-600 font-black">Rp {Number(item.amount).toLocaleString('id-ID')}</td>
                          <td className="px-10 py-6 text-slate-500 text-sm font-medium italic">"{item.msg || item.message}"</td>
                          <td className="px-10 py-6 text-center"><span className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest ${item.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{item.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 z-0" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white shadow-xl">{user.username.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">@{user.username}</h2>
                      <span className="px-4 py-1.5 bg-green-100 relative top-1 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">Verified Creator</span>
                    </div>
                    <p className="text-slate-400 font-medium">{user.email}</p>
                    <div className="pt-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p><p className="font-bold text-indigo-600">Active</p></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<User size={18} />} title="Profil Publik" color="bg-indigo-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-1">Link Halaman Donasi Kamu</label>
                      <div className="flex gap-2">
                        <input readOnly value={`${window.location.origin}/${user.username}`} className="flex-1 bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-5 font-mono text-sm text-indigo-600 font-bold outline-none" />
                        <button onClick={() => copyToClipboard(`${window.location.origin}/${user.username}`)} className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-95"><Copy size={20} /></button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1 italic">*Bagikan link ini di bio Instagram, TikTok, atau deskripsi YouTube kamu.</p>
                    </div>
                    <InputField label="Display Name" defaultValue={user.username} placeholder="Nama di halaman donasi" />
                    <InputField label="Email Address" type="email" defaultValue={user.email} />
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bio Singkat</label>
                      <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none focus:border-indigo-500 h-32 transition-all shadow-sm" placeholder="Ceritakan tentang kontenmu..." />
                    </div>
                    <div className="md:col-span-2">
                      <button onClick={() => updateProfileMutation.mutate({ username: user.username, email: user.email })} disabled={updateProfileMutation.isPending}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                        <Save size={18} />{updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SectionHeader icon={<ShieldCheck size={18} />} title="Keamanan" color="bg-red-500" />
                  <div className="space-y-6 mt-10">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganti Password</p>
                      <input type="password" value={passwordForm.oldPassword} placeholder="Password Lama" className="w-full p-4 bg-blue-600/10 border border-black/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm" onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
                      <input type="password" value={passwordForm.newPassword} placeholder="Password Baru" className="w-full p-4 bg-blue-600/10 border border-black/10 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm" onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <button onClick={() => changePasswordMutation.mutate(passwordForm)} disabled={changePasswordMutation.isPending}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                        <Save size={18} />{changePasswordMutation.isPending ? 'Memproses...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'wallet' && <WithdrawPage />}

          {activeTab === 'admin' && isSuperAdmin && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><AdminWithdrawalPage /></motion.div>
          )}
          {activeTab === 'admin' && !isSuperAdmin && (
            <motion.div key="forbidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-slate-400">
              <p className="text-6xl mb-4">🔒</p>
              <p className="font-black text-xl">Akses Ditolak</p>
              <p className="font-medium text-sm mt-2">Halaman ini hanya untuk Super Admin</p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden" />}
    </div>
  );
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const InputField = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{label}</label>
    <input className="w-full bg-slate-200 border-2 border-slate-50 rounded-2xl p-5 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-sm shadow-sm" {...props} onChange={e => props.onChange?.(e.target.value)} />
  </div>
);

const SectionHeader = ({ icon, title, color }) => (
  <div className="flex items-center gap-4">
    <div className={`${color} p-3 rounded-2xl text-white shadow-lg`}>{icon}</div>
    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
  </div>
);

export default DashboardStreamer; 