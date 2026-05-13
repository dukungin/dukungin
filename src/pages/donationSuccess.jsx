import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Heart, Home, Share2 } from 'lucide-react';

const DonationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');

  const handleShare = async () => {
    const donateUrl = username
      ? `${window.location.origin}/donate/${username}`
      : window.location.origin;

    const shareText = username
      ? `💜 Aku baru aja kirim donasi buat @${username}!\n\n` +
        `Kalau kamu juga suka sama kontennya, yuk dukung bareng biar dia makin semangat berkarya! ` +
        `Setiap dukungan sekecil apapun pasti sangat berarti buat mereka 🙌\n\n` +
        `👇 Klik link ini buat donasi sekarang:\n${donateUrl}`
      : `💜 Aku baru aja support streamer favoritku!\n\n` +
        `Yuk dukung creator favoritmu juga. Setiap donasi sekecil apapun sangat berarti ` +
        `dan membantu mereka terus berkarya untuk kita semua 🙌\n\n` +
        `👇 Mulai donasi sekarang:\n${donateUrl}`;

    if (navigator.share) {
      await navigator.share({
        title: username
          ? `Dukung @${username} — Streamer Favoritku! 🎮`
          : 'Dukung Streamer Favoritmu! 🎮',
        text: shareText,
        url: donateUrl,
      });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText}`);
      alert('Link donasi berhasil disalin! 📋');
    }
  };

  const handleBack = () => {
    if (username) {
      navigate(`/donate/${username}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6 font-sans">
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{ y: '110vh', x: `${Math.random() * 100}vw`, opacity: 0 }}
            animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 4 + Math.random() * 3,
              delay: Math.random() * 3,
              repeat: Infinity,
              repeatDelay: Math.random() * 5,
            }}
          >
            {['💜', '🎉', '✨', '💫', '🌟', '❤️', '🥳', '🎊'][i % 8]}
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="bg-white rounded-none shadow-2xl overflow-hidden border border-indigo-100"
        >
          {/* Top banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-center relative">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
              className="w-20 h-20 bg-white rounded-none flex items-center justify-center mx-auto shadow-lg"
            >
              <CheckCircle2 size={44} className="text-indigo-500" strokeWidth={2.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-2xl font-black text-white"
            >
              Donasi Berhasil! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="text-indigo-100 text-sm mt-1"
            >
              Pembayaranmu sudah kami terima
              {username && <> · untuk <span className="font-bold">@{username}</span></>}
            </motion.p>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-8 space-y-6"
          >
            {/* Thank you card */}
            <div className="bg-indigo-50 rounded-none p-5 text-center border border-indigo-100">
              <Heart size={28} className="text-indigo-500 mx-auto mb-2" strokeWidth={2.5} />
              <p className="text-slate-700 font-semibold text-base leading-relaxed">
                Terima kasih sudah mendukung!
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Dukunganmu sangat berarti dan memotivasi streamer favoritmu untuk terus berkarya.
              </p>
            </div>
            {/* Share preview box */}
            <div className="hidden bg-gray-50 rounded-none p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Preview pesan share</p>
              <p className="text-slate-500 text-xs leading-relaxed whitespace-pre-line">
                {username
                  ? `💜 Aku baru aja kirim donasi buat @${username}!\n\nKalau kamu juga suka sama kontennya, yuk dukung bareng biar dia makin semangat berkarya! Setiap dukungan sekecil apapun pasti sangat berarti buat mereka 🙌\n\n👇 Klik link ini buat donasi sekarang:`
                  : `💜 Aku baru aja support streamer favoritku!\n\nYuk dukung creator favoritmu juga. Setiap donasi sekecil apapun sangat berarti dan membantu mereka terus berkarya 🙌\n\n👇 Mulai donasi sekarang:`}
                {'\n'}
                <span className="text-indigo-400 font-medium">
                  {username
                    ? `${window.location.origin}/donate/${username}`
                    : window.location.origin}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-none border-2 border-indigo-200 text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-all"
              >
                <Share2 size={16} />
                Bagikan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBack}
                className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-none bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all"
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
          Powered by Xendit · Transaksi Aman &amp; Terenkripsi 🔒
        </motion.p>
      </div>
    </div>
  );
};

export default DonationSuccess;