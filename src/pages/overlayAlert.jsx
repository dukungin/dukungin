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
const renderIcon = (customIcon, size = 20) => {
  if (!customIcon) return '💜';
  if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
    return (
      <img
        src={customIcon}
        alt="icon"
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }}
      />
    );
  }
  return customIcon;
};

// ─── Helper: hitung durasi alert berdasarkan nominal & durationTiers ─────────
const getAlertDuration = (config, amount) => {
  if (!config) return 8000;

  const tiers = config.durationTiers || [];
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
    for (const tier of sorted) {
      const inRange =
        amount >= tier.minAmount &&
        (tier.maxAmount === null || tier.maxAmount === undefined || amount <= tier.maxAmount);
      if (inRange) return tier.duration * 1000;
    }
  }

  // Fallback ke baseDuration
  return (config.baseDuration || 8) * 1000;
};

// ─── Komponen Utama ───────────────────────────────────────────────────────────
const OverlayAlert = () => {
  const { token } = useParams();
  const [alert, setAlert]     = useState(null);
  const [config, setConfig]   = useState(null);
  const [progress, setProgress] = useState(100);

  const audioRef           = useRef(null);
  const configRef          = useRef(null);
  const progressIntervalRef = useRef(null);
  const dismissTimerRef    = useRef(null);

  // ── 1. Ambil konfigurasi visual dari backend ────────────────────────────────
  useEffect(() => {
    if (!token) return;
    axios
      .get(`https://server-dukungin-production.up.railway.app/api/overlay/config/${token}`)
      .then((res) => {
        setConfig(res.data);
        configRef.current = res.data;
      })
      .catch(() => console.error('[Overlay] Invalid token'));
  }, [token]);

  // ── 2. Socket — real-time donasi + reconnect ────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // ✅ Reconnect otomatis dengan Infinity attempts
    const socket = io('https://server-dukungin-production.up.railway.app', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    // Join room pertama kali
    socket.emit('join-room', token);

    // ✅ Rejoin room otomatis setelah reconnect (Railway restart dll)
    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Overlay] Reconnected setelah ${attemptNumber} percobaan — rejoin room`);
      socket.emit('join-room', token);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Overlay] Disconnect:', reason);
    });

    // ── Terima donasi baru ──────────────────────────────────────────────────
    socket.on('new-donation', (data) => {
      // Jika overlay di-disable streamer, skip
      if (configRef.current?.overlayEnabled === false) {
        console.log('[Overlay] Overlay disabled — alert diskip');
        return;
      }

      const donationWithTime = {
        ...data,
        receivedAt: data.receivedAt || new Date().toISOString(),
      };

      // Tampilkan alert & reset progress
      setAlert(donationWithTime);
      setProgress(100);

      // Mainkan suara
      const soundToPlay = data.soundUrl || configRef.current?.soundUrl;
      if (soundToPlay && audioRef.current) {
        audioRef.current.src = soundToPlay;
        audioRef.current.play().catch(() => {});
      }

      // Hitung durasi berdasarkan durationTiers
      const duration = getAlertDuration(configRef.current, data.amount);

      // ✅ Bersihkan timer sebelumnya (jika ada donasi baru masuk saat alert masih tampil)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      // ✅ Progress bar countdown — update tiap 50ms (smooth)
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining <= 0) {
          clearInterval(progressIntervalRef.current);
        }
      }, 50);

      // ✅ Auto-dismiss setelah durasi selesai
      dismissTimerRef.current = setTimeout(() => {
        setAlert(null);
        setProgress(100);
      }, duration);
    });

    // ── Update settings real-time ───────────────────────────────────────────
    socket.on('settings-updated', (newConfig) => {
      console.log('[Overlay] Settings updated:', newConfig.theme);
      setConfig(newConfig);
      configRef.current = newConfig;

      // Jika overlay di-disable saat alert sedang tampil, hilangkan
      if (newConfig.overlayEnabled === false) {
        setAlert(null);
        setProgress(100);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      }
    });

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      socket.off('new-donation');
      socket.off('settings-updated');
      socket.off('reconnect');
      socket.off('disconnect');
      socket.disconnect();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [token]);

  // ── Jangan render apapun sebelum config dimuat ──────────────────────────────
  if (!config) return null;

  // ── Jika overlay di-disable, render transparan ──────────────────────────────
  if (config.overlayEnabled === false) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  const bg            = config.primaryColor  || '#6366f1';
  const fg            = config.textColor     || '#ffffff';
  const borderColor = config.borderColor   || 'rgba(255,255,255,0.15)';
  const theme         = config.theme         || 'modern';
  const highlight     = config.highlightColor  || '#a5b4fc';  
  const animation     = config.animation     || 'bounce';
  const maxW          = config.maxWidth      || 340;
  const customIcon    = config.customIcon    || '';
  const showTimestamp = config.showTimestamp !== false;

  // ── Animasi variants ────────────────────────────────────────────────────────
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

  // ── Render media ────────────────────────────────────────────────────────────
  const renderMedia = () => {
    if (!alert?.mediaUrl) return null;
    const detectedType = detectMediaType(alert.mediaUrl, alert.mediaType);

    if (detectedType === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(alert.mediaUrl);
      return (
        <div style={{
          width: '100%', aspectRatio: '16/9',
          borderRadius: theme === 'modern' ? '12px' : '4px',
          overflow: 'hidden', marginBottom: 12, background: '#000',
        }}>
          <iframe
            src={embedUrl} width="100%" height="100%"
            frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
            style={{ display: 'block', border: 'none', width: '100%', height: '100%' }}
          />
        </div>
      );
    }

    if (detectedType === 'video') {
      return (
        <div style={{
          width: '100%', aspectRatio: '16/9',
          borderRadius: theme === 'modern' ? '12px' : '4px',
          overflow: 'hidden', marginBottom: 12, background: '#000',
        }}>
          <video src={alert.mediaUrl} autoPlay loop
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        borderRadius: theme === 'modern' ? '12px' : '4px',
        overflow: 'hidden', marginBottom: 12,
      }}>
        <img src={alert.mediaUrl} alt="media"
          style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '220px' }} />
      </div>
    );
  };

  // ── Render timestamp ────────────────────────────────────────────────────────
  const renderTimestamp = () => {
    if (!showTimestamp || !alert?.receivedAt) return null;
    return (
      <div style={{ fontSize: 9, opacity: 0.55, fontFamily: 'monospace', letterSpacing: '0.04em', marginTop: 4 }}>
        🕐 {formatTimestamp(alert.receivedAt)}
      </div>
    );
  };

  // ── Progress bar ────────────────────────────────────────────────────────────
  const renderProgressBar = () => (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{
        height: 3,
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 99,
          transition: 'width 50ms linear',
        }} />
      </div>
    </div>
  );
  
// ── Render per Tema ───────────────────────────────────────────────────────
  const renderInner = () => {
    if (theme === 'modern') {
      return (
        <div style={{ padding: '16px 18px 8px' }}>
          {renderMedia()}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {renderIcon(customIcon, 26)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Donasi Masuk!
              </div>
              <div style={{ color: highlight, fontSize: 17, fontWeight: 900, marginTop: 2 }}>
                @{alert.donorName} · Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>
              {alert.message && (
                <div style={{ color: fg, fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                  "{alert.message}"
                </div>
              )}
              {renderTimestamp()}
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'classic') {
      return (
        <div style={{ padding: '18px 22px 10px', borderLeft: `5px solid ${highlight}` }}>
          {renderMedia()}
          <div style={{ color: highlight, fontSize: 22, fontWeight: 900 }}>
            Rp {Number(alert.amount).toLocaleString('id-ID')}
          </div>
          <div style={{ color: fg, fontSize: 16, fontWeight: 700 }}>
            @{alert.donorName}
          </div>
          {alert.message && <div style={{ color: fg, fontSize: 13, opacity: 0.85, marginTop: 6 }}>"{alert.message}"</div>}
          {renderTimestamp()}
        </div>
      );
    }

    // Minimal
    return (
      <div style={{ padding: '14px 18px 10px', borderLeft: `4px solid ${highlight}`, background: 'rgba(0,0,0,0.8)' }}>
        {renderMedia()}
        <div style={{ color: highlight, fontSize: 26, fontWeight: 900 }}>
          Rp {Number(alert.amount).toLocaleString('id-ID')}
        </div>
        <div style={{ color: fg, fontSize: 15, fontWeight: 600 }}>
          @{alert.donorName}
        </div>
        {alert.message && <div style={{ color: fg, fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>"{alert.message}"</div>}
        {renderTimestamp()}
      </div>
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
      <audio ref={audioRef} />

      <AnimatePresence>
        {alert && (
          <motion.div
            key={alert.receivedAt || Date.now()}
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            style={{
              backgroundColor: theme === 'minimal' ? 'transparent' : bg,
              color: fg,
              width: `${maxW}px`,
              borderRadius: theme === 'modern' ? '20px' : theme === 'classic' ? '8px' : '4px',
              border: `2px solid ${borderColor}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {renderInner()}
            {renderProgressBar()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverlayAlert;