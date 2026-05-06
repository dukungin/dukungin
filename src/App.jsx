import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Auth from './pages/auth';
import DashboardStreamer from './pages/dashboardStreamer';
import OverlayAlert from './pages/overlayAlert';
import SupporterPage from './pages/supporterPage';
import ResetPassword from './pages/resetPassword';
import DonationSuccess from './pages/donationSuccess';
import DonationFailed from './pages/donationFailed';
import DonationPending from './pages/donationPending';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Private Routes (Dashboard) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardStreamer />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/donate/:username" element={<SupporterPage />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Xendit Redirect Routes */}
        <Route path="/donation/success" element={<DonationSuccess />} />
        <Route path="/donation/failed" element={<DonationFailed />} />
        <Route path="/donation/pending" element={<DonationPending />} />

        {/* OBS Overlay Route (Public, No Auth) */}
        <Route path="/overlay/:token" element={<OverlayAlert />} />
      </Routes>
    </Router>
  );
}

export default App;