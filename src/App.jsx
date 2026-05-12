import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import PollWidget from './components/pollWidget';
import SubathonWidget from './components/subathonWidget';
import Auth from './pages/auth';
// import DashboardStreamer from './pages/dashboardStreamer';
import DonationFailed from './pages/donationFailed';
import DonationPending from './pages/donationPending';
import DonationSuccess from './pages/donationSuccess';
import OverlayAlert from './pages/overlayAlert';
import ResetPassword from './pages/resetPassword';
import SupporterPage from './pages/supporterPage';
import LeaderboardWidget from './components/leaderboard';
import MilestonesWidget from './components/milestoneWidget';
import QrCodeWidget from './components/qrCodeWidget';
import LandingPage from './pages/landingPage'; // ← import landing page
import PrivacyPolicy from './pages/privacyPolice';
import { DashboardStreamer } from './pages/dashboardStreamer';

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

// Redirect ke dashboard jika sudah login, ke landing page jika belum
const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Landing page sebagai halaman utama */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Auth — redirect ke dashboard kalau sudah login */}
          <Route path="/login"    element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

          {/* Dashboard — harus login */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardStreamer /></ProtectedRoute>} />

          {/* Reset password */}
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Halaman donasi publik */}
          <Route path="/donate/:username" element={<SupporterPage />} />

          {/* Hasil donasi */}
          <Route path="/donation/success" element={<DonationSuccess />} />
          <Route path="/donation/failed"  element={<DonationFailed />} />
          <Route path="/donation/pending" element={<DonationPending />} />

          {/* OBS Widgets */}
          <Route path="/widget/:token/subathon"   element={<SubathonWidget />} />
          <Route path="/widget/:token/poll"        element={<PollWidget />} />
          <Route path="/widget/:token/leaderboard" element={<LeaderboardWidget />} />
          <Route path="/widget/:token/milestones"  element={<MilestonesWidget />} />
          <Route path="/widget/:token/qrcode"      element={<QrCodeWidget />} />

          {/* Overlay OBS */}
          <Route path="/overlay/:token" element={<OverlayAlert />} />

          {/* Fallback — 404 redirect ke landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;