  import { AnimatePresence, motion } from 'framer-motion';
  import { useEffect, useRef, useState } from 'react';
  import { useParams } from 'react-router-dom';
  import { io } from 'socket.io-client';
  import axios from 'axios';

  const API_URL = 'https://server-dukungin-production.up.railway.app';

  const getYouTubeEmbedUrl = (url, startSeconds = 0) => {
    if (!url) return null;
    
    // ✅ Return as-is jika sudah embed URL
    if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
      if (startSeconds > 0 && !url.includes('&start=')) {
        return url + (url.includes('?') ? '&' : '?') + `start=${Math.floor(startSeconds)}`;
      }
      return url;
    }
    
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
    
    // ✅ Handle YouTube embed URL
    if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return 'youtube';
    
    // Regular YouTube URLs
    if (url.match(/youtube\.com\/watch\?v=/) || 
        url.match(/youtu\.be\//) || 
        url.match(/youtube\.com\/shorts\//)) {
      return 'youtube';
    }
    
    // File types
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

const calculateMediaShareDuration = (config, amount) => {
  if (!config || !amount || amount <= 0) return 15000;

  const base = Number(config.mediaShareBaseDuration) || 15;
  const perAmount = Number(config.mediaShareExtraPerAmount) || 10000;
  const extraDur = Number(config.mediaShareExtraDuration) || 10;

  const extras = perAmount > 0 ? Math.floor(amount / perAmount) : 0;
  const totalSeconds = base + (extras * extraDur);

  console.log(`[MediaShare Duration] Rp ${amount.toLocaleString('id-ID')} → ${base} + ${extras}×${extraDur} = ${totalSeconds} detik`);

  return totalSeconds * 1000;
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
    const [mediaError, setMediaError] = useState(false);

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
      
      console.log(`[MediaShare] Joined: ${token}, ${token}-mediashare`);

      socket.on('new-media-donation', (data) => {
        console.log('[MediaShare] RECEIVED:', data.donorName, 'Rp', data.amount);

        if (configRef.current?.overlayEnabled === false) return;

        const donationWithTime = {
          ...data,
          receivedAt: data.receivedAt || new Date().toISOString(),
        };

        setAlert(donationWithTime);
        setProgress(100);
        setMediaError(false); // ← tambah ini

        // Sound
        const soundToPlay = data.voiceUrl || data.soundUrl || configRef.current?.soundUrl;
        if (soundToPlay && audioRef.current) {
          audioRef.current.src = soundToPlay;
          audioRef.current.play().catch(() => {});
        }

        // ✅ DURASI
        const duration = calculateMediaShareDuration(configRef.current, Number(donationWithTime.amount));

        // Clear timer lama
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

        const startTime = Date.now();

        progressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          setProgress(remaining);
          if (remaining <= 0) clearInterval(progressIntervalRef.current);
        }, 40); // lebih smooth

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

    const BlockedPlaceholder = ({ hl }) => (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        gap: 10,
      }}>
        <span style={{ fontSize: 34 }}>⚠️</span>
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 12,
          fontWeight: 700,
          color: '#ff4444',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '0 16px',
        }}>
          Video Melanggar Kebijakan
        </span>
      </div>
    );

    const MediaBlock = ({ pixelBorder, hl }) => {
      if (!alert?.mediaUrl) return null;

      // ← CEK FLAG DARI SOCKET
      if (alert.videoBlocked || mediaError) {
        return (
          <div style={{
            borderBottom: pixelBorder || '1px solid rgba(255,255,255,0.05)',
            position: 'relative', zIndex: 2,
          }}>
            <BlockedPlaceholder hl={hl} />
          </div>
        );
      }

      const t = detectMediaType(alert.mediaUrl, alert.mediaType);

      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          background: '#000',
          borderBottom: pixelBorder || '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          zIndex: 2,
        }}>
          {t === 'youtube' && (
            <iframe
              key={alert.mediaUrl}
              src={getYouTubeEmbedUrl(alert.mediaUrl, alert.startTime || 0)}
              width="100%" height="100%"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ display: 'block', border: 'none' }}
              onError={() => setMediaError(true)}
            />
          )}
          {t === 'video' && (
            <video
              ref={videoRef}
              src={alert.mediaUrl}
              autoPlay loop muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setMediaError(true)}
            />
          )}
          {t === 'image' && (
            <img
              src={alert.mediaUrl}
              alt="media"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setMediaError(true)}
            />
          )}
        </div>
      );
    };

    const renderInner = () => {
      const hl = highlight;
      const monospace = "'Courier New', 'Lucida Console', monospace";

      const scanlineStyle = {
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        pointerEvents: 'none', zIndex: 1,
      };

      const pixelBorder = `2px solid ${hl}`;
      const dimBorder = `1px solid ${hl}35`;

      // Media player (sama di semua tema, selalu di atas)
      // const MediaBlock = () => {
      //   if (!alert?.mediaUrl) return null;
      //   const t = detectMediaType(alert.mediaUrl, alert.mediaType);
      //   return (
      //     <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#000', borderBottom: pixelBorder, position: 'relative', zIndex: 2 }}>
      //       {t === 'youtube' && (
      //         <iframe src={getYouTubeEmbedUrl(alert.mediaUrl, alert.startTime || 0)}
      //           width="100%" height="100%" frameBorder="0"
      //           allow="autoplay; encrypted-media" allowFullScreen
      //           style={{ display: 'block', border: 'none' }} />
      //       )}
      //       {t === 'video' && (
      //         <video ref={videoRef} src={alert.mediaUrl} autoPlay loop muted
      //           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      //       )}
      //       {t === 'image' && (
      //         <img src={alert.mediaUrl} alt="media"
      //           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      //       )}
      //     </div>
      //   );
      // };

      // ── MODERN ───────────────────────────────────────────────────────────────────
      if (theme === 'modern') {
        return (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={scanlineStyle} />
            <MediaBlock hl={hl} />

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: hl + '18', borderBottom: pixelBorder,
              padding: '5px 10px', position: 'relative', zIndex: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: monospace, fontSize: 23, color: hl, letterSpacing: '-1px' }}>(o_o)</span>
                <span style={{ fontFamily: monospace, fontSize:16, color: hl, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700 }}>
                  Media share
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['#ff4444', '#ffaa00', hl].map((c, i) => (
                  <span key={i} style={{ width: 7, height: 7, background: c, display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 12px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, border: pixelBorder, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 23, background: hl + '12',
                }}>
                  {renderIcon(customIcon, 20)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: monospace, fontSize: 10, color: fg, marginBottom: 2, letterSpacing: '0.1em' }}>{'> DONOR:'}</div>
                  <div style={{ fontFamily: monospace, fontSize: 17, fontWeight: 900, color: fg, lineHeight: 1.1 }}>{alert.donorName}</div>
                </div>
              </div>

              <div style={{
                fontFamily: monospace, fontSize: 24, fontWeight: 900, color: hl,
                letterSpacing: '-1px', lineHeight: 1, borderLeft: `3px solid ${hl}`,
                paddingLeft: 8, marginBottom: 6, textShadow: `0 0 10px ${hl}55`,
              }}>
                Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>

              {alert.message && (
                <div style={{
                  fontFamily: monospace, fontSize: 23, color: fg, fontWeight: 900,
                  background: 'rgba(255,255,255,0.04)', border: dimBorder,
                  padding: '5px 8px', lineHeight: 1.4, marginBottom: 6,
                }}>
                  {'>> '}{alert.message}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                {showTs && alert?.receivedAt
                  ? <div style={{ fontFamily: monospace, fontSize:16, color: 'rgba(255,255,255,0.35)' }}>{'> '}{formatTimestamp(alert.receivedAt)}</div>
                  : <div />
                }
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} style={{ width: 6, height: 6, display: 'inline-block', background: i < Math.round(progress / 12.5) ? hl : hl + '22' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── SMOOTH ───────────────────────────────────────────────────────────────────
      if (theme === 'smooth') {
        return (
          <div style={{ fontFamily: "'Poppins', sans-serif", overflow: 'hidden' }}>
            {/* Media block tanpa border pixel */}
            <MediaBlock hl={hl} />

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Icon + Nama */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: hl + '22', border: `1.5px solid ${hl}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {renderIcon(customIcon, 18)}
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 500, color: fg, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>
                    Media share
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: fg }}>
                    {alert.donorName}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: hl + '25', borderRadius: 99 }} />

              {/* Amount */}
              <div style={{ fontSize: 26, fontWeight: 800, color: hl, letterSpacing: '-0.5px', lineHeight: 1 }}>
                Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>

              {/* Pesan */}
              {alert.message && (
                <div style={{
                  fontSize: 24, color: fg, fontWeight: 900,
                  background: hl + '10', borderRadius: 8, padding: '6px 10px',
                  lineHeight: 1.5, border: `1px solid ${hl}20`,
                }}>
                  {alert.message}
                </div>
              )}

              {/* Timestamp + Progress */}
              {showTs && alert?.receivedAt && (
                <div style={{ fontSize: 22, color: fg }}>
                  {formatTimestamp(alert.receivedAt)}
                </div>
              )}
              <div style={{ height: 3, background: hl + '25', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: hl, borderRadius: 99, transition: 'width 50ms linear' }} />
              </div>
            </div>
          </div>
        );
      }

      // ── CLASSIC ──────────────────────────────────────────────────────────────────
      if (theme === 'classic') {
        return (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={scanlineStyle} />
            <MediaBlock hl={hl} />
            <div style={{ height: 3, background: hl, position: 'relative', zIndex: 2 }} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', position: 'relative', zIndex: 2 }} />

            <div style={{
              background: hl + '15', borderBottom: `1px solid ${hl}40`,
              padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', zIndex: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 16 }}>{renderIcon(customIcon, 16)}</span>
                <span style={{ fontFamily: monospace, fontSize: 10, fontWeight: 700, color: hl, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  Media share 
                </span>
              </div>
              <span style={{ fontFamily: monospace, fontSize: 23, color: hl, letterSpacing: '-1px' }}>(o_o)</span>
            </div>

            <div style={{ padding: '10px 12px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, borderBottom: `1px dashed ${hl}30`, paddingBottom: 6 }}>
                <span style={{ fontFamily: monospace, fontSize:16, color: hl, letterSpacing: '0.12em' }}>NAME</span>
                <span style={{ fontFamily: monospace, fontSize: 16, fontWeight: 900, color: fg }}>{alert.donorName}</span>
              </div>

              <div style={{ fontFamily: monospace, fontSize: 22, fontWeight: 900, color: hl, letterSpacing: '-0.5px', marginBottom: 5, textShadow: `0 0 10px ${hl}50` }}>
                Rp {Number(alert.amount).toLocaleString('id-ID')}
              </div>

              {alert.message && (
                <div style={{ fontFamily: monospace, fontSize: 23, color: fg, lineHeight: 1.45, borderLeft: `2px solid ${hl}`, paddingLeft: 8, marginBottom: 6 }}>
                  {alert.message}
                  <span style={{ color: hl, animation: 'blink 1s step-end infinite' }}>▮</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                {showTs && alert?.receivedAt
                  ? <div style={{ fontFamily: monospace, fontSize:16, color: 'rgba(255,255,255,0.35)' }}>{'> '}{formatTimestamp(alert.receivedAt)}</div>
                  : <div />
                }
                <div style={{ fontFamily: monospace, fontSize: 8, color: hl, letterSpacing: '0.08em' }}>[ PRESS ▲ TO CONTINUE ]</div>
              </div>

              <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', marginTop: 8 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: hl, transition: 'width 50ms linear' }} />
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ height: 3, background: hl }} />
            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
          </div>
        );
      }

      // ── MINIMAL ──────────────────────────────────────────────────────────────────
      return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={scanlineStyle} />
          <MediaBlock hl={hl} />
          <div style={{ padding: '10px 12px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: monospace, fontSize: 23, color: hl, letterSpacing: '-1px' }}>(o_o)</span>
                <span style={{ fontFamily: monospace, fontSize: 8, color: hl, letterSpacing: '0.18em', textTransform: 'uppercase' }}>MEDIA</span>
              </div>
              <span style={{ fontFamily: monospace, fontSize: 23, fontWeight: 900, color: hl, letterSpacing: '-1px', textShadow: `0 0 8px ${hl}50` }}>
                Rp {Number(alert.amount).toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ fontFamily: monospace, fontSize: 15, fontWeight: 900, color: fg, marginBottom: 3, borderBottom: `1px solid ${hl}20`, paddingBottom: 5 }}>
              {'> '}{alert.donorName}
            </div>

            {alert.message && (
              <div style={{ fontFamily: monospace, fontSize: 10, color: fg, lineHeight: 1.4, marginBottom: 4 }}>
                {alert.message}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {showTs && alert?.receivedAt
                ? <div style={{ fontFamily: monospace, fontSize:16, color: 'rgba(255,255,255,0.35)' }}>{'> '}{formatTimestamp(alert.receivedAt)}</div>
                : <div />
              }
              <div style={{ fontFamily: monospace, fontSize: 8, color: hl, letterSpacing: '2px' }}>{'- - - - - - - -'}</div>
            </div>

            <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', marginTop: 6 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: hl, transition: 'width 50ms linear' }} />
            </div>
          </div>
        </div>
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
                borderRadius: theme === 'smooth' ? 20 : 0,
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