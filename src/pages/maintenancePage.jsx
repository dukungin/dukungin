import { useEffect, useState } from 'react';

const MaintenancePage = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(30);
  const [lastCheck, setLastCheck] = useState('Baru saja');

  const handleRetry = () => {
    setLastCheck(new Date().toLocaleTimeString('id-ID'));
    setCountdown(30);
    onRetry();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { handleRetry(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.round((countdown / 30) * 100);

  const marqueeItems = [
    'Maintenance Mode', 'Server Down', 'Sedang Diperbaiki',
    'Akan Segera Kembali', 'Maaf Atas Ketidaknyamanannya',
  ];

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Bebas+Neue&family=Space+Mono&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .maint-btn:hover { border-color: #fda4af !important; color: #fda4af !important; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#0a0b10',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem 0rem', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, border: '1px solid rgba(253,164,175,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '22px auto 1.5rem', position: 'relative',
        }}>
          <div style={{
            width: 52, height: 52, border: '1px solid rgba(253,164,175,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 22 }}>🚧</span>
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          padding: '5px 14px', marginBottom: '1.5rem',
        }}>
          <span style={{
            width: 6, height: 6, background: '#f87171', borderRadius: '50%',
            animation: 'blink 1.4s infinite', display: 'inline-block',
          }} />
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f87171',
          }}>
            Server sedang pemeliharaan
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(42px, 8vw, 64px)',
          letterSpacing: '0.02em', color: '#f8fafc', lineHeight: 0.95, marginBottom: '0.75rem',
        }}>
          PERBAIKAN <span style={{ color: '#fda4af' }}>SISTEM</span>
        </h1>

        {/* <p style={{
          fontSize: 13, color: '#64748b', lineHeight: 1.7,
          maxWidth: 340, margin: '0 auto 2rem',
        }}>
          Server kami mengalami gangguan sementara. Tim teknis sedang bekerja keras memulihkannya.
        </p> */}

        {/* Info card */}
        <div style={{
          width: '100%', maxWidth: 400,
          width: '88vw',
          border: '1px solid #1b1e2b', background: '#12141d', marginBottom: '1.75rem',
        }}>
          {[
            { label: 'API Server', val: 'Tidak terjangkau', color: '#f87171' },
            { label: 'Terakhir dicek', val: lastCheck, color: '#64748b' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderBottom: '1px solid #1b1e2b', fontSize: 12,
            }}>
              <span style={{ color: '#475569' }}>{label}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color }}>{val}</span>
            </div>
          ))}
          {/* Progress row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', fontSize: 12,
          }}>
            <span style={{ color: '#475569' }}>Cek ulang</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
              <div style={{ height: 2, background: '#1b1e2b', flex: 1, marginLeft: 12 }}>
                <div style={{
                  height: '100%', background: '#fda4af',
                  width: `${progress}%`, transition: 'width 1s linear',
                }} />
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#94a3b8', minWidth: 40 }}>
                {countdown} dtk
              </span>
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          className="maint-btn active:scale-[0.99]"
          onClick={handleRetry}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', background: 'transparent',
            border: '1px solid #1b1e2b', color: '#94a3b8',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 12,
            fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.5rem',
          }}
        >
          🔄 Coba Sekarang
        </button>

        {/* Marquee */}
        <div style={{
          overflow: 'hidden', borderTop: '1px solid #1b1e2b',
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '10px 0', background: '#0a0b10',
        }}>
          <div style={{ display: 'flex', animation: 'marquee 60s linear infinite', width: 'max-content' }}>
            {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} style={{
                padding: '0 24px', fontFamily: "'Space Mono', monospace",
                fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#fef1ff', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fda4af', display: 'inline-block' }} />
                {item}
              </span>
            ))}
          </div>
        </div>
        {/* Marquee */}
        <div style={{
          overflow: 'hidden', borderTop: '1px solid #1b1e2b',
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '10px 0', background: '#0a0b10',
        }}>
          <div style={{ display: 'flex', animation: 'marquee 60s linear infinite', width: 'max-content' }}>
            {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} style={{
                padding: '0 24px', fontFamily: "'Space Mono', monospace",
                fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#fef1ff', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#fda4af', display: 'inline-block' }} />
                {item}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MaintenancePage;