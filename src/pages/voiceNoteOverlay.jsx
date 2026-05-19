// components/VoiceNoteOverlay.jsx
// Overlay OBS khusus voice note donations
// Pasang di OBS: http://localhost:5173/overlay/voice/:token

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';

const formatRp = (n) => {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}jt`;
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}K`;
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
};

// Visualizer bar animasi
const AudioVisualizer = ({ isPlaying, color = '#a5b4fc' }) => {
  const bars = Array.from({ length: 20 });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
      {bars.map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: color,
            height: isPlaying ? `${20 + Math.sin((Date.now() / 200 + i) * 1.5) * 14}%` : '20%',
            animation: isPlaying ? `voiceBar${i % 5} ${0.4 + (i % 5) * 0.08}s ease-in-out infinite alternate` : 'none',
            opacity: isPlaying ? 1 : 0.3,
            transition: 'opacity 0.3s',
          }}
        />
      ))}
      <style>{`
        @keyframes voiceBar0 { from { height: 20%; } to { height: 85%; } }
        @keyframes voiceBar1 { from { height: 35%; } to { height: 70%; } }
        @keyframes voiceBar2 { from { height: 50%; } to { height: 95%; } }
        @keyframes voiceBar3 { from { height: 25%; } to { height: 75%; } }
        @keyframes voiceBar4 { from { height: 40%; } to { height: 60%; } }
      `}</style>
    </div>
  );
};

const VoiceNoteOverlay = () => {
  const { token } = useParams();
  const [config, setConfig] = useState(null);
  const [alert, setAlert] = useState(null);
  const [progress, setProgress] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);

  // ✅ LETAKKAN DI SINI — sebelum conditional return apapun
  useEffect(() => {
    const unlock = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        audioRef.current.pause();
      }
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        audioRef.current.pause();
      }
    }, 500);

    return () => document.removeEventListener('click', unlock);
  }, []);

  const configRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const audioProgressRef = useRef(null);
  const dismissTimerRef = useRef(null);

  // Load config
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BASE_URL}/api/overlay/config/${token}`)
      .then((res) => {
        setConfig(res.data);
        configRef.current = res.data;
      })
      .catch(() => console.error('[VoiceOverlay] Invalid token'));
  }, [token]);

  // Audio progress tracker
  const startAudioProgress = useCallback(() => {
    if (audioProgressRef.current) clearInterval(audioProgressRef.current);
    audioProgressRef.current = setInterval(() => {
      if (!audioRef.current) return;
      const { currentTime, duration } = audioRef.current;
      if (duration > 0) {
        setAudioProgress((currentTime / duration) * 100);
      }
    }, 100);
  }, []);

  const stopAudioProgress = useCallback(() => {
    if (audioProgressRef.current) clearInterval(audioProgressRef.current);
    setAudioProgress(0);
    setIsPlaying(false);
  }, []);

  // Socket
  useEffect(() => {
    if (!token) return;

    const socket = io(BASE_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.emit('join-room', `${token}-voice`);

    socket.on('reconnect', () => {
      socket.emit('join-room', `${token}-voice`);
    });

    socket.on('new-voice-donation', (data) => {
      if (configRef.current?.overlayEnabled === false) return;

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      stopAudioProgress();

      // FIX: pastikan voiceUrl absolute
      const absoluteVoiceUrl = data.voiceUrl?.startsWith('http')
        ? data.voiceUrl
        : data.voiceUrl ? `${BASE_URL}${data.voiceUrl}` : null;

      const donationData = {
        ...data,
        voiceUrl: absoluteVoiceUrl,
        receivedAt: data.receivedAt || new Date().toISOString(),
      };

      setAlert(donationData);
      setProgress(100);
      setAudioProgress(0);
      setIsPlaying(false);

      const TOTAL_DURATION = 33000;

      setTimeout(() => {
        if (absoluteVoiceUrl && audioRef.current) {
          audioRef.current.src = absoluteVoiceUrl;
          audioRef.current.load();

          audioRef.current.onloadedmetadata = () => {
            setAudioDuration(Math.min(audioRef.current.duration, 30));
          };
          audioRef.current.onplay = () => {
            setIsPlaying(true);
            startAudioProgress();
          };
          audioRef.current.onended = () => {
            stopAudioProgress();
            setIsPlaying(false);
          };
          audioRef.current.onerror = () => {
            stopAudioProgress();
            setIsPlaying(false);
          };

          audioRef.current.play().catch(() => setIsPlaying(false));

          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            stopAudioProgress();
            setIsPlaying(false);
          }, 30000);
        }
      }, 1000);

      // Progress bar countdown
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / TOTAL_DURATION) * 100);
        setProgress(remaining);
        if (remaining <= 0) clearInterval(progressIntervalRef.current);
      }, 50);

      // Auto dismiss
      dismissTimerRef.current = setTimeout(() => {
        setAlert(null);
        setProgress(100);
        setAudioProgress(0);
        setIsPlaying(false);
        stopAudioProgress();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      }, TOTAL_DURATION);
    });

    socket.on('settings-updated', (newConfig) => {
      setConfig(newConfig);
      configRef.current = newConfig;
    });

    return () => {
      socket.off('new-voice-donation');
      socket.off('settings-updated');
      socket.disconnect();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (audioProgressRef.current) clearInterval(audioProgressRef.current);
    };
  }, [token, startAudioProgress, stopAudioProgress]);

  if (!config) return null;
  if (config.overlayEnabled === false) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  const bg = config.primaryColor || '#6366f1';
  const fg = config.textColor || '#ffffff';
  const highlight = config.highlightColor || '#a5b4fc';
  const borderColor = config.borderColor || 'rgba(255,255,255,0.15)';
  const animation = config.animation || 'bounce';
  const maxW = config.maxWidth || 340;

  const animVariants = {
    bounce: {
      initial: { scale: 0.5, opacity: 0, y: 40 },
      animate: { scale: [0.5, 1.08, 1], opacity: 1, y: 0, transition: { duration: 0.5 } },
      exit: { scale: 0.8, opacity: 0, transition: { duration: 0.3 } },
    },
    'slide-left': {
      initial: { x: -80, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: { duration: 0.4 } },
      exit: { x: -60, opacity: 0, transition: { duration: 0.3 } },
    },
    'slide-right': {
      initial: { x: 80, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: { duration: 0.4 } },
      exit: { x: 60, opacity: 0, transition: { duration: 0.3 } },
    },
    fade: {
      initial: { opacity: 0, y: -12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit: { opacity: 0, y: -8, transition: { duration: 0.3 } },
    },
  };

  const anim = animVariants[animation] || animVariants.bounce;

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
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
            }}
          >
            {/* Accent bar atas */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${highlight}, ${bg})` }} />

            {/* Badge Voice Message */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px 0',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.25)',
                padding: '3px 10px',
                fontSize: 11, fontWeight: 900, color: highlight,
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isPlaying ? '#22c55e' : highlight,
                  display: 'inline-block',
                  boxShadow: isPlaying ? `0 0 6px #22c55e` : 'none',
                  transition: 'all 0.3s',
                }} />
                {isPlaying ? '🎙️ Memutar Voice...' : '🎙️ Voice Donation'}
              </div>
            </div>

            {/* Konten utama */}
            <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {/* Icon mic */}
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                background: 'rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginTop: 4,
              }}>
                🎙️
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: fg, lineHeight: 1.2, marginBottom: 2 }}>
                  {alert.donorName}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: highlight, letterSpacing: '-0.5px', marginBottom: 6 }}>
                  {formatRp(alert.amount)}
                </div>

                {/* Pesan teks jika ada */}
                {alert.message && (
                  <div style={{
                    fontSize: 13, color: fg, lineHeight: 1.4,
                    opacity: 0.85, marginBottom: 8,
                  }}>
                    "{alert.message}"
                  </div>
                )}

                {/* Audio visualizer + progress */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '8px 10px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {/* Visualizer bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AudioVisualizer isPlaying={isPlaying} color={highlight} />
                    <span style={{
                      fontSize: 11, color: isPlaying ? '#22c55e' : 'rgba(255,255,255,0.4)',
                      fontFamily: 'monospace', fontWeight: 700,
                      transition: 'color 0.3s',
                    }}>
                      {isPlaying ? 'PLAYING' : 'READY'}
                    </span>
                  </div>

                  {/* Audio progress bar */}
                  <div style={{ height: 2, background: 'rgba(255,255,255,0.1)' }}>
                    <div style={{
                      height: '100%',
                      width: `${audioProgress}%`,
                      background: isPlaying ? '#22c55e' : highlight,
                      transition: 'width 100ms linear, background 0.3s',
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer + overlay progress */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px 10px',
              background: 'rgba(0,0,0,0.2)',
              marginTop: 6,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                VOICE · {alert.receivedAt ? new Date(alert.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.1)', marginLeft: 10 }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: highlight, transition: 'width 50ms linear',
                }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceNoteOverlay;