// import React, { useEffect, useState, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import { motion, AnimatePresence } from 'framer-motion';
// import axios from 'axios';

// const OverlayAlert = () => {
//   const { token } = useParams();
//   const [alert, setAlert] = useState(null);
//   const [config, setConfig] = useState(null);
//   const audioRef = useRef(null);

//   // ✅ FIX: Simpan config ke ref agar socket listener selalu baca
//   //         nilai terbaru tanpa perlu re-register ulang
//   const configRef = useRef(null);

//   // 1. Ambil Konfigurasi Visual dari Backend
//   useEffect(() => {
//     if (!token) return;

//     axios
//       .get(`https://server-dukungin-production.up.railway.app/api/overlay/config/${token}`)
//       .then((res) => {
//         setConfig(res.data);
//         // ✅ Sync ke ref setiap kali config update
//         configRef.current = res.data;
//       })
//       .catch(() => console.error('Invalid Token'));
//   }, [token]);

//   // 2. Listen Real-time Donasi
//   useEffect(() => {
//     if (!token) return;

//     // ✅ Buat koneksi di dalam effect
//     const socket = io('https://server-dukungin-production.up.railway.app');
    
//     socket.emit('join-room', token);

//     socket.on('new-donation', (data) => {
//       setAlert(data);
//       if (audioRef.current) audioRef.current.play().catch(() => {});
//       const duration = configRef.current?.duration || 5000;
//       setTimeout(() => setAlert(null), duration);
//     });

//     return () => {
//       socket.off('new-donation');
//       socket.disconnect(); // ✅ Cleanup koneksi
//     };
//   }, [token]);

//   if (!config) return null;

//   return (
//     <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden">
//       <audio ref={audioRef} src={config.soundUrl || '/default-alert.mp3'} />

//       <AnimatePresence>
//         {alert && (
//           <motion.div
//             initial={{ scale: 0, opacity: 0, y: 100 }}
//             animate={{ scale: 1, opacity: 1, y: 0 }}
//             exit={{ scale: 0, opacity: 0, transition: { duration: 0.5 } }}
//             style={{
//               backgroundColor: config.backgroundColor,
//               color: config.textColor,
//               borderRadius: config.overlayTheme === 'modern' ? '2rem' : '0px',
//             }}
//             className="p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center min-w-[400px] border-4 border-white/20 backdrop-blur-md"
//           >
//             <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-4 opacity-70">
//               New Donation!
//             </h2>
//             <h1 className="text-4xl font-black mb-2">{alert.donorName}</h1>
//             <div className="text-3xl font-bold mb-6">
//               Rp {parseInt(alert.amount).toLocaleString('id-ID')}
//             </div>
//             <div className="text-xl italic font-medium bg-black/10 p-4 rounded-xl">
//               "{alert.message}"
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default OverlayAlert;


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
  const configRef = useRef(null);

  // 1. Ambil Konfigurasi Visual dari Backend
  useEffect(() => {
    if (!token) return;
    axios
      .get(`https://server-dukungin-production.up.railway.app/api/overlay/config/${token}`)
      .then((res) => {
        setConfig(res.data);
        configRef.current = res.data;
      })
      .catch(() => console.error('Invalid Token'));
  }, [token]);

  // 2. Listen Real-time Donasi
  useEffect(() => {
    if (!token) return;

    const socket = io('https://server-dukungin-production.up.railway.app');
    socket.emit('join-room', token);

    socket.on('new-donation', (data) => {
      setAlert(data);
      if (audioRef.current) audioRef.current.play().catch(() => {});
      const duration = (configRef.current?.baseDuration || 5) * 1000;
      setTimeout(() => setAlert(null), duration);
    });

    return () => {
      socket.off('new-donation');
      socket.disconnect();
    };
  }, [token]);

  if (!config) return null;

  const bg        = config.primaryColor || '#6366f1';
  const fg        = config.textColor    || '#ffffff';
  const theme     = config.theme        || 'modern';
  const animation = config.animation    || 'bounce';

  const animVariants = {
    bounce: {
      initial: { scale: 0.5, opacity: 0, y: 40 },
      animate: { scale: [0.5, 1.08, 1], opacity: 1, y: 0, transition: { duration: 0.5 } },
      exit:    { scale: 0.8, opacity: 0, transition: { duration: 0.3 } },
    },
    'slide-left': {
      initial: { x: -80, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
      exit:    { x: -60, opacity: 0, transition: { duration: 0.3 } },
    },
    'slide-right': {
      initial: { x: 80, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
      exit:    { x: 60, opacity: 0, transition: { duration: 0.3 } },
    },
    fade: {
      initial: { opacity: 0, y: -12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit:    { opacity: 0, y: -8, transition: { duration: 0.3 } },
    },
  };

  const anim = animVariants[animation] || animVariants.bounce;

  const cardStyle = {
    backgroundColor: theme === 'minimal' ? 'transparent' : bg,
    color: fg,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    minWidth: `${config.maxWidth || 340}px`,
    maxWidth: `${config.maxWidth || 340}px`,
    borderRadius: theme === 'modern' ? '20px' : theme === 'classic' ? '4px' : '0px',
    boxShadow: theme === 'minimal' ? 'none' : '0 20px 50px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    border: theme === 'minimal'
      ? `3px solid ${bg}`
      : '2px solid rgba(255,255,255,0.15)',
  };

  const renderInner = () => {
    if (theme === 'modern') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>💜</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Donasi Masuk!
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
            @{alert.donorName} · Rp {parseInt(alert.amount).toLocaleString('id-ID')}
          </div>
          {alert.message && (
            <div style={{ fontSize: 12, opacity: 0.75, fontStyle: 'italic' }}>
              "{alert.message}"
            </div>
          )}
        </div>
      </div>
    );

    if (theme === 'classic') return (
      <div style={{ padding: '18px 22px', borderLeft: `4px solid rgba(255,255,255,0.4)` }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Donasi Masuk!
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>
          @{alert.donorName}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          Rp {parseInt(alert.amount).toLocaleString('id-ID')}
        </div>
        {alert.message && (
          <div style={{ fontSize: 12, opacity: 0.65, fontStyle: 'italic' }}>
            "{alert.message}"
          </div>
        )}
      </div>
    );

    // minimal
    return (
      <div style={{ padding: '14px 18px', borderLeft: `3px solid ${bg}`, background: 'rgba(0,0,0,0.75)' }}>
        <div style={{ fontSize: 10, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Donasi Masuk
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
          Rp {parseInt(alert.amount).toLocaleString('id-ID')}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
          @{alert.donorName}
        </div>
        {alert.message && (
          <div style={{ fontSize: 11, opacity: 0.6, fontStyle: 'italic' }}>
            "{alert.message}"
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      overflow: 'hidden',
    }}>
      <audio ref={audioRef} src={config.soundUrl || ''} />

      <AnimatePresence>
        {alert && (
          <motion.div
            key={alert.donorName + alert.amount}
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            style={cardStyle}
          >
            {renderInner()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverlayAlert;