  import { AnimatePresence, motion } from 'framer-motion';
  import { useEffect, useRef, useState } from 'react';
  import { useParams } from 'react-router-dom';
  import { io } from 'socket.io-client';
  import axios from 'axios';

  const API_URL = 'https://server-dukungin-production.up.railway.app';

  // ── Helpers (sama persis) ────────────────────────────────────────────────────
  // const getYouTubeEmbedUrl = (url) => {
  //   if (!url) return null;
  //   const watchMatch  = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  //   if (watchMatch)  return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${watchMatch[1]}`;
  //   const shortMatch  = url.match(/youtu\.be\/([\w-]+)/);
  //   if (shortMatch)  return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${shortMatch[1]}`;
  //   const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
  //   if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${shortsMatch[1]}`;
  //   return null;
  // };

  const getYouTubeEmbedUrl = (url, startSeconds = 0) => {
    if (!url) return null;
    const start = startSeconds > 0 ? `&start=${Math.floor(startSeconds)}` : '';
    
    const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
    if (watchMatch) {
      const id = watchMatch[1];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=0&loop=1&playlist=${id}${start}`;
    }
    const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
    if (shortMatch) {
      const id = shortMatch[1];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=0&loop=1&playlist=${id}${start}`;
    }
    const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
    if (shortsMatch) {
      const id = shortsMatch[1];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=0&loop=1&playlist=${id}${start}`;
    }
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

  // ── MediaShareOverlay Component ───────────────────────────────────────────────
  const MediaShareOverlay = () => {
    const { token } = useParams();
    const videoRef = useRef(null);

    const [alert, setAlert]       = useState(null);
    const [config, setConfig]     = useState(null);
    const [progress, setProgress] = useState(100);

    const audioRef            = useRef(null);
    const configRef           = useRef(null);
    const progressIntervalRef = useRef(null);
    const dismissTimerRef     = useRef(null);

    // ── Fetch config ──────────────────────────────────────────────────────────
    useEffect(() => {
      if (!token) return;
      axios
        .get(`${API_URL}/api/overlay/config/${token}`)
        .then((res) => { setConfig(res.data); configRef.current = res.data; })
        .catch(() => console.error('[MediaShare] Invalid token'));
    }, [token]);

    // ── Socket (FIXED - join kedua room) ────────────────────────────────────────
    useEffect(() => {
      if (!token) return;

      const socket = io(API_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
      });

      // ✅ JOIN KEDUA ROOM
      socket.emit('join-room', token);
      socket.emit('join-room', `${token}-mediashare`);
      
      console.log(`[MediaShare] 🎬 Joined: ${token}, ${token}-mediashare`);

      socket.on('new-media-donation', (data) => {
        console.log('[MediaShare] 🎬 RECEIVED:', data.donorName);
        if (configRef.current?.overlayEnabled === false) return;

        const donationWithTime = {
          ...data,
          receivedAt: data.receivedAt || new Date().toISOString(),
        };

        setAlert(donationWithTime);
        setProgress(100);

        const soundToPlay = data.voiceUrl || data.soundUrl || configRef.current?.soundUrl;
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

      socket.on('mediashare-control', ({ action, volume }) => {
        if (action === 'skip') {
          // Langsung dismiss alert
          setAlert(null);
          setProgress(100);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
          // Set volume di video/iframe via ref
          if (videoRef.current) videoRef.current.src = '';
        }
        if (action === 'volume' && typeof volume === 'number') {
          if (audioRef.current) audioRef.current.volume = volume / 100;
          if (videoRef.current) videoRef.current.volume = volume / 100;
        }
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
        socket.off('new-media-donation');
        socket.off('settings-updated');
        socket.disconnect();
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      };
    }, [token]);

    if (!config) return null;
    if (config.overlayEnabled === false) {
      return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
    }

    // ── Styling (SAMA PERSIS OverlayAlert) ──────────────────────────────────────
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
        exit:    { opacity: 0, y: -8, transition: { duration: 0.3 } },
      },
    };
    const anim = animVariants[animation] || animVariants.bounce;

    // ── RENDER MEDIA (BARU - di atas content) ───────────────────────────────────
    const renderMedia = () => {
      if (!alert?.mediaUrl) return null;
      const t = detectMediaType(alert.mediaUrl, alert.mediaType);

      return (
        <div style={{ 
          width: '100%', 
          aspectRatio: '16/9', 
          overflow: 'hidden', 
          background: '#000',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {t === 'youtube' && (
            <iframe
              src={getYouTubeEmbedUrl(alert.mediaUrl, alert.startTime || 0)}  // ← pakai startTime dari data donasi
              width="100%" height="100%"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ display: 'block', border: 'none' }}
            />
          )}
          {t === 'video' && (
            <video
              ref={videoRef}
              src={alert.mediaUrl}
              autoPlay loop muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {t === 'image' && (
            <img
              src={alert.mediaUrl}
              alt="media"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      );
    };

    const renderTimestamp = () => {
      if (!showTs || !alert?.receivedAt) return null;
      return (
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
          🕐 {formatTimestamp(alert.receivedAt)}
        </div>
      );
    };

    // ── RENDER INNER (SAMA PERSIS OverlayAlert + Media Share label) ─────────────
    const renderInner = () => {
      // ── MODERN (SAMA PERSIS + Media Share badge) ───────────────────────────────
      if (theme === 'modern') {
        return (
          <>
            {renderMedia()} {/* ✅ MEDIA DI ATAS */}

            <div style={{ height: 4, background: highlight }} />
            <div style={{ padding: '14px 16px 0px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42,
                background: 'rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
                marginTop: 7
              }}>
                {renderIcon(customIcon, 22)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(0,0,0,0.25)',
                  padding: '2px 8px',
                  fontSize: 26, fontWeight: 900, color: highlight,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  marginBottom: 6,
                }}>
                  <span style={{ width: 4, height: 4, background: '#22c55e', borderRadius: '50%' }} />
                  🎬 Media Share
                </div>

                <div style={{ fontSize: 26, fontWeight: 900, color: fg, lineHeight: 1.2, marginBottom: 2 }}>
                  @{alert.donorName}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: highlight, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 5 }}>
                  Rp {Number(alert.amount).toLocaleString('id-ID')}
                </div>
                {alert.message && (
                  <div style={{ fontSize: 26, color: fg, lineHeight: 1.4 }}>
                    "{alert.message}"
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px 10px',
              background: 'rgba(0,0,0,0.2)',
              marginTop: 10,
            }}>
              {renderTimestamp()}
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.15)', marginLeft: 12 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: highlight, transition: 'width 50ms linear' }} />
              </div>
            </div>
          </>
        );
      }

      // ── CLASSIC (SAMA PERSIS + Media Share header) ─────────────────────────────
      if (theme === 'classic') {
        return (
          <>
            {renderMedia()} {/* ✅ MEDIA DI ATAS */}

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '9px 14px',
              display: 'flex', alignItems: 'center', gap: 9,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ fontSize: 26, position: 'relative', top: -3 }}>{renderIcon(customIcon, 18)}</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: highlight, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                🎬 Media Share!
              </span>
            </div>
            
            <div style={{ padding: '12px 14px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: fg }}>@{alert.donorName}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: highlight, letterSpacing: '-0.5px' }}>
                  Rp {Number(alert.amount).toLocaleString('id-ID')}
                </div>
              </div>
              {alert.message && (
                <div style={{
                  fontSize: 26, color: fg,
                  lineHeight: 1.4, padding: '6px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderLeft: `2px solid ${highlight}`,
                }}>
                  {alert.message}
                </div>
              )}
              {renderTimestamp()}
              <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', marginTop: 10 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: highlight, transition: 'width 50ms linear' }} />
              </div>
            </div>
          </>
        );
      }

      // ── MINIMAL (SAMA PERSIS + Media Share label) ──────────────────────────────
      return (
        <>
          {renderMedia()} {/* ✅ MEDIA DI ATAS */}

          <div style={{ padding: '14px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: highlight, letterSpacing: '-1px', lineHeight: 1 }}>
                Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                🎬 Media
              </div>
            </div>

            <div style={{ fontSize: 26, fontWeight: 900, color: fg, marginBottom: 3 }}>
              @{alert.donorName}
            </div>

            {alert.message && (
              <div style={{ fontSize: 26, color: fg, lineHeight: 1.35 }}>
                "{alert.message}"
              </div>
            )}

            {renderTimestamp()}

            <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', marginTop: 10 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: highlight, transition: 'width 50ms linear' }} />
            </div>
          </div>
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
                backgroundColor: bg,
                color: fg,
                width: `${maxW}px`,
                borderRadius: 0,
                border: `1px solid ${borderColor}`,
                boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
              }}
            >
              {renderInner()}
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: transparent !important; }
        `}</style>
      </div>
    );
  };

  export default MediaShareOverlay;