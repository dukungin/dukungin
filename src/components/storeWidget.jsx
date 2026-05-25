import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';

const StoreWidget = () => {
  const { token } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    axios.get(`${BASE_URL}/api/overlay/store/${token}`)
      .then(res => setProducts(res.data.products || []))
      .catch(err => console.error("Gagal load toko:", err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ width: '100%', height: '100vh', background: 'transparent' }} />;

  if (products.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100vh', background: 'rgba(15,23,42,0.95)',
        color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: 500
      }}>
        🛍️ Toko masih kosong
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'rgba(10, 10, 20, 0.98)',
      padding: '25px 20px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: 'white',
    }}>
      <h2 style={{
        textAlign: 'center',
        fontSize: '28px',
        fontWeight: 800,
        marginBottom: '30px',
        letterSpacing: '1px',
        opacity: 0.95
      }}>
        🛍️ TOKO
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        maxWidth: '520px',
        margin: '0 auto'
      }}>
        {products.map((p, i) => (
          <a
            key={i}
            href={p.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Gambar */}
            <div style={{ width: '140px', height: '140px', flexShrink: 0, background: '#1e2937' }}>
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '40px', opacity: 0.3
                }}>
                  🖼️
                </div>
              )}
            </div>

            {/* Info Produk */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '6px',
                lineHeight: 1.3
              }}>
                {p.name}
              </h3>

              <p style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#4ade80',
                marginBottom: '4px'
              }}>
                Rp {Number(p.price).toLocaleString('id-ID')}
              </p>

              {p.description && (
                <p style={{
                  fontSize: '13px',
                  opacity: 0.75,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {p.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default StoreWidget;