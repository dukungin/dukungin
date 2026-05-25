import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'https://server-dukungin-production.up.railway.app';

const StoreWidget = () => {
  const { token } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!token) return;

    axios.get(`${BASE_URL}/api/overlay/store/${token}`)
      .then(res => {
        setProducts(res.data.products || []);
      })
      .catch(err => {
        console.error("Gagal mengambil data toko:", err);
        setProducts([]);
      });
  }, [token]);

  if (products.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        Belum ada produk di toko
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'rgba(15, 23, 42, 0.95)',
      color: 'white',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: '32px',
        letterSpacing: '0.05em'
      }}>
        🛍️ TOKO STREAMER
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {products.map((p, i) => (
          <a
            key={i}
            href={p.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  objectFit: 'cover',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            )}
            <div style={{ padding: '20px' }}>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: 700, 
                marginBottom: '8px',
                lineHeight: 1.3
              }}>
                {p.name}
              </h3>
              
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 900, 
                color: '#22c55e',
                marginBottom: '8px'
              }}>
                Rp {Number(p.price).toLocaleString('id-ID')}
              </p>

              {p.description && (
                <p style={{ 
                  fontSize: '15px', 
                  opacity: 0.85,
                  lineHeight: 1.5 
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