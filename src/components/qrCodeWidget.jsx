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
    axios.get(`${BASE_URL}/widget/${token}/qrcode`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => {
        // Karena di backend qrcode() mengirimkan HTML, 
        // pastikan backend kamu support JSON seperti perbaikan sebelumnya
        const uname = res.data?.username || '';
        setUsername(uname);
        // Sesuaikan dengan domain frontend aslimu
        setDonateUrl(`https://dukungin.com/${uname}`); 
      })
      .catch(() => console.error('Failed to fetch qrcode data'));
  }, [token]);

  if (!donateUrl) return null;

  // Gunakan margin=0 dan format=svg agar bersih
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(donateUrl)}&color=ffffff&bgcolor=0f0f19&format=svg&margin=0`;

  return (
    <div style={{
      display: 'inline-flex', // Lebar otomatis mengikuti konten
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px',
      background: 'transparent', // Full Transparan
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Container Kotak QR dengan background semi-transparan */}
      <div style={{
        background: 'rgba(15, 15, 25, 0.85)',
        padding: '16px',
        borderRadius: '24px',
        border: '1.5px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          background: '#ffffff', // Background putih agar QR mudah discan
          padding: '10px',
          borderRadius: '12px',
          lineHeight: 0
        }}>
          <img
            src={qrApiUrl.replace('color=ffffff', 'color=000000')} // QR Hitam di box Putih
            alt="QR Code"
            style={{ width: '150px', height: '150px', display: 'block' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#fff',
            margin: 0
          }}>
            @{username}
          </p>
          <p style={{
            fontSize: '9px',
            color: 'rgba(255,255,255,0.5)',
            margin: '2px 0 0'
          }}>
            dukungin.com/{username}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrCodeWidget;