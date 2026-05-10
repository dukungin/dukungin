// QrCodeWidget.jsx
// Route: /widget/:token/qrcode
// OBS Browser Source — ukuran 280×320px, background transparan

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';

const QrCodeWidget = () => {
  const { token } = useParams();
  const [username, setUsername] = useState('');
  const [donateUrl, setDonateUrl] = useState('');

  useEffect(() => {
    if (!token) return;
    axios.get(`${BASE_URL}/widget/${token}/qrcode`)
      .then(res => {
        const uname = res.data?.username || '';
        setUsername(uname);
        setDonateUrl(`${window.location.origin}/donate/${uname}`);
      })
      .catch(() => console.error('Failed to fetch qrcode data'));
  }, [token]);

  if (!donateUrl) return (
    <div style={{ width: '100%', height: '100vh', background: 'transparent' }} />
  );

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(donateUrl)}&color=ffffff&bgcolor=0f0f19&format=svg&margin=10`;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: 'rgba(15, 15, 25, 0.92)',
        borderRadius: 20,
        padding: '20px',
        border: '1.5px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        width: '100%',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}>
            Scan untuk donasi
          </p>
        </div>

        {/* QR */}
        <div style={{
          background: '#0f0f19',
          borderRadius: 16,
          padding: 10,
          border: '2px solid rgba(255,255,255,0.1)',
        }}>
          <img
            src={qrApiUrl}
            alt="QR Code"
            width={180}
            height={180}
            style={{ display: 'block', borderRadius: 8 }}
          />
        </div>

        {/* Username & URL */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 14,
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 4px',
          }}>
            @{username}
          </p>
          <p style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: 'monospace',
            margin: 0,
            wordBreak: 'break-all',
          }}>
            {donateUrl}
          </p>
        </div>

        {/* Decorative pulse ring */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#6366f1',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
};

export default QrCodeWidget;