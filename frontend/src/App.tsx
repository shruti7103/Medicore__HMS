import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_ROUTES[user.role]} replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={ROLE_ROUTES[user.role]} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={ROLE_ROUTES[user.role]} /> : <RegisterPage />} />
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/doctor" element={<ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/nurse" element={<ProtectedRoute roles={['NURSE']}><NurseDashboard /></ProtectedRoute>} />
      <Route path="/receptionist" element={<ProtectedRoute roles={['RECEPTIONIST']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path="/patient" element={<ProtectedRoute roles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/pharmacist" element={<ProtectedRoute roles={['PHARMACIST']}><PharmacistDashboard /></ProtectedRoute>} />
      <Route path="/telemedicine/:roomId" element={<ProtectedRoute roles={['DOCTOR', 'PATIENT']}><TelemedicineRoom /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagingCenter /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? ROLE_ROUTES[user.role] : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
