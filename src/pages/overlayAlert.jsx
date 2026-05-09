import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// ─── Helper: konversi YouTube URL → embed URL ─────────────────────────────────
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${shortMatch[1]}`;
  const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${shortsMatch[1]}`;
  return null;
};

// ─── Helper: deteksi tipe media ───────────────────────────────────────────────
const detectMediaType = (url, mediaType) => {
  if (!url) return null;
  if (getYouTubeEmbedUrl(url)) return 'youtube';
  if (mediaType === 'video') return 'video';
  if (mediaType === 'image') return 'image';
  if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
  return 'image';
};

// ─── Helper: format timestamp ─────────────────────────────────────────────────
// Mengembalikan string "HH:MM:SS" dari Date object atau ISO string
const formatTimestamp = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// ─── Helper: render icon ──────────────────────────────────────────────────────
// customIcon bisa berupa: emoji string, URL gambar, atau kosong (fallback 💜)
const renderIcon = (customIcon, size = 20) => {
  if (!customIcon) return '💜';
  // Cek apakah ini URL gambar
  if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
    return (
      <img
        src={customIcon}
        alt="icon"
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }}
      />
    );
  }
  // Anggap emoji
  return customIcon;
};

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

  // 2. Listen Real-time Donasi + Settings Update
  useEffect(() => {
    if (!token) return;

    const socket = io('https://server-dukungin-production.up.railway.app');
    socket.emit('join-room', token);

    socket.on('new-donation', (data) => {
      // ✅ Cek overlayEnabled — jika false, jangan tampilkan alert
      if (configRef.current?.overlayEnabled === false) {
        console.log('[Overlay] Overlay disabled, skipping alert.');
        return;
      }

      // Tambahkan timestamp saat donasi diterima (jika tidak ada dari backend)
      const donationWithTime = {
        ...data,
        receivedAt: data.receivedAt || new Date().toISOString(),
      };

      setAlert(donationWithTime);
      const soundToPlay = data.soundUrl || config.soundUrl;
      if (soundToPlay && audioRef.current) {
        audioRef.current.src = soundToPlay;
        audioRef.current.play().catch(() => {});
      }
      const duration = (configRef.current?.baseDuration || 5) * 1000;
      setTimeout(() => setAlert(null), duration);
    });

    socket.on('settings-updated', (newConfig) => {
      console.log('[Overlay] Settings updated:', newConfig.theme);
      setConfig(newConfig);
      configRef.current = newConfig;

      // Jika overlay di-disable saat alert sedang tampil, hilangkan alert
      if (newConfig.overlayEnabled === false) {
        setAlert(null);
      }
    });

    return () => {
      socket.off('new-donation');
      socket.off('settings-updated');
      socket.disconnect();
    };
  }, [token]);

  if (!config) return null;

  // Jika overlay di-disable, render kosong (transparan)
  if (config.overlayEnabled === false) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  const bg            = config.primaryColor  || '#6366f1';
  const fg            = config.textColor     || '#ffffff';
  const theme         = config.theme         || 'modern';
  const animation     = config.animation     || 'bounce';
  const maxW          = config.maxWidth      || 340;
  const customIcon    = config.customIcon    || '';
  const showTimestamp = config.showTimestamp !== false; // default true

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

  // ─── Render Media ───────────────────────────────────────────────────────────
  const renderMedia = () => {
    if (!alert?.mediaUrl) return null;
    const detectedType = detectMediaType(alert.mediaUrl, alert.mediaType);

    if (detectedType === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(alert.mediaUrl);
      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: theme === 'modern' ? '12px' : '4px',
          overflow: 'hidden',
          marginBottom: 12,
          background: '#000',
        }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ display: 'block', border: 'none', width: '100%', height: '100%' }}
          />
        </div>
      );
    }

    if (detectedType === 'video') {
      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: theme === 'modern' ? '12px' : '4px',
          overflow: 'hidden',
          marginBottom: 12,
          background: '#000',
        }}>
          <video
            src={alert.mediaUrl}
            autoPlay
            loop
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        borderRadius: theme === 'modern' ? '12px' : '4px',
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        <img
          src={alert.mediaUrl}
          alt="media"
          style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '220px' }}
        />
      </div>
    );
  };

  // ─── Timestamp badge ────────────────────────────────────────────────────────
  const renderTimestamp = () => {
    if (!showTimestamp || !alert?.receivedAt) return null;
    return (
      <div style={{
        fontSize: 9,
        opacity: 0.55,
        fontFamily: 'monospace',
        letterSpacing: '0.04em',
        marginTop: 4,
      }}>
        🕐 {formatTimestamp(alert.receivedAt)}
      </div>
    );
  };

  // ─── Render Konten per Tema ─────────────────────────────────────────────────
  const renderInner = () => {
    if (theme === 'modern') return (
      <div style={{ padding: '16px 18px' }}>
        {renderMedia()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {renderIcon(customIcon, 22)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
              Donasi Masuk!
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2, marginBottom: 3 }}>
              @{alert.donorName} · Rp {parseInt(alert.amount).toLocaleString('id-ID')}
            </div>
            {alert.message && (
              <div style={{ fontSize: 11, opacity: 0.75, fontStyle: 'italic' }}>
                "{alert.message}"
              </div>
            )}
            {renderTimestamp()}
          </div>
        </div>
      </div>
    );

    if (theme === 'classic') return (
      <div style={{ padding: '16px 20px', borderLeft: '4px solid rgba(255,255,255,0.4)' }}>
        {renderMedia()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 18 }}>{renderIcon(customIcon, 18)}</span>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Donasi Masuk!
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>@{alert.donorName}</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>
          Rp {parseInt(alert.amount).toLocaleString('id-ID')}
        </div>
        {alert.message && (
          <div style={{ fontSize: 11, opacity: 0.65, fontStyle: 'italic' }}>"{alert.message}"</div>
        )}
        {renderTimestamp()}
      </div>
    );

    // minimal
    return (
      <div style={{ padding: '12px 16px', borderLeft: `3px solid ${bg}`, background: 'rgba(0,0,0,0.75)' }}>
        {renderMedia()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 14 }}>{renderIcon(customIcon, 14)}</span>
          <div style={{ fontSize: 10, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Donasi Masuk
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
          Rp {parseInt(alert.amount).toLocaleString('id-ID')}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 3 }}>@{alert.donorName}</div>
        {alert.message && (
          <div style={{ fontSize: 11, opacity: 0.6, fontStyle: 'italic' }}>"{alert.message}"</div>
        )}
        {renderTimestamp()}
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
            key={alert.donorName + alert.amount + Date.now()}
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            style={{
              backgroundColor: theme === 'minimal' ? 'transparent' : bg,
              color: fg,
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              width: `${maxW}px`,
              borderRadius: theme === 'modern' ? '20px' : theme === 'classic' ? '4px' : '0px',
              boxShadow: theme === 'minimal' ? 'none' : '0 20px 50px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              border: theme === 'minimal' ? `3px solid ${bg}` : '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {renderInner()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverlayAlert;