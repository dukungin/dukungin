// import { CheckCircle2, Clock, XCircle, ArrowRight, CreditCard, Smartphone, Wallet, RefreshCw } from 'lucide-react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';
// import { motion } from 'framer-motion';
// import { useState } from 'react';

// const BASE_URL = 'https://server-dukungin-production.up.railway.app';
// const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// const fetchProfile   = async () => (await axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })).data;
// const postWithdraw   = async (d) => (await axios.post(`${BASE_URL}/api/midtrans/withdraw`, d, { headers: authHeader() })).data;
// const fetchWDHistory = async ({ page = 1 } = {}) =>
//   (await axios.get(`${BASE_URL}/api/midtrans/withdraw/history?page=${page}&limit=10`, { headers: authHeader() })).data;

// const formatDate = (dateStr) => {
//   if (!dateStr) return '-';
//   return new Date(dateStr).toLocaleString('id-ID', {
//     day: '2-digit', month: 'short', year: 'numeric',
//     hour: '2-digit', minute: '2-digit',
//   });
// };

// const formatRupiah = (num) => {
//   return new Intl.NumberFormat('id-ID').format(Math.round(num));
// };

// const STATUS_CONFIG = {
//   PENDING:   { label: 'Menunggu', icon: <Clock size={13} />, className: 'bg-amber-50 text-amber-600 border border-amber-200' },
//   COMPLETED: { label: 'Berhasil', icon: <CheckCircle2 size={13} />, className: 'bg-green-50 text-green-600 border border-green-200' },
//   FAILED:    { label: 'Ditolak',  icon: <XCircle size={13} />, className: 'bg-red-50 text-red-500 border border-red-200' },
// };

// const MIN_TARIK    = 10000;
// const MAX_TARIK    = 10000000;
// const MIN_SALDO    = 20000;
// const FEE_PERCENT  = 0.025; // 2.5%

// export const WithdrawPage = () => {
//   const queryClient = useQueryClient();
//   const [method, setMethod]     = useState('BANK');
//   const [formData, setFormData] = useState({ 
//     amount: '', 
//     formattedAmount: '', 
//     channelCode: 'BCA', 
//     accountNumber: '', 
//     accountName: '' 
//     });
//   const [historyPage, setHistoryPage] = useState(1);

//   const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile, refetchInterval: 30000 });
//   const balance = parseFloat(profileData?.User?.walletBalance || profileData?.walletBalance || 0);

//   const { data: historyData, isLoading: historyLoading, refetch: refetchHistory, isFetching: historyFetching } = useQuery({
//     queryKey: ['withdrawHistory', historyPage],
//     queryFn: () => fetchWDHistory({ page: historyPage }),
//     keepPreviousData: true,
//     refetchInterval: 30000,
//   });

//   const withdrawals = historyData?.withdrawals || [];
//   const pagination  = historyData?.pagination  || {};

//   // Stats Ringkas
//   const statsPending = withdrawals.filter(w => w.status === 'PENDING').length;
//   const statsCompleted = withdrawals.filter(w => w.status === 'COMPLETED')
//     .reduce((sum, w) => sum + Number(w.amount || 0), 0);
//   const statsFailed = withdrawals.filter(w => w.status === 'FAILED').length;

//   const withdrawMutation = useMutation({
//     mutationFn: postWithdraw,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['profile'] });
//       queryClient.invalidateQueries({ queryKey: ['withdrawHistory'] });
//       setFormData({ 
//         amount: '', 
//         formattedAmount: '', 
//         channelCode: method === 'BANK' ? 'BCA' : method, 
//         accountNumber: '', 
//         accountName: '' 
//       });
//     },
//     onError: (err) => alert(err.response?.data?.message || 'Terjadi kesalahan'),
//   });

//   const amt = parseFloat(formData.amount) || 0;
//   const fee = Math.round(amt * FEE_PERCENT);
//   const totalDeduct = amt;                    // saldo yang dipotong
//   const netAmount = amt - fee;                // yang diterima user

//   const handleSubmit = () => {
//     if (!formData.amount || isNaN(amt) || amt <= 0)
//       return alert('Masukkan nominal yang valid');

//     if (balance < MIN_SALDO)
//       return alert(`Saldo minimum untuk penarikan adalah Rp ${formatRupiah(MIN_SALDO)}`);

//     if (amt < MIN_TARIK)
//       return alert(`Minimal penarikan adalah Rp ${formatRupiah(MIN_TARIK)}`);

//     if (amt > MAX_TARIK)
//       return alert(`Maksimal penarikan adalah Rp ${formatRupiah(MAX_TARIK)} per transaksi`);

//     if (totalDeduct > balance)
//       return alert(`Saldo tidak mencukupi. Total yang dibutuhkan Rp ${formatRupiah(totalDeduct)} (termasuk fee 2.5%)`);

//     if (!formData.accountNumber || !formData.accountName)
//       return alert('Lengkapi data rekening / e-wallet');

//     withdrawMutation.mutate({ ...formData, paymentMethod: method });
//   };

//   const canSubmit = balance >= MIN_SALDO && amt >= MIN_TARIK;

//   return (
//     <motion.div className="w-full mx-auto space-y-5 pb-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

//       {/* ── Balance Card ── */}
//       <div className="bg-indigo-600 py-7 rounded-xl p-6 text-white relative overflow-hidden">
//         <div className="absolute top-0 right-0 p-12 opacity-10"><Wallet size={120} /></div>
//         <div className="relative z-[2]">
//           <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
//           <h1 className="text-3xl font-black">Rp {balance.toLocaleString('id-ID')}</h1>
//           <p className="text-indigo-200 text-xs font-medium mt-2">
//             Penarikan diproses manual oleh admin dalam 1×24 jam hari kerja
//           </p>
//         </div>
//         <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-90" />
//         <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[130px] w-[7%] rotate-25 opacity-90" />
//       </div>

//       {/* ── Banner saldo tidak cukup ── */}
//       {balance < MIN_SALDO && (
//         <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
//           <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
//           <div>
//             <p className="font-black text-amber-700 text-sm">Saldo belum mencukupi untuk penarikan</p>
//             <p className="text-[11px] text-amber-600 font-medium mt-0.5">
//               Kamu perlu minimal saldo <strong>Rp {MIN_SALDO.toLocaleString('id-ID')}</strong> untuk mengajukan penarikan.
//               Saldo kamu saat ini: <strong>Rp {balance.toLocaleString('id-ID')}</strong>
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ── Stats ringkas ── */}
//       {withdrawals.length > 0 && (
//         <div className="grid grid-cols-3 gap-3">
//           {[
//             { 
//               label: 'Menunggu', 
//               value: statsPending, 
//               unit: 'request', 
//               color: 'text-amber-600', 
//               bg: 'bg-amber-100 border-amber-100' 
//             },
//             { 
//               label: 'Berhasil', 
//               value: `Rp ${statsCompleted.toLocaleString('id-ID')}`, 
//               unit: '', 
//               color: 'text-green-600', 
//               bg: 'bg-green-100 border-green-100' 
//             },
//             { 
//               label: 'Ditolak', 
//               value: statsFailed, 
//               unit: 'request', 
//               color: 'text-red-500',   
//               bg: 'bg-red-100 border-red-100'     
//             },
//           ].map(s => (
//             <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
//               <p className={`font-black text-sm ${s.color}`}>{s.value} <span className="text-xs font-bold">{s.unit}</span></p>
//               <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ── Form Penarikan ── */}
//       <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-100">
//         <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
//           <CreditCard className="text-indigo-600" size={20} /> Ajukan Penarikan Dana
//         </h2>

//         {/* Aturan singkat */}
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
//           {[
//             { label: 'Min. Tarik',   value: `Rp ${MIN_TARIK.toLocaleString('id-ID')}`  },
//             { label: 'Maks. Tarik',  value: `Rp ${(MAX_TARIK/1000000).toFixed(0)}jt`   },
//           ].map(r => (
//             <div key={r.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
//               <p className="font-black text-indigo-600 text-sm">{r.value}</p>
//               <p className="text-[10px] text-slate-400 font-bold mt-0.5">{r.label}</p>
//             </div>
//           ))}
//         </div>

//         {/* Method selector */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
//           {[
//             { id: 'BANK',  label: 'Transfer Bank',  icon: <CreditCard size={18} /> },
//             { id: 'DANA',  label: 'E-Wallet DANA',  icon: <Smartphone size={18} /> },
//             { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18} /> },
//           ].map(m => (
//             <button key={m.id}
//               onClick={() => { setMethod(m.id); setFormData({ ...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id }); }}
//               className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-black text-sm ${method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
//               {m.icon} {m.label}
//             </button>
//           ))}
//         </div>

//         <div className="space-y-5">
//           {/* Bank & nomor rekening */}
//           <div className={`grid grid-cols-1 ${method === 'BANK' ? 'md:grid-cols-2' : ''} gap-5`}>
//             {method === 'BANK' && (
//               <div className="flex flex-col gap-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Bank</label>
//                 <select
//                   className="w-full px-5 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
//                   value={formData.channelCode}
//                   onChange={e => setFormData({ ...formData, channelCode: e.target.value })}>
//                   <option value="BCA">BCA (Bank Central Asia)</option>
//                   <option value="BNI">BNI (Bank Negara Indonesia)</option>
//                   <option value="MANDIRI">Mandiri</option>
//                   <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
//                   <option value="BSI">BSI (Bank Syariah Indonesia)</option>
//                 </select>
//               </div>
//             )}
//             <div className="flex flex-col gap-2">
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                 {method === 'BANK' ? 'Nomor Rekening' : 'Nomor Handphone'}
//               </label>
//               <input
//                 value={formData.accountNumber}
//                 placeholder={method === 'BANK' ? '0000000000000' : '08xx-xxxx-xxxx'}
//                 className="w-full px-5 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
//                 onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} />
//             </div>
//           </div>

//           {/* Nama pemilik */}
//           <div className="flex flex-col gap-2">
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap Pemilik Akun</label>
//             <input
//               value={formData.accountName}
//               placeholder="Sesuaikan dengan Buku Tabungan / Nama di App"
//               className="w-full px-5 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
//               onChange={e => setFormData({ ...formData, accountName: e.target.value })} />
//           </div>

//           {/* Nominal */}
//           <div className="flex flex-col gap-2">
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                 Nominal Penarikan (Rp)
//             </label>
            
//             <div className="relative">
//                 <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                
//                 <input
//                 type="text"
//                 value={formData.formattedAmount || ''}
//                 placeholder="0"
//                 className="w-full px-6 py-4 pl-14 bg-slate-900 text-white rounded-xl font-bold text-xl outline-none focus:ring-4 ring-indigo-100 transition-all"
//                 onChange={(e) => {
//                     let value = e.target.value.replace(/[^0-9]/g, '');
                    
//                     if (value === '') {
//                     setFormData(prev => ({ ...prev, amount: '', formattedAmount: '' }));
//                     return;
//                     }

//                     const numericValue = parseInt(value, 10);

//                     setFormData(prev => ({
//                     ...prev,
//                     amount: numericValue.toString(),
//                     formattedAmount: numericValue.toLocaleString('id-ID')
//                     }));
//                 }}
//                 />
//             </div>

//             {/* Realtime Calculation - Sudah disesuaikan */}
//             {amt > 0 && (
//                 <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-sm">
//                 <div className="flex justify-between">
//                     <span className="text-slate-500">Nominal yang diajukan</span>
//                     <span className="font-black">Rp {formatRupiah(amt)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                     <span className="text-slate-500">Biaya admin (2.5%)</span>
//                     <span className="font-bold text-red-400">- Rp {formatRupiah(fee)}</span>
//                 </div>
//                 <div className="border-t border-slate-200 pt-2 flex justify-between text-emerald-500">
//                     <span>Yang kamu terima</span>
//                     <span>Rp {formatRupiah(amt - fee)}</span>
//                 </div>
//                 <div className="flex justify-between text-xs pt-1">
//                     <span className="text-slate-400">Saldo yang dipotong</span>
//                     <span className="text-slate-600">Rp {formatRupiah(amt)}</span>
//                 </div>
//                 </div>
//             )}
//             </div>

//           {/* Tombol Submit */}
//           <button
//             onClick={handleSubmit}
//             disabled={withdrawMutation.isPending || !canSubmit}
//             className="cursor-pointer active:scale-[0.98] hover:brightness-90 w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
//             {withdrawMutation.isPending ? (
//               <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
//             ) : (
//               <><ArrowRight size={18} /> Ajukan Penarikan Dana</>
//             )}
//           </button>

//           {/* Sukses notice */}
//           {withdrawMutation.isSuccess && (
//             <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
//               <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
//               <div>
//                 <p className="font-black text-green-700 text-sm">Pengajuan berhasil dikirim!</p>
//                 <p className="text-[11px] text-green-600 font-medium">Admin akan memproses dalam 1×24 jam hari kerja. Pantau status di riwayat di bawah.</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Riwayat Withdrawal ── */}
//       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
//         <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
//           <div>
//             <p className="font-black text-slate-800">Riwayat Penarikan</p>
//             <p className="text-[10px] text-slate-400 font-medium mt-0.5">{pagination.total || 0} total request</p>
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="text-[10px] text-slate-400 font-bold">Auto 30s</span>
//             <button onClick={() => refetchHistory()} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
//               <RefreshCw size={14} className={historyFetching ? 'animate-spin' : ''} />
//             </button>
//           </div>
//         </div>

//         {historyLoading
//           ? (
//             <div className="flex items-center justify-center py-16 text-slate-400 font-bold gap-3">
//               <div className="w-5 h-5 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /> Memuat riwayat...
//             </div>
//           )
//           : withdrawals.length === 0
//             ? (
//               <div className="py-16 text-center text-slate-400">
//                 <p className="text-4xl mb-3">💸</p>
//                 <p className="font-black text-slate-500">Belum ada riwayat penarikan</p>
//                 <p className="text-sm font-medium mt-1">Ajukan penarikan pertamamu di atas</p>
//               </div>
//             )
//             : (
//               <>
//                 {/* Mobile cards */}
//                 <div className="md:hidden divide-y divide-slate-50">
//                   {withdrawals.map(wd => {
//                     const cfg = STATUS_CONFIG[wd.status] || STATUS_CONFIG.PENDING;
//                     return (
//                       <div key={wd._id} className="p-5 space-y-3">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="font-black text-slate-800 text-sm">Rp {Number(wd.amount).toLocaleString('id-ID')}</p>
//                             <p className="text-[10px] text-slate-400 font-medium mt-0.5">{wd.channelCode} • {wd.accountNumber}</p>
//                           </div>
//                           <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.className}`}>
//                             {cfg.icon} {cfg.label}
//                           </span>
//                         </div>
//                         <div className="flex justify-between text-[10px] text-slate-400 font-medium">
//                           <span>{wd.accountName}</span>
//                           <span>{formatDate(wd.createdAt)}</span>
//                         </div>
//                         {wd.status === 'FAILED' && wd.note && (
//                           <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
//                             <p className="text-[11px] text-red-600 font-bold">Alasan penolakan: {wd.note}</p>
//                           </div>
//                         )}
//                         {wd.status === 'PENDING' && (
//                           <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
//                             <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
//                             <p className="text-[11px] text-amber-600 font-bold">Menunggu diproses admin</p>
//                           </div>
//                         )}
//                         {wd.status === 'COMPLETED' && (
//                           <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
//                             <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
//                             <p className="text-[11px] text-green-600 font-bold">Dana telah ditransfer oleh admin</p>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {/* Desktop table */}
//                 <div className="hidden md:block overflow-x-auto">
//                   <table className="w-full text-left min-w-[700px]">
//                     <thead>
//                       <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
//                         <th className="px-6 py-4">Nominal</th>
//                         <th className="px-6 py-4">Metode</th>
//                         <th className="px-6 py-4">No. Rekening</th>
//                         <th className="px-6 py-4">Nama</th>
//                         <th className="px-6 py-4 text-center">Status</th>
//                         <th className="px-6 py-4">Waktu Pengajuan</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                       {withdrawals.map(wd => {
//                         const cfg = STATUS_CONFIG[wd.status] || STATUS_CONFIG.PENDING;
//                         return (
//                           <tr key={wd._id} className="hover:bg-slate-50/70 transition-all">
//                             <td className="px-6 py-5">
//                               <p className="font-black text-slate-800">Rp {Number(wd.amount).toLocaleString('id-ID')}</p>
//                               <p className="text-[10px] text-slate-400 font-medium">Fee 2.5%</p>
//                             </td>
//                             <td className="px-6 py-5">
//                               <p className="font-bold text-slate-600 text-sm">{wd.paymentMethod || 'BANK'}</p>
//                               <p className="text-[10px] text-slate-400 font-medium">{wd.channelCode}</p>
//                             </td>
//                             <td className="px-6 py-5">
//                               <p className="font-mono font-bold text-slate-600 text-sm">{wd.accountNumber}</p>
//                             </td>
//                             <td className="px-6 py-5">
//                               <p className="font-bold text-slate-600 text-sm">{wd.accountName}</p>
//                             </td>
//                             <td className="px-6 py-5">
//                               <div className="flex flex-col items-center gap-1.5">
//                                 <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.className}`}>
//                                   {cfg.icon} {cfg.label}
//                                 </span>
//                                 {wd.status === 'PENDING' && (
//                                   <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
//                                   </span>
//                                 )}
//                                 {wd.status === 'FAILED' && wd.note && (
//                                   <span className="text-[9px] text-red-400 font-medium max-w-[140px] text-center leading-tight">
//                                     {wd.note}
//                                   </span>
//                                 )}
//                                 {wd.status === 'COMPLETED' && (
//                                   <span className="text-[9px] text-green-500 font-bold">Dana sudah dikirim</span>
//                                 )}
//                               </div>
//                             </td>
//                             <td className="px-6 py-5">
//                               <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{formatDate(wd.createdAt)}</p>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Pagination */}
//                 {pagination.totalPages > 1 && (
//                   <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
//                     <button
//                       onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
//                       disabled={historyPage === 1}
//                       className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
//                       ← Sebelumnya
//                     </button>
//                     <span className="text-xs font-bold text-slate-400">
//                       Halaman <span className="text-indigo-600 font-black">{historyPage}</span> dari {pagination.totalPages}
//                     </span>
//                     <button
//                       onClick={() => setHistoryPage(p => Math.min(pagination.totalPages, p + 1))}
//                       disabled={historyPage === pagination.totalPages}
//                       className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
//                       Berikutnya →
//                     </button>
//                   </div>
//                 )}
//               </>
//             )
//         }
//       </div>
//     </motion.div>
//   );
// };

import { CheckCircle2, Clock, XCircle, ArrowRight, CreditCard, Smartphone, Wallet, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useState } from 'react';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const fetchProfile   = async () => (await axios.get(`${BASE_URL}/api/overlay/settings`, { headers: authHeader() })).data;
const postWithdraw   = async (d) => (await axios.post(`${BASE_URL}/api/midtrans/withdraw`, d, { headers: authHeader() })).data;
const fetchWDHistory = async ({ page = 1 } = {}) =>
  (await axios.get(`${BASE_URL}/api/midtrans/withdraw/history?page=${page}&limit=10`, { headers: authHeader() })).data;

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatRupiah = (num) => new Intl.NumberFormat('id-ID').format(Math.round(num));

const STATUS_CONFIG = {
  PENDING:   { label: 'Menunggu', icon: <Clock size={13} />,       className: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  COMPLETED: { label: 'Berhasil', icon: <CheckCircle2 size={13} />, className: 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800' },
  FAILED:    { label: 'Ditolak',  icon: <XCircle size={13} />,      className: 'bg-red-50 text-red-500 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' },
};

const MIN_TARIK   = 10000;
const MAX_TARIK   = 10000000;
const MIN_SALDO   = 20000;
const FEE_PERCENT = 0.025;

export const WithdrawPage = () => {
  const queryClient = useQueryClient();
  const [method, setMethod]     = useState('BANK');
  const [formData, setFormData] = useState({
    amount: '', formattedAmount: '', channelCode: 'BCA', accountNumber: '', accountName: '',
  });
  const [historyPage, setHistoryPage] = useState(1);

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile, refetchInterval: 30000 });
  const balance = parseFloat(profileData?.User?.walletBalance || profileData?.walletBalance || 0);

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory, isFetching: historyFetching } = useQuery({
    queryKey: ['withdrawHistory', historyPage],
    queryFn: () => fetchWDHistory({ page: historyPage }),
    keepPreviousData: true,
    refetchInterval: 30000,
  });

  const withdrawals = historyData?.withdrawals || [];
  const pagination  = historyData?.pagination  || {};

  const statsPending   = withdrawals.filter(w => w.status === 'PENDING').length;
  const statsCompleted = withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + Number(w.amount || 0), 0);
  const statsFailed    = withdrawals.filter(w => w.status === 'FAILED').length;

  const withdrawMutation = useMutation({
    mutationFn: postWithdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawHistory'] });
      setFormData({ amount: '', formattedAmount: '', channelCode: method === 'BANK' ? 'BCA' : method, accountNumber: '', accountName: '' });
    },
    onError: (err) => alert(err.response?.data?.message || 'Terjadi kesalahan'),
  });

  const amt        = parseFloat(formData.amount) || 0;
  const fee        = Math.round(amt * FEE_PERCENT);

  const handleSubmit = () => {
    if (!formData.amount || isNaN(amt) || amt <= 0) return alert('Masukkan nominal yang valid');
    if (balance < MIN_SALDO)      return alert(`Saldo minimum untuk penarikan adalah Rp ${formatRupiah(MIN_SALDO)}`);
    if (amt < MIN_TARIK)          return alert(`Minimal penarikan adalah Rp ${formatRupiah(MIN_TARIK)}`);
    if (amt > MAX_TARIK)          return alert(`Maksimal penarikan adalah Rp ${formatRupiah(MAX_TARIK)} per transaksi`);
    if (amt > balance)            return alert(`Saldo tidak mencukupi. Total yang dibutuhkan Rp ${formatRupiah(amt)} (termasuk fee 2.5%)`);
    if (!formData.accountNumber || !formData.accountName) return alert('Lengkapi data rekening / e-wallet');
    withdrawMutation.mutate({ ...formData, paymentMethod: method });
  };

  const canSubmit = balance >= MIN_SALDO && amt >= MIN_TARIK;

  return (
    <motion.div className="w-full mx-auto space-y-5 pb-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

      {/* ── Balance Card ── */}
      <div className="bg-indigo-600 py-7 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Wallet size={120} /></div>
        <div className="relative z-[2]">
          <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Total Saldo Bisa Ditarik</p>
          <h1 className="text-3xl font-black">Rp {balance.toLocaleString('id-ID')}</h1>
          <p className="text-indigo-200 text-xs font-medium mt-2">
            Penarikan diproses manual oleh admin dalam 1×24 jam hari kerja
          </p>
        </div>
        <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[-40px] w-[17%] -rotate-25 opacity-90" />
        <img src="/jellyfish.png" alt="icon" className="absolute top-3 right-[130px] w-[7%] rotate-25 opacity-90" />
      </div>

      {/* ── Banner saldo tidak cukup ── */}
      {balance < MIN_SALDO && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="font-black text-amber-700 dark:text-amber-400 text-sm">Saldo belum mencukupi untuk penarikan</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-500 font-medium mt-0.5">
              Kamu perlu minimal saldo <strong>Rp {MIN_SALDO.toLocaleString('id-ID')}</strong> untuk mengajukan penarikan.
              Saldo kamu saat ini: <strong>Rp {balance.toLocaleString('id-ID')}</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── Stats ringkas ── */}
      {withdrawals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Menunggu', value: statsPending,    unit: 'request', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900' },
            { label: 'Berhasil', value: `Rp ${statsCompleted.toLocaleString('id-ID')}`, unit: '', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/30 border-green-100 dark:border-green-900' },
            { label: 'Ditolak',  value: statsFailed,     unit: 'request', color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-100 dark:bg-red-950/30 border-red-100 dark:border-red-900'       },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
              <p className={`font-black text-sm ${s.color}`}>{s.value} <span className="text-xs font-bold">{s.unit}</span></p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Form Penarikan ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <CreditCard className="text-indigo-600" size={20} /> Ajukan Penarikan Dana
        </h2>

        {/* Aturan singkat */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          {[
            { label: 'Min. Tarik',  value: `Rp ${MIN_TARIK.toLocaleString('id-ID')}` },
            { label: 'Maks. Tarik', value: `Rp ${(MAX_TARIK / 1000000).toFixed(0)}jt` },
          ].map(r => (
            <div key={r.label} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center">
              <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{r.value}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>

        {/* Method selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {[
            { id: 'BANK',  label: 'Transfer Bank',  icon: <CreditCard size={18} /> },
            { id: 'DANA',  label: 'E-Wallet DANA',  icon: <Smartphone size={18} /> },
            { id: 'GOPAY', label: 'E-Wallet GOPAY', icon: <Smartphone size={18} /> },
          ].map(m => (
            <button key={m.id}
              onClick={() => { setMethod(m.id); setFormData({ ...formData, channelCode: m.id === 'BANK' ? 'BCA' : m.id }); }}
              className={`cursor-pointer active:scale-[0.97] flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-black text-sm ${
                method === m.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-50 dark:shadow-none'
                  : 'border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-600'
              }`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {/* Bank & nomor rekening */}
          <div className={`grid grid-cols-1 ${method === 'BANK' ? 'md:grid-cols-2' : ''} gap-5`}>
            {method === 'BANK' && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pilih Bank</label>
                <select
                  className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                  value={formData.channelCode}
                  onChange={e => setFormData({ ...formData, channelCode: e.target.value })}>
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="MANDIRI">Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                </select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {method === 'BANK' ? 'Nomor Rekening' : 'Nomor Handphone'}
              </label>
              <input
                value={formData.accountNumber}
                placeholder={method === 'BANK' ? '0000000000000' : '08xx-xxxx-xxxx'}
                className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} />
            </div>
          </div>

          {/* Nama pemilik */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nama Lengkap Pemilik Akun</label>
            <input
              value={formData.accountName}
              placeholder="Sesuaikan dengan Buku Tabungan / Nama di App"
              className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              onChange={e => setFormData({ ...formData, accountName: e.target.value })} />
          </div>

          {/* Nominal */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nominal Penarikan (Rp)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 dark:text-slate-500">Rp</span>
              <input
                type="text"
                value={formData.formattedAmount || ''}
                placeholder="0"
                className="w-full px-6 py-4 pl-14 bg-slate-900 dark:bg-slate-950 text-white rounded-xl font-bold text-xl outline-none focus:ring-4 ring-indigo-100 dark:ring-indigo-900 transition-all placeholder:text-slate-600"
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') { setFormData(prev => ({ ...prev, amount: '', formattedAmount: '' })); return; }
                  const numericValue = parseInt(value, 10);
                  setFormData(prev => ({ ...prev, amount: numericValue.toString(), formattedAmount: numericValue.toLocaleString('id-ID') }));
                }}
              />
            </div>

            {/* Realtime Calculation */}
            {amt > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Nominal yang diajukan</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">Rp {formatRupiah(amt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Biaya admin (2.5%)</span>
                  <span className="font-bold text-red-400">- Rp {formatRupiah(fee)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-emerald-500 dark:text-emerald-400">
                  <span>Yang kamu terima</span>
                  <span>Rp {formatRupiah(amt - fee)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-400 dark:text-slate-500">Saldo yang dipotong</span>
                  <span className="text-slate-600 dark:text-slate-300">Rp {formatRupiah(amt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tombol Submit */}
          <button
            onClick={handleSubmit}
            disabled={withdrawMutation.isPending || !canSubmit}
            className="cursor-pointer active:scale-[0.98] hover:brightness-90 w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
            {withdrawMutation.isPending ? (
              <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
            ) : (
              <><ArrowRight size={18} /> Ajukan Penarikan Dana</>
            )}
          </button>

          {/* Sukses notice */}
          {withdrawMutation.isSuccess && (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4">
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="font-black text-green-700 dark:text-green-400 text-sm">Pengajuan berhasil dikirim!</p>
                <p className="text-[11px] text-green-600 dark:text-green-500 font-medium">Admin akan memproses dalam 1×24 jam hari kerja. Pantau status di riwayat di bawah.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Riwayat Withdrawal ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-black text-slate-800 dark:text-slate-100">Riwayat Penarikan</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{pagination.total || 0} total request</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Auto 30s</span>
            <button onClick={() => refetchHistory()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              <RefreshCw size={14} className={historyFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500 font-bold gap-3">
            <div className="w-5 h-5 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin" /> Memuat riwayat...
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-black text-slate-500 dark:text-slate-400">Belum ada riwayat penarikan</p>
            <p className="text-sm font-medium mt-1 text-slate-400 dark:text-slate-500">Ajukan penarikan pertamamu di atas</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-50 dark:divide-slate-800">
              {withdrawals.map(wd => {
                const cfg = STATUS_CONFIG[wd.status] || STATUS_CONFIG.PENDING;
                return (
                  <div key={wd._id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">Rp {Number(wd.amount).toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{wd.channelCode} • {wd.accountNumber}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.className}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      <span>{wd.accountName}</span>
                      <span>{formatDate(wd.createdAt)}</span>
                    </div>
                    {wd.status === 'FAILED' && wd.note && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl px-4 py-2.5">
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold">Alasan penolakan: {wd.note}</p>
                      </div>
                    )}
                    {wd.status === 'PENDING' && (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl px-4 py-2.5">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Menunggu diproses admin</p>
                      </div>
                    )}
                    {wd.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-xl px-4 py-2.5">
                        <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                        <p className="text-[11px] text-green-600 dark:text-green-400 font-bold">Dana telah ditransfer oleh admin</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Metode</th>
                    <th className="px-6 py-4">No. Rekening</th>
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Waktu Pengajuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {withdrawals.map(wd => {
                    const cfg = STATUS_CONFIG[wd.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr key={wd._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-all">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-800 dark:text-slate-100">Rp {Number(wd.amount).toLocaleString('id-ID')}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Fee 2.5%</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">{wd.paymentMethod || 'BANK'}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{wd.channelCode}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-mono font-bold text-slate-600 dark:text-slate-300 text-sm">{wd.accountNumber}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">{wd.accountName}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.className}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                            {wd.status === 'FAILED' && wd.note && (
                              <span className="text-[9px] text-red-400 dark:text-red-500 font-medium max-w-[140px] text-center leading-tight">{wd.note}</span>
                            )}
                            {wd.status === 'COMPLETED' && (
                              <span className="text-[9px] text-green-500 dark:text-green-400 font-bold">Dana sudah dikirim</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">{formatDate(wd.createdAt)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Sebelumnya
                </button>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Halaman <span className="text-indigo-600 dark:text-indigo-400 font-black">{historyPage}</span> dari {pagination.totalPages}
                </span>
                <button
                  onClick={() => setHistoryPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={historyPage === pagination.totalPages}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Berikutnya →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};