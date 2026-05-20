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
  const { isOnline, checking, retry } = useServerStatus(); // ✅ di dalam komponen

  if (!checking && !isOnline) {
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

          <Route path="/widget/:token/subathon"   element={<SubathonWidget />} />
          <Route path="/widget/:token/poll"        element={<PollWidget />} />
          <Route path="/widget/:token/leaderboard" element={<LeaderboardWidget />} />
          <Route path="/widget/:token/milestones"  element={<MilestonesWidget />} />
          <Route path="/widget/:token/qrcode"      element={<QrCodeWidget />} />
          <Route path="/poll/:username" element={<PollDonatePage />} />

          <Route path="/overlay/:token" element={<OverlayAlert />} />
          <Route path="/overlay/:token/voice" element={<VoiceNoteOverlay />} />
          <Route path="/overlay/:token/mediashare" element={<MediaShareOverlay />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;