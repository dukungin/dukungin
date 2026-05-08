import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Auth from './pages/auth';
import DashboardStreamer from './pages/dashboardStreamer';
import OverlayAlert from './pages/overlayAlert';
import SupporterPage from './pages/supporterPage';
import ResetPassword from './pages/resetPassword';
import DonationSuccess from './pages/donationSuccess';
import DonationFailed from './pages/donationFailed';
import DonationPending from './pages/donationPending';

// Buat instance QueryClient sekali di luar komponen
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>  {/* ← tambah ini */}
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardStreamer /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/donate/:username" element={<SupporterPage />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/donation/success" element={<DonationSuccess />} />
          <Route path="/donation/failed" element={<DonationFailed />} />
          <Route path="/donation/pending" element={<DonationPending />} />
          <Route path="/overlay/:token" element={<OverlayAlert />} />
        </Routes>
      </Router>
    </QueryClientProvider> 
  );
}

export default App;