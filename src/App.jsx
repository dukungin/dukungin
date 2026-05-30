import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PollWidget from './components/pollWidget';
import SubathonWidget from './components/subathonWidget';
import Auth from './pages/auth';
import LeaderboardWidget from './components/leaderboard';
import MilestonesWidget from './components/milestoneWidget';
import QrCodeWidget from './components/qrCodeWidget';
import { DashboardStreamer } from './pages/dashboardStreamer';
import DonationFailed from './pages/donationFailed';
import DonationPending from './pages/donationPending';
import PollDonatePage from './pages/pollDonate';
import DonationSuccess from './pages/donationSuccess';
import LandingPage from './pages/landingPage';
import MediaShareOverlay from './pages/mediaShareOverlay';
import OverlayAlert from './pages/overlayAlert';
import PrivacyPolicy from './pages/privacyPolice';
import ResetPassword from './pages/resetPassword';
import SupporterPage from './pages/supporterPage';
import { Toaster } from 'react-hot-toast';
import VoiceNoteOverlay from './pages/voiceNoteOverlay';
import { useServerStatus } from './hooks/useServerStatus';
import MaintenancePage from './pages/maintenancePage';
import StoreWidget from './components/storeWidget';
import CombinedOverlay from './pages/combinedOverlay';
import AuthSuperAdmin from './pages/authSuperAdmin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    }
  }
});

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const path = window.location.pathname;
  const isOverlay = path.startsWith('/overlay') || path.startsWith('/widget');

  const { isOnline, checking, retry } = useServerStatus(); // ✅ di dalam komponen

  // Saat pertama kali cek, tampilkan loading sebentar
  if (checking) {
    return isOverlay ? (
      <div style={{
        background: 'transparent'
      }}>
      </div>
    ) : (
      <div style={{
        minHeight: '100vh', background: '#0a0b10',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '2rem',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono&family=Space+Grotesk:wght@400;600&display=swap');
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
          @keyframes flicker { 0%{opacity:1}10%{opaciwithty:0.3}20%{opacity:1}50%{opacity:0.8}70%{opacity:0.2}100%{opacity:1} }
          @keyframes glitch1 {
            0%,100%{clip-path:inset(0 0 90% 0);transform:translateX(0)}
            25%{clip-path:inset(20% 0 60% 0);transform:translateX(-4px)}
            50%{clip-path:inset(50% 0 30% 0);transform:translateX(4px)}
            75%{clip-path:inset(70% 0 10% 0);transform:translateX(-2px)}
          }
          @keyframes glitch2 {
            0%,100%{clip-path:inset(80% 0 0% 0);transform:translateX(0)}
            25%{clip-path:inset(60% 0 20% 0);transform:translateX(4px)}
            50%{clip-path:inset(30% 0 50% 0);transform:translateX(-4px)}
            75%{clip-path:inset(10% 0 70% 0);transform:translateX(2px)}
          }
          @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* TTT Glitch */}
        <div style={{ position: 'relative', marginBottom: '0.9rem', animation: 'fadein 0.5s ease' }}>
          {[
            { color: '#f87171', anim: 'glitch1 0.7s infinite', opacity: 0.6 },
            { color: '#818cf8', anim: 'glitch2 0.7s infinite 0.15s', opacity: 0.45 },
          ].map((g, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0,
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 96,
              letterSpacing: '0.08em', color: g.color, lineHeight: 1,
              animation: g.anim, opacity: g.opacity,
            }}>TTT</div>
          ))}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 96,
            letterSpacing: '0.08em', color: '#fda4af', lineHeight: 1,
            animation: 'flicker 1s infinite', position: 'relative',
          }}>TTT</div>
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: '2rem', animation: 'fadein 0.6s 0.1s ease both' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: '#f9f9f9' }}>
            Mohon tunggu sebentar
          </p>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: '#94a3b8' }}>
            Sedang memuat halaman untukmu...
          </p>
        </div>

        {/* Bottom */}
        <div style={{ position: 'absolute', bottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 1, background: '#1e293b' }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: '#1e293b', textTransform: 'uppercase' }}>
            TapTipTup
          </span>
          <div style={{ width: 20, height: 1, background: '#1e293b' }} />
        </div>
      </div>
    );
  }

  if (!isOverlay && !isOnline) {
    return <MaintenancePage onRetry={retry} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0,0, 0.1), 0 10px 10px -5px rgba(0, 0,0, 0.04)',
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login-superAdmin" element={<AuthSuperAdmin />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          <Route path="/login"    element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
          <Route path="/auth/reset-password" element={<Auth />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardStreamer /></ProtectedRoute>} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/donate/:username" element={<SupporterPage />} />

          <Route path="/donation/success" element={<DonationSuccess />} />
          <Route path="/donation/failed"  element={<DonationFailed />} />
          <Route path="/donation/pending" element={<DonationPending />} />

          <Route path="/widget/:token/store"       element={<StoreWidget />} />
          <Route path="/widget/:token/subathon"   element={<SubathonWidget />} />
          <Route path="/widget/:token/poll"        element={<PollWidget />} />
          <Route path="/widget/:token/leaderboard" element={<LeaderboardWidget />} />
          <Route path="/widget/:token/milestones"  element={<MilestonesWidget />} />
          <Route path="/widget/:token/qrcode"      element={<QrCodeWidget />} />
          <Route path="/poll/:username" element={<PollDonatePage />} />

          <Route path="/overlay/:token" element={<OverlayAlert />} />
          <Route path="/overlay/:token/voice" element={<VoiceNoteOverlay />} />
          <Route path="/overlay/:token/combined"   element={<CombinedOverlay />} />  
          <Route path="/overlay/:token/mediashare" element={<MediaShareOverlay />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;