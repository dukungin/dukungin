import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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

const detectMediaType = (url, mediaType) => {
  if (!url) return null;
  if (getYouTubeEmbedUrl(url)) return 'youtube';
  if (mediaType === 'video') return 'video';
  if (mediaType === 'image') return 'image';
  if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
  return 'image';
};

const formatTimestamp = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
};

const renderIcon = (customIcon, size = 20) => {
  if (!customIcon) return '💜';
  if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
    return <img src={customIcon} alt="icon" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 0 }} />;
  }
  return customIcon;
};

const getAlertDuration = (config, amount) => {
  if (!config) return 8000;
  const tiers = config.durationTiers || [];
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
    for (const tier of sorted) {
      const inRange = amount >= tier.minAmount &&
        (tier.maxAmount === null || tier.maxAmount === undefined || amount <= tier.maxAmount);
      if (inRange) return tier.duration * 1000;
    }
  }
  return (config.baseDuration || 8) * 1000;
};

const OverlayAlert = () => {
  const { token } = useParams();
  const [alert, setAlert]       = useState(null);
  const [config, setConfig]     = useState(null);
  const [progress, setProgress] = useState(100);

  const audioRef            = useRef(null);
  const configRef           = useRef(null);
  const progressIntervalRef = useRef(null);
  const dismissTimerRef     = useRef(null);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`https://server-dukungin-production.up.railway.app/api/overlay/config/${token}`)
      .then((res) => { setConfig(res.data); configRef.current = res.data; })
      .catch(() => console.error('[Overlay] Invalid token'));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io('https://server-dukungin-production.up.railway.app', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socket.emit('join-room', token);

    socket.on('reconnect', (n) => {
      console.log(`[Overlay] Reconnected (${n}) — rejoin room`);
      socket.emit('join-room', token);
    });

    socket.on('disconnect', (reason) => console.log('[Overlay] Disconnect:', reason));

    socket.on('new-donation', (data) => {
      if (configRef.current?.overlayEnabled === false) return;

      const donationWithTime = { ...data, receivedAt: data.receivedAt || new Date().toISOString() };
      setAlert(donationWithTime);
      setProgress(100);

      const soundToPlay = data.soundUrl || configRef.current?.soundUrl;
      if (soundToPlay && audioRef.current) {
        audioRef.current.src = soundToPlay;
        audioRef.current.play().catch(() => {});
      }

      const duration = getAlertDuration(configRef.current, data.amount);

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed   = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining <= 0) clearInterval(progressIntervalRef.current);
      }, 50);

      dismissTimerRef.current = setTimeout(() => {
        setAlert(null);
        setProgress(100);
      }, duration);
    });

    socket.on('settings-updated', (newConfig) => {
      setConfig(newConfig);
      configRef.current = newConfig;
      if (newConfig.overlayEnabled === false) {
        setAlert(null);
        setProgress(100);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      }
    });

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

  if (!config) return null;
  if (config.overlayEnabled === false) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  const bg          = config.primaryColor   || '#6366f1';
  const fg          = config.textColor      || '#ffffff';
  const borderColor = config.borderColor    || 'rgba(255,255,255,0.15)';
  const theme       = config.theme          || 'modern';
  const highlight   = config.highlightColor || '#a5b4fc';
  const animation   = config.animation      || 'bounce';
  const maxW        = config.maxWidth       || 340;
  const customIcon  = config.customIcon     || '';
  const showTs      = config.showTimestamp  !== false;

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
      exit:    { opacity: 0, y: -8,  transition: { duration: 0.3 } },
    },
  };

  const anim = animVariants[animation] || animVariants.bounce;

  // ── Media — semua borderRadius: 0 ───────────────────────────────────────────
  // const renderMedia = () => {
  //   return null
  // }

  const renderTimestamp = () => {
    if (!showTs || !alert?.receivedAt) return null;
    return (
      <div style={{ fontSize: 14, opacity: 0.55, fontFamily: 'monospace', letterSpacing: '0.04em', marginTop: 4 }}>
        🕐 {formatTimestamp(alert.receivedAt)}
      </div>
    );
  };

  const renderProgressBar = () => (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.15)' }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: highlight,
        transition: 'width 50ms linear',
      }} />
    </div>
  );

  // ── Render per tema — semua borderRadius: 0 ──────────────────────────────────
  const renderInner = () => {

    // MODERN
    if (theme === 'modern') {
      return (
        <>
          <div style={{ padding: '16px 18px 12px' }}>
            {/* {renderMedia()} */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: 0,                              // ← no radius
                background: 'rgba(255,255,255,0.12)',
                border: `1px solid rgba(255,255,255,0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {renderIcon(customIcon, 30)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className='font-bold' style={{
                  fontSize: 24, fontWeight: 800, opacity: 0.65,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
                  color: fg, fontWeight: 900
                }}>
                  Donasi Masuk
                </div>
                <div className='font-bold' style={{ fontSize: 24, fontWeight: 900, color: fg, opacity: 0.8, marginBottom: 2, fontWeight: 900 }}>
                  @{alert.donorName}
                </div>
                <div className='font-bold' style={{
                  fontSize: 24, fontWeight: 900, color: highlight,
                  letterSpacing: '-0.3px', lineHeight: 1, fontWeight: 900
                }}>
                  Rp {Number(alert.amount).toLocaleString('id-ID')}
                </div>
                {alert.message && (
                  <div className='font-bold' style={{ fontSize: 24, color: fg, opacity: 0.7, marginTop: 5, lineHeight: 1.4, fontWeight: 900 }}>
                    "{alert.message}"
                  </div>
                )}
                {renderTimestamp()}
              </div>
            </div>
          </div>
          {renderProgressBar()}
        </>
      );
    }

    // CLASSIC
    if (theme === 'classic') {
      return (
        <>
          <div style={{ padding: '18px 22px 14px', borderLeft: `5px solid ${highlight}` }}>
            {/* {renderMedia()} */}
            <div style={{
              fontSize: 9, fontWeight: 900, opacity: 0.6,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              color: fg, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{renderIcon(customIcon, 14)}</span>
              Dukungan Masuk!
            </div>
            <div style={{ color: highlight, fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
              Rp {Number(alert.amount).toLocaleString('id-ID')}
            </div>
            <div style={{ color: fg, fontSize: 16, fontWeight: 900, marginTop: 3 }}>
              @{alert.donorName}
            </div>
            {alert.message && (
              <div style={{ color: fg, fontSize: 12, opacity: 0.75, marginTop: 6, fontStyle: 'italic' }}>
                "{alert.message}"
              </div>
            )}
            {renderTimestamp()}
          </div>
          {renderProgressBar()}
        </>
      );
    }

    // MINIMAL
    return (
      <>
        <div style={{ padding: '14px 18px 12px', borderLeft: `4px solid ${highlight}` }}>
          {/* {renderMedia()} */}
          <div style={{ color: highlight, fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
            Rp {Number(alert.amount).toLocaleString('id-ID')}
          </div>
          <div style={{ color: fg, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            @{alert.donorName}
          </div>
          {alert.message && (
            <div style={{ color: fg, fontSize: 11, opacity: 0.7, marginTop: 4, fontStyle: 'italic' }}>
              "{alert.message}"
            </div>
          )}
          {renderTimestamp()}
        </div>
        {renderProgressBar()}
      </>
    );
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', overflow: 'hidden',
    }}>
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
              borderRadius: 0,                               // ← no radius di wrapper
              border: theme === 'minimal' ? `2px solid ${highlight}` : `1px solid ${borderColor}`,
              boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
              overflow: 'hidden',
              fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
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