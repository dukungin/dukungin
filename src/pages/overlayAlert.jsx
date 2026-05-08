import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const OverlayAlert = () => {
  const { token } = useParams();
  const [alert, setAlert] = useState(null);
  const [config, setConfig] = useState(null);
  const audioRef = useRef(null);

  // ✅ FIX: Simpan config ke ref agar socket listener selalu baca
  //         nilai terbaru tanpa perlu re-register ulang
  const configRef = useRef(null);

  // 1. Ambil Konfigurasi Visual dari Backend
  useEffect(() => {
    if (!token) return;

    axios
      .get(`https://server-dukungin-production.up.railway.app/api/overlay/config/${token}`)
      .then((res) => {
        setConfig(res.data);
        // ✅ Sync ke ref setiap kali config update
        configRef.current = res.data;
      })
      .catch(() => console.error('Invalid Token'));
  }, [token]);

  // 2. Listen Real-time Donasi
  useEffect(() => {
    if (!token) return;

    // ✅ Buat koneksi di dalam effect
    const socket = io('https://server-dukungin-production.up.railway.app');
    
    socket.emit('join-overlay', token);

    socket.on('new-donation', (data) => {
      setAlert(data);
      if (audioRef.current) audioRef.current.play().catch(() => {});
      const duration = configRef.current?.duration || 5000;
      setTimeout(() => setAlert(null), duration);
    });

    return () => {
      socket.off('new-donation');
      socket.disconnect(); // ✅ Cleanup koneksi
    };
  }, [token]);

  if (!config) return null;

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden">
      <audio ref={audioRef} src={config.soundUrl || '/default-alert.mp3'} />

      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.5 } }}
            style={{
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              borderRadius: config.overlayTheme === 'modern' ? '2rem' : '0px',
            }}
            className="p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center min-w-[400px] border-4 border-white/20 backdrop-blur-md"
          >
            <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-4 opacity-70">
              New Donation!
            </h2>
            <h1 className="text-4xl font-black mb-2">{alert.donorName}</h1>
            <div className="text-3xl font-bold mb-6">
              Rp {parseInt(alert.amount).toLocaleString('id-ID')}
            </div>
            <div className="text-xl italic font-medium bg-black/10 p-4 rounded-xl">
              "{alert.message}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverlayAlert;