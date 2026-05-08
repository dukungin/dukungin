import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const SupporterPage = () => {
  const { username } = useParams();
  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  const [form, setForm] = useState({
    donorName: '',
    isAnonymous: false,
    email: '',
    amount: 0,
    message: '',
  });

  // Load Midtrans Snap.js sekali saat komponen mount
  useEffect(() => {
    const existing = document.querySelector('script[src*="snap.js"]');
    if (existing) {
      setSnapReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = SNAP_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => setSnapReady(true);
    document.head.appendChild(script);

    return () => {
      // Jangan hapus script saat unmount karena DonationPending juga butuh
    };
  }, []);

  useEffect(() => {
    if (!username) return;
    const cleanUsername = username.replace(/^@+/, '');
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/overlay/public/${cleanUsername}`)
      .then((res) => setStreamer(res.data))
      .catch(() => alert('Streamer tidak ditemukan'));
  }, [username]);

  console.log(streamer)

  const handleDonate = async () => {
    if (!form.amount || form.amount < 1000) return alert('Minimal donasi Rp 1.000');
    if (!streamer?._id) return alert('Data streamer belum siap.');

    try {
      setLoading(true);

      const payload = {
        amount: Math.round(Number(form.amount)),
        donorName: form.isAnonymous ? 'Anonim' : form.donorName || 'Anonim',
        message: form.message,
        userId: streamer._id,
        email: form.email.trim() || 'guest@mail.com',
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/midtrans/create-invoice`,
        payload
      );

      // Simpan token & info ke localStorage agar bisa dibuka ulang di halaman pending
      if (res.data.token) {
        localStorage.setItem('midtrans_pending_token', res.data.token);
        localStorage.setItem('midtrans_pending_username', streamer.username);
        localStorage.setItem('midtrans_pending_url', res.data.url || '');
      }

      console.log('[Snap] isProduction:', isProduction);
      console.log('[Snap] CLIENT_KEY used:', MIDTRANS_CLIENT_KEY);
      console.log('[Snap] Token:', res.data.token);

      // Pilihan 1: Buka Snap popup
      if (res.data.token && snapReady && window.snap) {
        window.snap.pay(res.data.token, {
          onSuccess: () => {
            localStorage.removeItem('midtrans_pending_token');
            localStorage.removeItem('midtrans_pending_username');
            localStorage.removeItem('midtrans_pending_url');
            window.location.href = `/donation/success?username=${streamer.username}`;
          },
          onPending: () => {
            // Token sudah tersimpan, langsung redirect ke halaman pending
            window.location.href = `/donation/pending?username=${streamer.username}`;
          },
          onError: () => {
            localStorage.removeItem('midtrans_pending_token');
            localStorage.removeItem('midtrans_pending_username');
            localStorage.removeItem('midtrans_pending_url');
            alert('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: () => {
            // User tutup popup tanpa bayar
            // Token tetap tersimpan di localStorage
            // User bisa buka lagi via halaman pending
          },
        });
      } else {
        // Fallback ke redirect URL jika Snap.js belum load
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat invoice.');
    } finally {
      setLoading(false);
    }
  };

  if (!streamer)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600">
        <Loader2 className="animate-spin mr-2" /> Memuat Profil...
      </div>
    );

  return (
    <div className="min-h-screen bg-blue-100 flex justify-center items-center p-6 font-sans">
      <div className="w-full max-w-xl space-y-8">

        {/* HEADER */}
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center border-b-4 border-indigo-200">
          <div className="w-24 h-24 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black">
            {streamer.username?.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-2xl font-black">@{streamer.username}</h1>
          <p className="text-gray-500 text-sm">Support aku biar makin semangat 🚀</p>
        </div>

        {/* FORM */}
        <div className="bg-white p-8 rounded-3xl shadow-xl space-y-6">

          {/* NOMINAL QUICK SELECT */}
          <div className="grid grid-cols-4 gap-3">
            {[10000, 20000, 50000, 100000].map((val) => (
              <button
                key={val}
                onClick={() => setForm({ ...form, amount: val })}
                className={`cursor-pointer active:scale-[0.97] py-3 rounded-2xl font-black transition-all border-2 ${
                  form.amount === val
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-gray-50 border-gray-100 text-gray-400'
                }`}
              >
                {val / 1000}K
              </button>
            ))}
          </div>

          {/* CUSTOM AMOUNT */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600">
              Rp
            </span>
            <input
              type="number"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full p-5 pl-12 rounded-2xl font-black outline-none bg-gray-100 border-2 border-transparent focus:border-indigo-300 transition-all"
              placeholder="Nominal custom..."
            />
          </div>

          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full p-4 rounded-2xl bg-gray-100 outline-none min-h-[100px] border-2 border-transparent focus:border-indigo-300"
            placeholder="Pesan dukungan..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              disabled={form.isAnonymous}
              value={form.isAnonymous ? '' : form.donorName}
              onChange={(e) => setForm({ ...form, donorName: e.target.value })}
              className="p-4 rounded-2xl bg-gray-100 outline-none border-2 border-transparent focus:border-indigo-300 disabled:opacity-40"
              placeholder="Nama"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="p-4 rounded-2xl bg-gray-100 outline-none border-2 border-transparent focus:border-indigo-300"
              placeholder="Email (opsional)"
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              className="w-5 h-5 text-indigo-600"
            />
            Donasi sebagai anonim
          </label>

          <hr className="border-gray-100" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDonate}
            disabled={loading}
            className="cursor-pointer active:scale-[0.97] w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Memproses...
              </>
            ) : (
              '💜 Kirim Donasi'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SupporterPage;