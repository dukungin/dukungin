// LeaderboardWidget.jsx
// Route: /widget/:token/leaderboard
// OBS Browser Source — ukuran 360×420px, background transparan

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#f59e0b', '#94a3b8', '#f97316'];

const LeaderboardWidget = () => {
  const { token } = useParams();
  const [donors, setDonors] = useState([]);
  const [settings, setSettings] = useState({ leaderboardShowAmount: true, leaderboardLimit: 10 });
  const [animKey, setAnimKey] = useState(0);

    const fetchData = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/widget/${token}/leaderboard`, {
        headers: { 'Accept': 'application/json' } // Paksa minta JSON
        });
        
        // Sesuaikan dengan struktur res.json di atas
        const donorsData = res.data.donors || [];
        setDonors(donorsData);
        
        if (res.data.settings) {
        setSettings(res.data.settings);
        }
    } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setDonors([]); // Reset ke array kosong jika error agar tidak crash
    }
    };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(BASE_URL);
    socket.emit('join-room', token);
    socket.on('new-donation', () => {
      fetchData();
      setAnimKey(k => k + 1);
    });
    return () => socket.disconnect();
  }, [token]);

  if (!donors.length) return (
    <div style={{ width: '100%', height: '100vh', background: 'transparent' }} />
  );

  const limit = settings.leaderboardLimit || 10;
  const showAmount = settings.leaderboardShowAmount !== false;
  const displayDonors = donors.slice(0, limit);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'transparent',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div
        key={animKey}
        style={{
          background: 'rgba(15, 15, 25, 1)',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,1)',
          }}>
            Leaderboard
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: 20,
            color: 'rgba(255,255,255,1)',
            fontWeight: 600,
          }}>
            {displayDonors.length} orang
          </span>
        </div>

        {/* Donor list */}
        <div style={{ padding: '10px 0' }}>
          {displayDonors.map((donor, i) => (
            <div
              key={donor.name + i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                background: i < 3 ? `rgba(255,255,255,0.02)` : 'transparent',
                borderLeft: i < 3 ? `3px solid ${RANK_COLORS[i]}` : '3px solid transparent',
                animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
              }}
            >
              {/* Rank */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: i < 3 ? `${RANK_COLORS[i]}22` : 'rgba(255,255,255,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: i < 3 ? 14 : 11,
                fontWeight: 800,
                color: i < 3 ? RANK_COLORS[i] : 'rgba(255,255,255,1)',
                flexShrink: 0,
              }}>
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: i < 3 ? '#ffffff' : 'rgba(255,255,255,1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}>
                  {donor.name}
                </p>
                <p style={{
                  fontSize: 20,
                  color: 'rgba(255,255,255,0.25)',
                  fontWeight: 600,
                  margin: 0,
                }}>
                  {donor.count}x donasi
                </p>
              </div>

              {/* Amount */}
              {showAmount && (
                <span style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: i < 3 ? RANK_COLORS[i] : 'rgba(255,255,255,0.4)',
                  flexShrink: 0,
                }}>
                  Rp {Number(donor.totalAmount).toLocaleString('id-ID')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardWidget;