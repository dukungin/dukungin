// import axios from 'axios';
// import { AnimatePresence, motion } from 'framer-motion';
// import { ImageIcon, Loader2, Video, X } from 'lucide-react';
// import { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';

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

// // ============================================================
// // HELPER — cek apakah URL adalah video
// // ============================================================
// const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

// // ============================================================
// // HELPER — format rupiah singkat
// // ============================================================
// const formatRp = (n) => {
//   if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}jt`;
//   if (n >= 1000) return `${n / 1000}K`;
//   return String(n);
// };

// // ============================================================
// // HELPER — cari eligible media trigger dari amount
// // ============================================================
// const getEligibleTrigger = (mediaTriggers = [], amount) => {
//   if (!mediaTriggers.length || !amount) return null;
//   const eligible = mediaTriggers
//     .filter((t) => Number(amount) >= t.minAmount)
//     .sort((a, b) => b.minAmount - a.minAmount);
//   return eligible[0] || null;
// };

// // ============================================================
// // SUB-COMPONENT — Media Input Section
// // ============================================================
// const MediaInputSection = ({ trigger, mediaUrl, setMediaUrl }) => {
//   const [previewError, setPreviewError] = useState(false);
//   const videoRef = useRef(null);

//   useEffect(() => {
//     setPreviewError(false);
//   }, [mediaUrl]);

//   const hasPreview = mediaUrl && !previewError;
//   const isVid = isVideoUrl(mediaUrl);

//   // Tentukan tipe input yang diizinkan berdasarkan trigger.mediaType
//   const allowImage = trigger.mediaType === 'image' || trigger.mediaType === 'both';
//   const allowVideo = trigger.mediaType === 'video' || trigger.mediaType === 'both';

//   const placeholderText =
//     trigger.mediaType === 'image'
//       ? 'https://i.imgur.com/contoh-gambar.jpg'
//       : trigger.mediaType === 'video'
//       ? 'https://example.com/video.mp4'
//       : 'https://i.imgur.com/sultan-alert.gif';

//   return (
//     <motion.div
//       initial={{ opacity: 0, height: 0, marginTop: 0 }}
//       animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
//       exit={{ opacity: 0, height: 0, marginTop: 0 }}
//       transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
//       className="overflow-hidden"
//     >
//       <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-5 space-y-4">

//         {/* Badge unlock */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
//               {allowVideo && allowImage ? (
//                 <span className="flex items-center gap-0.5">
//                   <ImageIcon size={9} /><Video size={9} />
//                 </span>
//               ) : allowVideo ? (
//                 <Video size={13} />
//               ) : (
//                 <ImageIcon size={13} />
//               )}
//             </div>
//             <div>
//               <p className="text-xs font-black text-indigo-700 leading-none">
//                 🎉 {trigger.label || 'Media Alert'} Unlocked!
//               </p>
//               <p className="text-[10px] text-indigo-400 font-medium mt-0.5">
//                 Tersedia mulai Rp {Number(trigger.minAmount).toLocaleString('id-ID')}
//               </p>
//             </div>
//           </div>
//           {mediaUrl && (
//             <button
//               onClick={() => setMediaUrl('')}
//               className="w-6 h-6 rounded-full bg-indigo-100 hover:bg-red-100 hover:text-red-500 text-indigo-400 flex items-center justify-center transition-all"
//             >
//               <X size={12} />
//             </button>
//           )}
//         </div>

//         {/* Keterangan tipe media yang diizinkan */}
//         <div className="flex items-center gap-2">
//           {allowImage && (
//             <span className="flex items-center gap-1 px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-600">
//               <ImageIcon size={10} /> Gambar (jpg, gif, png, webp)
//             </span>
//           )}
//           {allowVideo && (
//             <span className="flex items-center gap-1 px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-purple-600">
//               <Video size={10} /> Video (mp4, webm, mov)
//             </span>
//           )}
//         </div>

//         {/* Input URL */}
//         <div className="space-y-1.5">
//           <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
//             {allowImage && allowVideo
//               ? 'Link Gambar / GIF / Video'
//               : allowVideo
//               ? 'Link Video'
//               : 'Link Gambar / GIF'}
//           </label>
//           <input
//             type="url"
//             value={mediaUrl}
//             onChange={(e) => setMediaUrl(e.target.value)}
//             className="w-full p-4 rounded-xl bg-white border-2 border-indigo-100 focus:border-indigo-400 outline-none font-mono text-xs text-slate-700 font-bold transition-all placeholder:font-sans placeholder:text-slate-400 placeholder:font-normal"
//             placeholder={placeholderText}
//           />
//           <p className="text-[10px] text-slate-400 font-medium ml-1">
//             * Opsional —{' '}
//             {allowImage && allowVideo
//               ? 'gambar (.jpg .gif .png .webp) atau video (.mp4 .webm .mov)'
//               : allowVideo
//               ? 'video (.mp4 .webm .mov)'
//               : 'gambar (.jpg .gif .png .webp)'}{' '}
//             yang tampil di layar streamer saat donasimu masuk
//           </p>
//         </div>

//         {/* Preview */}
//         <AnimatePresence>
//           {hasPreview && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.96 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.96 }}
//               transition={{ duration: 0.25 }}
//               className="rounded-xl overflow-hidden border border-indigo-100 bg-slate-900 relative"
//               style={{ maxHeight: 180 }}
//             >
//               {isVid ? (
//                 <video
//                   ref={videoRef}
//                   src={mediaUrl}
//                   autoPlay
//                   muted
//                   loop
//                   playsInline
//                   className="w-full object-cover"
//                   style={{ maxHeight: 180 }}
//                   onError={() => setPreviewError(true)}
//                 />
//               ) : (
//                 <img
//                   src={mediaUrl}
//                   alt="Media preview"
//                   className="w-full object-cover"
//                   style={{ maxHeight: 180 }}
//                   onError={() => setPreviewError(true)}
//                 />
//               )}
//               <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/50 backdrop-blur-sm">
//                 <p className="text-[10px] text-white/80 font-bold">
//                   {isVid ? '🎬 Video' : '🖼️ Gambar'} — Preview
//                 </p>
//               </div>
//             </motion.div>
//           )}

//           {previewError && mediaUrl && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-500 font-bold flex items-center gap-2"
//             >
//               <X size={14} /> URL tidak valid atau media tidak dapat dimuat. Pastikan URL langsung ke file media.
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </motion.div>
//   );
// };

// // ============================================================
// // MAIN — SupporterPage
// // ============================================================
// const SupporterPage = () => {
//   const { username } = useParams();
//   const [streamer, setStreamer] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [snapReady, setSnapReady] = useState(false);
//   const [mediaUrl, setMediaUrl] = useState('');

//   const [form, setForm] = useState({
//     donorName: '',
//     isAnonymous: false,
//     email: '',
//     amount: 0,
//     message: '',
//   });

//   // ── Load Midtrans Snap.js ──────────────────────────────────
//   useEffect(() => {
//     const existing = document.querySelector('script[src*="snap.js"]');
//     if (existing) { setSnapReady(true); return; }
//     const script = document.createElement('script');
//     script.src = SNAP_URL;
//     script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
//     script.onload = () => setSnapReady(true);
//     document.head.appendChild(script);
//   }, []);

//   // ── Fetch streamer profile ─────────────────────────────────
//   useEffect(() => {
//     if (!username) return;
//     const cleanUsername = username.replace(/^@+/, '');
//     axios
//       .get(`${import.meta.env.VITE_API_URL}/api/overlay/public/${cleanUsername}`)
//       .then((res) => setStreamer(res.data))
//       .catch(() => alert('Streamer tidak ditemukan'));
//   }, [username]);

//   // ── Derived — eligible media trigger ──────────────────────
//   // Ambil mediaTriggers dari overlaySetting (sesuai struktur getPublicProfile)
//   const mediaTriggers = streamer?.overlaySetting?.mediaTriggers
//     || streamer?.OverlaySetting?.mediaTriggers
//     || [];

//   const eligibleTrigger = getEligibleTrigger(mediaTriggers, form.amount);

//   // Reset mediaUrl kalau trigger hilang (nominal turun)
//   useEffect(() => {
//     if (!eligibleTrigger) setMediaUrl('');
//   }, [eligibleTrigger]);

//   // ── Handle donate ──────────────────────────────────────────
//   const handleDonate = async () => {
//     if (!form.amount || form.amount < 1000) return alert('Minimal donasi Rp 1.000');
//     if (!streamer?._id) return alert('Data streamer belum siap.');

//     const minDonate = streamer?.overlaySetting?.minDonate
//       || streamer?.OverlaySetting?.minDonate
//       || 1000;
//     const maxDonate = streamer?.overlaySetting?.maxDonate
//       || streamer?.OverlaySetting?.maxDonate
//       || 10000000;

//     if (form.amount < minDonate)
//       return alert(`Minimal donasi untuk streamer ini adalah Rp ${minDonate.toLocaleString('id-ID')}`);
//     if (form.amount > maxDonate)
//       return alert(`Maksimal donasi untuk streamer ini adalah Rp ${maxDonate.toLocaleString('id-ID')}`);

//     try {
//       setLoading(true);

//       // Tentukan mediaType berdasarkan URL yang diinput donor
//       const hasMedia = eligibleTrigger && mediaUrl.trim();
//       const detectedMediaType = hasMedia
//         ? (isVideoUrl(mediaUrl.trim()) ? 'video' : 'image')
//         : null;

//       // Validasi: jika trigger hanya izinkan image tapi donor input video (atau sebaliknya)
//       if (hasMedia && eligibleTrigger.mediaType === 'image' && isVideoUrl(mediaUrl.trim())) {
//         return alert('Streamer ini hanya mengizinkan gambar (bukan video) untuk nominal ini.');
//       }
//       if (hasMedia && eligibleTrigger.mediaType === 'video' && !isVideoUrl(mediaUrl.trim())) {
//         return alert('Streamer ini hanya mengizinkan video (bukan gambar) untuk nominal ini.');
//       }

//       const payload = {
//         amount: Math.round(Number(form.amount)),
//         donorName: form.isAnonymous ? 'Anonim' : form.donorName || 'Anonim',
//         message: form.message,
//         userId: streamer._id,
//         email: form.email.trim() || 'guest@mail.com',
//         // Media dari donor — hanya kirim kalau ada trigger yang cocok dan URL diisi
//         mediaUrl: hasMedia ? mediaUrl.trim() : null,
//         mediaType: detectedMediaType,
//       };

//       const res = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/midtrans/create-invoice`,
//         payload
//       );

//       if (res.data.token) {
//         localStorage.setItem('midtrans_pending_token', res.data.token);
//         localStorage.setItem('midtrans_pending_username', streamer.username);
//         localStorage.setItem('midtrans_pending_url', res.data.url || '');
//       }

//       if (res.data.token && snapReady && window.snap) {
//         window.snap.pay(res.data.token, {
//           onSuccess: () => {
//             localStorage.removeItem('midtrans_pending_token');
//             localStorage.removeItem('midtrans_pending_username');
//             localStorage.removeItem('midtrans_pending_url');
//             window.location.href = `/donation/success?username=${streamer.username}`;
//           },
//           onPending: () => {
//             window.location.href = `/donation/pending?username=${streamer.username}`;
//           },
//           onError: () => {
//             localStorage.removeItem('midtrans_pending_token');
//             localStorage.removeItem('midtrans_pending_username');
//             localStorage.removeItem('midtrans_pending_url');
//             alert('Pembayaran gagal. Silakan coba lagi.');
//           },
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

//   // ── Loading state ──────────────────────────────────────────
//   if (!streamer) {
//     return (
//       <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600 bg-blue-50">
//         <Loader2 className="animate-spin mr-2" /> Memuat Profil...
//       </div>
//     );
//   }

//   const overlaySetting = streamer?.overlaySetting || streamer?.OverlaySetting || {};
//   const minDonate = overlaySetting?.minDonate || 1000;
//   const maxDonate = overlaySetting?.maxDonate || 10000000;

//   // Quick amount presets — ambil yang >= minDonate
//   const quickAmounts = [10000, 20000, 50000, 100000].filter(
//     (v) => v >= minDonate && v <= maxDonate
//   );

//   // Semua trigger diurutkan ascending untuk progress indicator
//   const sortedTriggers = [...mediaTriggers].sort((a, b) => a.minAmount - b.minAmount);

//   // ── Render ─────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 flex justify-center items-start md:items-center p-4 md:p-6 font-sans">
//       <div className="w-full max-w-xl space-y-5 py-8 md:py-0">

//         {/* ── HEADER CARD ── */}
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 text-center border border-indigo-100 relative overflow-hidden"
//         >
//           {/* Background decoration */}
//           <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500 rounded-t-3xl" />
//           <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-50 rounded-full opacity-60" />
//           <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-violet-50 rounded-full opacity-60" />

//           <div className="relative z-10">
//             <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-200 mb-4">
//               {streamer.username?.charAt(0).toUpperCase()}
//             </div>
//             <h1 className="text-2xl font-black text-slate-800 tracking-tight">@{streamer.username}</h1>
//             <p className="text-slate-400 text-sm font-medium mt-1">Support aku biar makin semangat 🚀</p>
//             {(minDonate > 1000 || maxDonate < 10000000) && (
//               <div className="flex items-center justify-center gap-2 mt-3">
//                 {minDonate > 1000 && (
//                   <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
//                     Min Rp {minDonate.toLocaleString('id-ID')}
//                   </span>
//                 )}
//                 {maxDonate < 10000000 && (
//                   <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-wider">
//                     Max Rp {maxDonate.toLocaleString('id-ID')}
//                   </span>
//                 )}
//               </div>
//             )}
//           </div>
//         </motion.div>

//         {/* ── FORM CARD ── */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4, delay: 0.1 }}
//           className="bg-white p-7 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 space-y-5"
//         >

//           {/* QUICK SELECT NOMINAL */}
//           {quickAmounts.length > 0 && (
//             <div>
//               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
//                 Pilih Nominal
//               </label>
//               <div className="grid grid-cols-4 gap-2.5">
//                 {quickAmounts.map((val) => (
//                   <button
//                     key={val}
//                     onClick={() => setForm({ ...form, amount: val })}
//                     className={`cursor-pointer active:scale-[0.95] py-3 rounded-2xl font-black text-sm transition-all border-2 ${
//                       form.amount === val
//                         ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
//                         : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'
//                     }`}
//                   >
//                     {formatRp(val)}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* CUSTOM AMOUNT */}
//           <div>
//             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
//               Nominal Custom
//             </label>
//             <div className="relative">
//               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-sm">Rp</span>
//               <input
//                 type="number"
//                 value={form.amount || ''}
//                 onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
//                 className="w-full p-4 pl-12 rounded-2xl font-black text-slate-800 outline-none bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white transition-all"
//                 placeholder="Nominal custom..."
//               />
//             </div>

//             {/* Media trigger progress indicator */}
//             {sortedTriggers.length > 0 && (
//               <div className="mt-3 space-y-1.5">
//                 {sortedTriggers.map((t, i) => {
//                   const reached = form.amount >= t.minAmount;
//                   // Tampilkan semua yang sudah tercapai + 1 berikutnya yang belum
//                   const isNextUnlocked =
//                     !reached &&
//                     (i === 0 || form.amount >= sortedTriggers[i - 1]?.minAmount);
//                   if (!reached && !isNextUnlocked) return null;

//                   return (
//                     <motion.div
//                       key={i}
//                       initial={{ opacity: 0, x: -8 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all ${
//                         reached
//                           ? 'bg-indigo-50 text-indigo-600'
//                           : 'bg-slate-50 text-slate-400'
//                       }`}
//                     >
//                       <span className="text-xs">{reached ? '✅' : '🔒'}</span>
//                       <span>
//                         {reached ? (
//                           <>
//                             <span className="font-black">
//                               {t.label || (t.mediaType === 'video' ? 'Video Alert' : 'Gambar Alert')}
//                             </span>{' '}
//                             unlocked!
//                           </>
//                         ) : (
//                           <>
//                             Donasi{' '}
//                             <span className="font-black">
//                               Rp {Number(t.minAmount).toLocaleString('id-ID')}
//                             </span>{' '}
//                             untuk unlock{' '}
//                             <span className="font-black">
//                               {t.label || (t.mediaType === 'video' ? 'Video Alert' : 'Gambar Alert')}
//                             </span>
//                           </>
//                         )}
//                       </span>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* PESAN */}
//           <div>
//             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
//               Pesan Dukungan
//             </label>
//             <textarea
//               value={form.message}
//               onChange={(e) => setForm({ ...form, message: e.target.value })}
//               className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white outline-none min-h-[90px] font-medium text-sm text-slate-700 transition-all resize-none"
//               placeholder="Semangat terus ngodingnya bang! 🔥"
//             />
//           </div>

//           {/* ── MEDIA INPUT — muncul otomatis jika nominal memenuhi syarat trigger ── */}
//           <AnimatePresence>
//             {eligibleTrigger && (
//               <MediaInputSection
//                 trigger={eligibleTrigger}
//                 mediaUrl={mediaUrl}
//                 setMediaUrl={setMediaUrl}
//               />
//             )}
//           </AnimatePresence>

//           {/* NAMA & EMAIL */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <div>
//               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
//                 Nama
//               </label>
//               <input
//                 type="text"
//                 disabled={form.isAnonymous}
//                 value={form.isAnonymous ? '' : form.donorName}
//                 onChange={(e) => setForm({ ...form, donorName: e.target.value })}
//                 className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white outline-none font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
//                 placeholder="Nama kamu"
//               />
//             </div>
//             <div>
//               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
//                 Email (opsional)
//               </label>
//               <input
//                 type="email"
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white outline-none font-bold text-sm transition-all"
//                 placeholder="email@kamu.com"
//               />
//             </div>
//           </div>

//           {/* ANONIM TOGGLE */}
//           <label className="flex items-center gap-3 text-sm font-bold text-slate-600 cursor-pointer select-none group">
//             <div
//               className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${
//                 form.isAnonymous ? 'bg-indigo-600' : 'bg-slate-200'
//               }`}
//             >
//               <div
//                 className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
//                   form.isAnonymous ? 'left-5' : 'left-1'
//                 }`}
//               />
//               <input
//                 type="checkbox"
//                 checked={form.isAnonymous}
//                 onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
//                 className="sr-only"
//               />
//             </div>
//             Donasi sebagai anonim
//           </label>

//           <hr className="border-slate-100" />

//           {/* TOMBOL DONATE */}
//           <motion.button
//             whileHover={{ scale: 1.015 }}
//             whileTap={{ scale: 0.97 }}
//             onClick={handleDonate}
//             disabled={loading || !form.amount}
//             className="cursor-pointer w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//           >
//             {loading ? (
//               <><Loader2 size={20} className="animate-spin" /> Memproses...</>
//             ) : (
//               <>💜 Kirim Donasi{form.amount > 0 ? ` Rp ${Number(form.amount).toLocaleString('id-ID')}` : ''}</>
//             )}
//           </motion.button>

//           {/* Info */}
//           <p className="text-center text-[10px] text-slate-400 font-medium">
//             Pembayaran aman melalui Midtrans · {isProduction ? 'Production' : 'Sandbox'}
//           </p>
//         </motion.div>

//       </div>
//     </div>
//   );
// };

// export default SupporterPage;


import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ImageIcon, Loader2, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

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

// ============================================================
// HELPER — Media Detection (Diperbarui)
// ============================================================
const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const isYouTubeUrl = (url) => {
  if (!url) return false;
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/i;
  return ytRegex.test(url);
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';

  // youtu.be
  if (url.includes('youtu.be')) {
    const videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  }

  // youtube.com/watch?v=
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    }
  } catch {
    // fallback
  }

  return url;
};

const getMediaType = (url) => {
  if (!url) return null;
  if (isYouTubeUrl(url)) return 'youtube';
  if (isDirectVideoUrl(url)) return 'video';
  return 'image';
};

// ============================================================
// HELPER — format rupiah singkat
// ============================================================
const formatRp = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}jt`;
  if (n >= 1000) return `${n / 1000}K`;
  return String(n);
};

// ============================================================
// HELPER — cari eligible media trigger
// ============================================================
const getEligibleTrigger = (mediaTriggers = [], amount) => {
  if (!mediaTriggers.length || !amount) return null;
  const eligible = mediaTriggers
    .filter((t) => Number(amount) >= t.minAmount)
    .sort((a, b) => b.minAmount - a.minAmount);
  return eligible[0] || null;
};

// ============================================================
// SUB-COMPONENT — Media Input Section (FULL UPDATE)
// ============================================================
const MediaInputSection = ({ trigger, mediaUrl, setMediaUrl }) => {
  const [previewError, setPreviewError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setPreviewError(false);
  }, [mediaUrl]);

  const mediaType = getMediaType(mediaUrl);
  const hasPreview = mediaUrl && !previewError;

  const allowImage = trigger.mediaType === 'image' || trigger.mediaType === 'both';
  const allowVideo = trigger.mediaType === 'video' || trigger.mediaType === 'both';

  const placeholderText = allowImage && allowVideo
    ? 'https://youtu.be/xxxx atau https://i.imgur.com/xxxx.jpg'
    : allowVideo
    ? 'https://youtu.be/xxxx atau https://example.com/video.mp4'
    : 'https://i.imgur.com/contoh-gambar.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-5 space-y-4">
        {/* Badge unlock */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
              {allowVideo && allowImage ? (
                <span className="flex items-center gap-0.5">
                  <ImageIcon size={9} /><Video size={9} />
                </span>
              ) : allowVideo ? (
                <Video size={13} />
              ) : (
                <ImageIcon size={13} />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-indigo-700 leading-none">
                🎉 {trigger.label || 'Media Alert'} Unlocked!
              </p>
              <p className="text-[10px] text-indigo-400 font-medium mt-0.5">
                Tersedia mulai Rp {Number(trigger.minAmount).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          {mediaUrl && (
            <button
              onClick={() => setMediaUrl('')}
              className="w-6 h-6 rounded-full bg-indigo-100 hover:bg-red-100 hover:text-red-500 text-indigo-400 flex items-center justify-center transition-all"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tipe media yang diizinkan */}
        <div className="flex items-center gap-2">
          {allowImage && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-600">
              <ImageIcon size={10} /> Gambar / GIF
            </span>
          )}
          {allowVideo && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-purple-600">
              <Video size={10} /> Video + YouTube
            </span>
          )}
        </div>

        {/* Input URL */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
            Link Media (YouTube & External didukung)
          </label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full p-4 rounded-xl bg-white border-2 border-indigo-100 focus:border-indigo-400 outline-none font-mono text-xs text-slate-700 font-bold transition-all placeholder:font-sans placeholder:text-slate-400"
            placeholder={placeholderText}
          />
          <p className="text-[10px] text-slate-400 font-medium ml-1">
            * Opsional — Gambar (jpg, gif, png, webp), Video langsung (.mp4), atau link YouTube
          </p>
        </div>

        {/* PREVIEW */}
        <AnimatePresence>
          {hasPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl overflow-hidden border border-indigo-100 bg-slate-900 relative"
              style={{ maxHeight: 200 }}
            >
              {mediaType === 'youtube' ? (
                <iframe
                  src={getYouTubeEmbedUrl(mediaUrl)}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setPreviewError(true)}
                />
              ) : mediaType === 'video' ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Media preview"
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                  onError={() => setPreviewError(true)}
                />
              )}

              <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/60 backdrop-blur-sm">
                <p className="text-[10px] text-white/90 font-bold">
                  {mediaType === 'youtube' ? '▶️ YouTube Video' :
                   mediaType === 'video' ? '🎬 Direct Video' : '🖼️ Gambar'} — Preview
                </p>
              </div>
            </motion.div>
          )}

          {previewError && mediaUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-500 font-bold flex items-center gap-2"
            >
              <X size={14} /> URL tidak valid atau media tidak dapat dimuat.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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

  const [form, setForm] = useState({
    donorName: '',
    isAnonymous: false,
    email: '',
    amount: 0,
    message: '',
  });

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
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/overlay/public/${cleanUsername}`)
      .then((res) => setStreamer(res.data))
      .catch(() => alert('Streamer tidak ditemukan'));
  }, [username]);

  const mediaTriggers = streamer?.overlaySetting?.mediaTriggers || streamer?.OverlaySetting?.mediaTriggers || [];
  const eligibleTrigger = getEligibleTrigger(mediaTriggers, form.amount);

  useEffect(() => {
    if (!eligibleTrigger) setMediaUrl('');
  }, [eligibleTrigger]);

  // Handle Donate
  const handleDonate = async () => {
    if (!form.amount || form.amount < 1000) return alert('Minimal donasi Rp 1.000');
    if (!streamer?._id) return alert('Data streamer belum siap.');

    const minDonate = streamer?.overlaySetting?.minDonate || streamer?.OverlaySetting?.minDonate || 1000;
    const maxDonate = streamer?.overlaySetting?.maxDonate || streamer?.OverlaySetting?.maxDonate || 10000000;

    if (form.amount < minDonate) return alert(`Minimal donasi Rp ${minDonate.toLocaleString('id-ID')}`);
    if (form.amount > maxDonate) return alert(`Maksimal donasi Rp ${maxDonate.toLocaleString('id-ID')}`);

    try {
      setLoading(true);

      const hasMedia = eligibleTrigger && mediaUrl.trim();
      const detectedMediaType = getMediaType(mediaUrl?.trim());

      // Validasi tipe media
      if (hasMedia) {
        if (eligibleTrigger.mediaType === 'image' && detectedMediaType !== 'image') {
          return alert('Hanya gambar yang diizinkan untuk nominal ini.');
        }
        if (eligibleTrigger.mediaType === 'video' && 
            !['video', 'youtube'].includes(detectedMediaType)) {
          return alert('Hanya video atau YouTube yang diizinkan untuk nominal ini.');
        }
      }

      const payload = {
        amount: Math.round(Number(form.amount)),
        donorName: form.isAnonymous ? 'Anonim' : form.donorName || 'Anonim',
        message: form.message,
        userId: streamer._id,
        email: form.email.trim() || 'guest@mail.com',
        mediaUrl: hasMedia ? mediaUrl.trim() : null,
        mediaType: detectedMediaType,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/midtrans/create-invoice`,
        payload
      );

      if (res.data.token && snapReady && window.snap) {
        window.snap.pay(res.data.token, {
          onSuccess: () => window.location.href = `/donation/success?username=${streamer.username}`,
          onPending: () => window.location.href = `/donation/pending?username=${streamer.username}`,
          onError: () => alert('Pembayaran gagal.'),
          onClose: () => {},
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
      <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600 bg-blue-50">
        <Loader2 className="animate-spin mr-2" /> Memuat Profil...
      </div>
    );
  }

  const overlaySetting = streamer?.overlaySetting || streamer?.OverlaySetting || {};
  const minDonate = overlaySetting?.minDonate || 1000;
  const maxDonate = overlaySetting?.maxDonate || 10000000;
  const quickAmounts = [10000, 20000, 50000, 100000].filter(
    (v) => v >= minDonate && v <= maxDonate
  );

  const sortedTriggers = [...mediaTriggers].sort((a, b) => a.minAmount - b.minAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 flex justify-center items-start md:items-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-xl space-y-5 py-8 md:py-0">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 text-center border border-indigo-100 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500 rounded-t-3xl" />
          <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4">
            {streamer.username?.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-black text-slate-800">@{streamer.username}</h1>
          <p className="text-slate-400 text-sm mt-1">Support aku biar makin semangat 🚀</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-7 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 space-y-5"
        >
          {/* Quick Amounts */}
          {quickAmounts.length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                Pilih Nominal
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    onClick={() => setForm({ ...form, amount: val })}
                    className={`cursor-pointer active:scale-[0.97] hover:brightness-90 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
                      form.amount === val
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {formatRp(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount + Trigger Info */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Nominal Custom
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-sm">Rp</span>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full p-4 pl-12 rounded-2xl font-black text-slate-800 bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 focus:bg-white"
                placeholder="Nominal custom..."
              />
            </div>

            {sortedTriggers.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {sortedTriggers.map((t, i) => {
                  const reached = form.amount >= t.minAmount;
                  const isNext = !reached && (i === 0 || form.amount >= sortedTriggers[i - 1]?.minAmount);
                  if (!reached && !isNext) return null;

                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded-lg ${
                        reached ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      <span>{reached ? '✅' : '🔒'}</span>
                      <span>
                        {reached ? (
                          <>✅ {t.label || 'Media Alert'} unlocked!</>
                        ) : (
                          <>Donasi Rp {Number(t.minAmount).toLocaleString('id-ID')} untuk unlock {t.label}</>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Pesan Dukungan
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 min-h-[90px]"
              placeholder="Semangat terus bang! 🔥"
            />
          </div>

          {/* Media Input */}
          <AnimatePresence>
            {eligibleTrigger && (
              <MediaInputSection
                trigger={eligibleTrigger}
                mediaUrl={mediaUrl}
                setMediaUrl={setMediaUrl}
              />
            )}
          </AnimatePresence>

          {/* Nama & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Nama
              </label>
              <input
                type="text"
                disabled={form.isAnonymous}
                value={form.isAnonymous ? '' : form.donorName}
                onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 disabled:opacity-40"
                placeholder="Nama kamu"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Email (opsional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300"
                placeholder="email@kamu.com"
              />
            </div>
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 cursor-pointer">
            <div className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-all ${form.isAnonymous ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isAnonymous ? 'left-5' : 'left-1'}`} />
            </div>
            Donasi sebagai anonim
          </label>

          <hr className="border-slate-100" />

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDonate}
            disabled={loading || !form.amount}
            className="cursor-pointer active:scale-[0.97] hover:brightness-90 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Memproses...</>
            ) : (
              <>💜 Kirim Donasi{form.amount > 0 ? ` Rp ${Number(form.amount).toLocaleString('id-ID')}` : ''}</>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default SupporterPage;