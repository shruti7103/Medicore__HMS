import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import ReceptionistDashboard from './pages/dashboards/ReceptionistDashboard';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import PharmacistDashboard from './pages/dashboards/PharmacistDashboard';
import NurseDashboard from './pages/dashboards/NurseDashboard';
import TelemedicineRoom from './pages/dashboards/TelemedicineRoom';
import MessagingCenter from './pages/dashboards/MessagingCenter';
import { ROLE_ROUTES } from './types';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading MediCore...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_ROUTES[user.role]} replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={ROLE_ROUTES[user.role]} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={ROLE_ROUTES[user.role]} /> : <RegisterPage />} />

      {/* Protected dashboard routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/doctor" element={<ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/nurse" element={<ProtectedRoute roles={['NURSE']}><NurseDashboard /></ProtectedRoute>} />
      <Route path="/receptionist" element={<ProtectedRoute roles={['RECEPTIONIST']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path="/patient" element={<ProtectedRoute roles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/pharmacist" element={<ProtectedRoute roles={['PHARMACIST']}><PharmacistDashboard /></ProtectedRoute>} />
      <Route path="/telemedicine/:roomId" element={<ProtectedRoute roles={['DOCTOR', 'PATIENT']}><TelemedicineRoom /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagingCenter /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
