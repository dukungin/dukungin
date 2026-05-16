// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';

// const BASE_URL = 'https://server-dukungin-production.up.railway.app';

// const QrCodeWidget = () => {
//   const { token } = useParams();
//   const [username, setUsername] = useState('');
//   const [donateUrl, setDonateUrl] = useState('');

//   useEffect(() => {
//     if (!token) return;
//     axios.get(`${BASE_URL}/widget/${token}/qrcode`, {
//       headers: { 'Accept': 'application/json' }
//     })
//       .then(res => {
//         const uname = res.data?.username || '';
//         setUsername(uname);
//         // Pastikan URL tujuan benar (ada typo sedikit di .ap -> .app tadi)
//         setDonateUrl(`https://sawer-in.vercel.app/donate/${uname}`); 
//       })
//       .catch(() => console.error('Failed to fetch qrcode data'));
//   }, [token]);

//   if (!donateUrl) return null;

//   // Gunakan margin=0 agar logo benar-benar presisi di tengah
//   // Tips: QR Code Hitam di atas Putih lebih mudah discan kamera
//   const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(donateUrl)}&color=000000&bgcolor=ffffff&format=svg&margin=0`;

//   return (
//     <div style={{
//       display: 'inline-flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       padding: '12px',
//       background: 'transparent',
//       fontFamily: "'Inter', sans-serif",
//     }}>
//       <div style={{
//         background: 'rgba(15, 15, 25, 0.9)',
//         padding: '20px',
//         borderRadius: '28px',
//         border: '1.5px solid rgba(255,255,255,0.1)',
//         boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         gap: '12px'
//       }}>
        
//         {/* Container QR + Logo */}
//         <div style={{
//           position: 'relative', // Penting untuk overlay logo
//           background: '#ffffff',
//           padding: '12px',
//           borderRadius: '16px',
//           lineHeight: 0,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center'
//         }}>
//           {/* Gambar QR Code */}
//           <img
//             src={qrApiUrl}
//             alt="QR Code"
//             style={{ width: '160px', height: '160px', display: 'block' }}
//           />

//           {/* Logo di Tengah */}
//           <div style={{
//             position: 'absolute',
//             width: '40px', // Ukuran logo (jangan terlalu besar agar QR tetap terbaca)
//             height: '40px',
//             background: 'white', // Memberi sedikit border putih di sekitar logo
//             borderRadius: '10px',
//             padding: '4px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
//           }}>
//             <img 
//               src="/jellyfish.png" 
//               alt="Logo" 
//               style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
//             />
//           </div>
//         </div>

//         <div style={{ textAlign: 'center' }}>
//           <p style={{
//             fontSize: '14px',
//             fontWeight: '900',
//             color: '#fff',
//             margin: 0,
//             letterSpacing: '0.02em'
//           }}>
//             @{username}
//           </p>
//           <p style={{
//             fontSize: '9px',
//             color: 'rgba(255,255,255,0.4)',
//             margin: '2px 0 0',
//             textTransform: 'uppercase',
//             letterSpacing: '0.05em'
//           }}>
//             Scan to Support
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QrCodeWidget;


// QrCodeWidget.jsx
// Route: /widget/:token/qrcode
// OBS Browser Source — background transparan
// Widget OBS selalu render di atas konten stream (bg transparan, dark by design)

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
        const uname = res.data?.username || '';
        setUsername(uname);
        setDonateUrl(`https://sawer-in.vercel.app/donate/${uname}`);
      })
      .catch(() => console.error('Failed to fetch qrcode data'));
  }, [token]);

  if (!donateUrl) return null;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(donateUrl)}&color=000000&bgcolor=ffffff&format=svg&margin=0`;

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px',
      background: 'transparent',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: 'rgba(15, 15, 25, 0.9)',
        padding: '20px',
        borderRadius: '0',
        border: '1.5px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          position: 'relative',
          background: '#ffffff',
          padding: '12px',
          borderRadius: '0',
          lineHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={qrApiUrl}
            alt="QR Code"
            style={{ width: '160px', height: '160px', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            background: 'white',
            borderRadius: '0',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <img
              src="/jellyfish.png"
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '900',
            color: '#fff',
            margin: 0,
            letterSpacing: '0.02em'
          }}>
            @{username}
          </p>
          <p style={{
            fontSize: '9px',
            color: 'rgba(255,255,255,0.4)',
            margin: '2px 0 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Scan to Support
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrCodeWidget;