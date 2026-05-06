import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCcw, Home } from 'lucide-react';

const DonationFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Xendit mengirim ?external_id=... dan kita tambahkan ?username=... dari backend
  const externalId = searchParams.get('external_id');
  const username = searchParams.get('username');

  const handleRetry = () => {
    if (username) {
      navigate(`/donate/${username}`);
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    if (username) {
      navigate(`/donate/${username}`);
    } else {
      navigate('/');
    }
  };

  const reasons = [
    { icon: '⏰', title: 'Invoice kadaluarsa', desc: 'Pembayaran tidak diselesaikan dalam batas waktu.' },
    { icon: '📶', title: 'Koneksi terputus', desc: 'Terjadi gangguan jaringan saat proses berlangsung.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100"
        >
          {/* Top banner */}
          <div className="bg-gradient-to-r from-red-400 to-orange-400 p-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg"
            >
              <XCircle size={44} className="text-red-400" strokeWidth={2.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-2xl font-black text-white"
            >
              Pembayaran Gagal 😔
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="text-red-100 text-sm mt-1"
            >
              Jangan khawatir, tidak ada dana yang terpotong
              {username && <> · donasi untuk <span className="font-bold">@{username}</span></>}
            </motion.p>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-8 space-y-6"
          >
            {/* Kemungkinan penyebab */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">
                Kemungkinan penyebab
              </p>
              <div className="space-y-2">
                {reasons.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <span className="text-xl shrink-0">{r.icon}</span>
                    <div>
                      <p className="text-slate-700 text-sm font-bold">{r.title}</p>
                      <p className="text-slate-400 text-xs">{r.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* External ID kalau ada */}
            {externalId && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">ID Transaksi</p>
                <p className="text-xs text-gray-500 font-mono break-all">{externalId}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRetry}
                className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all"
              >
                <RefreshCcw size={16} />
                Coba Lagi
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleHome}
                className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
              >
                <Home size={16} />
                {username ? `@${username}` : 'Beranda'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-xs text-gray-400 mt-4"
        >
          Butuh bantuan? Hubungi dukungan kami 💬
        </motion.p>
      </div>
    </div>
  );
};

export default DonationFailed;