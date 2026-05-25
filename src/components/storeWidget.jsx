import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';

const StoreWidget = () => {
  const { token } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${BASE_URL}/widget/${token}/store`)
      .then(res => setProducts(res.data.products || []))
      .catch(() => {});
  }, [token]);

  if (products.length === 0) {
    return <div style={{ width: '100%', height: '100vh', background: 'transparent' }} />;
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'rgba(15, 23, 42, 0.95)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: '24px',
        letterSpacing: '0.05em'
      }}>
        🛍️ TOKO STREAMER
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {products.map((p, i) => (
          <a
            key={i}
            href={p.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '4px',
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
            )}
            <div style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{p.name}</h3>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#22c55e' }}>
                Rp {Number(p.price).toLocaleString('id-ID')}
              </p>
              {p.description && (
                <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>{p.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default StoreWidget;