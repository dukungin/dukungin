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
  if (mediaType === 'video' || /\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  if (mediaType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
  return 'image';
};

const formatTimestamp = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const renderIcon = (customIcon, size = 20) => {
  if (!customIcon) return '💜';
  if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
    return <img src={customIcon} alt="icon" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }} />;
  }
  return customIcon;
};

const getAlertDuration = (config, amount) => {
  if (!config) return 8000;
  const tiers = config.durationTiers || [];
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
    for (const tier of sorted) {
      if (amount >= tier.minAmount && (tier.maxAmount === null || amount <= tier.maxAmount)) {
        return tier.duration * 1000;
      }
    }
  }
  return (config.baseDuration || 8) * 1000;
};

const OverlayAlert = () => {
  const { token } = useParams();
  const [alert, setAlert] = useState(null);
  const [config, setConfig] = useState(null);
  const [progress, setProgress] = useState(100);

  const audioRef = useRef(null);
  const configRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const dismissTimerRef = useRef(null);

  // Ambil config
  useEffect(() => {
    if (!token) return;
    axios.get(`https://server-dukungin-production.up.railway.app/api/overlay/config/${token}`)
      .then((res) => {
        setConfig(res.data);
        configRef.current = res.data;
      })
      .catch(() => console.error('[Overlay] Invalid token'));
  }, [token]);

  // Socket connection
  useEffect(() => {
    if (!token) return;
    const socket = io('https://server-dukungin-production.up.railway.app', { reconnection: true });

    socket.emit('join-room', token);

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
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining <= 0) clearInterval(progressIntervalRef.current);
      }, 50);

      dismissTimerRef.current = setTimeout(() => {
        setAlert(null);
        setProgress(100);
      }, duration);
    });

    return () => {
      socket.disconnect();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [token]);

  if (!config) return null;
  if (config.overlayEnabled === false) return <div className="w-screen h-screen bg-transparent" />;

  const bg           = config.primaryColor    || '#6366f1';
  const highlight    = config.highlightColor  || '#a5b4fc';   // Warna Nominal
  const fg           = config.textColor       || '#ffffff';
  const borderColor  = config.borderColor     || 'rgba(255,255,255,0.25)';
  const theme        = config.theme           || 'modern';
  const maxW         = config.maxWidth        || 340;
  const customIcon   = config.customIcon      || '';
  const showTimestamp = config.showTimestamp  !== false;

  const animVariants = {
    bounce: { initial: { scale: 0.5, opacity: 0, y: 40 }, animate: { scale: [0.5, 1.08, 1], opacity: 1, y: 0 }, exit: { scale: 0.8, opacity: 0 } },
    'slide-left': { initial: { x: -80, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -60, opacity: 0 } },
    'slide-right': { initial: { x: 80, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 60, opacity: 0 } },
    fade: { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } },
  };

  const anim = animVariants[config.animation] || animVariants.bounce;

  const renderMedia = () => {
    if (!alert?.mediaUrl) return null;
    const type = detectMediaType(alert.mediaUrl, alert.mediaType);
    if (type === 'youtube') {
      return <iframe src={getYouTubeEmbedUrl(alert.mediaUrl)} className="w-full aspect-video rounded-xl" allowFullScreen />;
    }
    if (type === 'video') {
      return <video src={alert.mediaUrl} autoPlay loop className="w-full rounded-xl" />;
    }
    return <img src={alert.mediaUrl} alt="media" className="w-full rounded-xl max-h-[220px] object-cover" />;
  };

  const renderTimestamp = () => showTimestamp && alert?.receivedAt && (
    <div className="text-[9px] opacity-60 font-mono mt-1">🕐 {formatTimestamp(alert.receivedAt)}</div>
  );

  const renderInner = () => {
    if (theme === 'modern') {
      return (
        <div className="p-5">
          {renderMedia()}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              {renderIcon(customIcon, 28)}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-xs font-bold opacity-75 tracking-widest">DONASI MASUK!</div>
              <div style={{ color: highlight }} className="font-black text-xl mt-1">
                @{alert.donorName} • Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>
              {alert.message && <div className="text-sm mt-1 opacity-90">"{alert.message}"</div>}
              {renderTimestamp()}
            </div>
          </div>
        </div>
      );
    }

    if (theme === 'classic') {
      return (
        <div className="p-6 border-l-4" style={{ borderColor: highlight }}>
          {renderMedia()}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl">{renderIcon(customIcon)}</span>
            <div>
              <div className="text-xs opacity-60">DONASI MASUK</div>
              <div style={{ color: highlight }} className="font-black text-2xl">
                Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>
              <div className="font-bold">@{alert.donorName}</div>
            </div>
          </div>
          {alert.message && <div className="mt-3 text-sm opacity-80 italic">"{alert.message}"</div>}
          {renderTimestamp()}
        </div>
      );
    }

    // Minimal Theme
    return (
      <div className="p-5" style={{ background: 'rgba(0,0,0,0.75)', borderLeft: `4px solid ${highlight}` }}>
        {renderMedia()}
        <div style={{ color: highlight }} className="font-black text-3xl">
          Rp {Number(alert.amount).toLocaleString('id-ID')}
        </div>
        <div className="text-lg font-bold mt-1">@{alert.donorName}</div>
        {alert.message && <div className="mt-2 text-sm opacity-90">"{alert.message}"</div>}
        {renderTimestamp()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent pointer-events-none">
      <audio ref={audioRef} />

      <AnimatePresence>
        {alert && (
          <motion.div
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            style={{
              backgroundColor: theme === 'minimal' ? 'transparent' : bg,
              color: fg,
              width: `${maxW}px`,
              maxWidth: '96vw',
              borderRadius: theme === 'modern' ? '20px' : theme === 'classic' ? '8px' : '4px',
              border: `2px solid ${borderColor}`,
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
              overflow: 'hidden',
            }}
            className="pointer-events-auto"
          >
            {renderInner()}
            
            {/* Progress Bar */}
            <div className="h-1 bg-black/20">
              <div
                className="h-1 transition-all duration-75"
                style={{ width: `${progress}%`, backgroundColor: highlight }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverlayAlert;