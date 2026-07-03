#!/usr/bin/env python3
"""Generate MediCore React frontend."""
from pathlib import Path

ROOT = Path(r"d:\Shruti HMS\frontend\src")

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"+ {p.relative_to(ROOT.parent)}")

w(ROOT / "main.tsx", '''import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);''')

w(ROOT / "App.tsx", '''import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import ReceptionistDashboard from './pages/dashboards/ReceptionistDashboard';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import PharmacistDashboard from './pages/dashboards/PharmacistDashboard';
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
      <Route path="/receptionist" element={<ProtectedRoute roles={['RECEPTIONIST']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path="/patient" element={<ProtectedRoute roles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/pharmacist" element={<ProtectedRoute roles={['PHARMACIST']}><PharmacistDashboard /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? ROLE_ROUTES[user.role] : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}''')

w(ROOT / "context/AuthContext.tsx", '''import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, tokenStorage, unwrap } from '../lib/api';
import type { AuthTokens, User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const init = async () => {
    if (!tokenStorage.getAccess()) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(unwrap(res));
    } catch {
      tokenStorage.clear();
    } finally {
      setLoading(false);
    }
  };
  init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const data = unwrap<AuthTokens>(res);
    tokenStorage.set(data);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    const data = unwrap<AuthTokens>(res);
    tokenStorage.set(data);
    setUser(data.user);
  };

  const logout = async () => {
    const refresh = tokenStorage.getRefresh();
    if (refresh) {
      try { await api.post('/auth/logout', { refreshToken: refresh }); } catch { /* ignore */ }
    }
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}''')

w(ROOT / "context/ThemeContext.tsx", '''import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('medicore_theme') as Theme) || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('medicore_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}''')

w(ROOT / "components/StatCard.tsx", '''interface StatCardProps {
  label: string;
  value: number | string;
  accent?: 'teal' | 'indigo' | 'amber';
}

export default function StatCard({ label, value, accent = 'teal' }: StatCardProps) {
  const accentClass = accent === 'indigo' ? 'card-accent-indigo' : accent === 'amber' ? 'card-accent-amber' : 'card-accent-teal';
  return (
    <div className={`card p-5 ${accentClass}`}>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}''')

w(ROOT / "components/StatusChip.tsx", '''import type { AppointmentStatus } from '../types';

const styles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  UNPAID: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  DISPENSED: 'bg-green-100 text-green-800',
};

export default function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}''')

w(ROOT / "components/Sidebar.tsx", '''import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Moon, Sun, Activity } from 'lucide-react';

interface SidebarProps {
  title: string;
  links?: { to: string; label: string }[];
}

export default function Sidebar({ title, links = [] }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <aside className="flex w-64 flex-col border-r" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-center gap-2 border-b p-5" style={{ borderColor: 'var(--color-border)' }}>
        <Activity className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
        <div>
          <p className="font-display text-lg font-semibold">MediCore</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{title}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) =>
            `block rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'border-l-4 font-medium' : ''}`}
            style={({ isActive }) => ({
              borderLeftColor: isActive ? 'var(--color-primary)' : 'transparent',
              backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : undefined,
            })}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-medium">{user?.name}</p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{user?.role}</p>
        <div className="flex gap-2">
          <button type="button" onClick={toggle} className="btn-secondary flex-1 text-xs">
            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => logout()} className="btn-secondary flex-1 text-xs">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}''')

w(ROOT / "components/DashboardLayout.tsx", '''import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  links?: { to: string; label: string }[];
}

export default function DashboardLayout({ title, children, links }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar title={title} links={links} />
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}''')

w(ROOT / "pages/LoginPage.tsx", '''import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_ROUTES } from '../types';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@medicore.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const res = await fetch('http://localhost:8080/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('medicore_access_token')}` },
      });
      const json = await res.json();
      const role = json.data?.role || 'PATIENT';
      navigate(ROLE_ROUTES[role as keyof typeof ROLE_ROUTES]);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card card-accent-teal w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2">
          <Activity className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
          <h1 className="font-display text-2xl font-bold">MediCore HMS</h1>
        </div>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>Sign in to your hospital dashboard</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          New patient? <Link to="/register" style={{ color: 'var(--color-accent)' }}>Register</Link>
        </p>
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          Demo: admin@medicore.local / Admin@123
        </p>
      </div>
    </div>
  );
}''')

w(ROOT / "pages/RegisterPage.tsx", '''import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/patient');
    } catch {
      setError('Registration failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card card-accent-indigo w-full max-w-md p-8">
        <h1 className="mb-6 font-display text-2xl font-bold">Patient Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input-field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/login" style={{ color: 'var(--color-accent)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
}''')

w(ROOT / "pages/dashboards/AdminDashboard.tsx", '''import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { api, unwrap } from '../../lib/api';
import type { AnalyticsSummary, User } from '../../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.get('/admin/analytics/summary').then((r) => setStats(unwrap(r))).catch(() => {});
    api.get('/auth/users').then((r) => setUsers(unwrap(r))).catch(() => {});
  }, []);

  return (
    <DashboardLayout title="Admin" links={[{ to: '/admin', label: 'Overview' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Admin Dashboard</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={stats?.totalPatients ?? 0} />
        <StatCard label="Active Doctors" value={stats?.totalDoctors ?? 0} accent="indigo" />
        <StatCard label="Appointments" value={stats?.totalAppointments ?? 0} accent="amber" />
        <StatCard label="Invoices" value={stats?.totalInvoices ?? 0} />
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Staff Directory</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left" style={{ borderColor: 'var(--color-border)' }}>
              <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="py-2">{u.name}</td><td className="py-2">{u.email}</td><td className="py-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}''')

w(ROOT / "pages/dashboards/DoctorDashboard.tsx", '''import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Appointment } from '../../types';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/doctors/me').then((r) => {
      const doc = unwrap<{ id: number }>(r);
      setDoctorId(doc.id);
      return api.get(`/appointments/doctor/${doc.id}`);
    }).then((r) => setAppointments(unwrap(r))).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.slotStart.startsWith(today));

  return (
    <DashboardLayout title="Doctor" links={[{ to: '/doctor', label: 'Schedule' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Today&apos;s Schedule</h1>
      <div className="space-y-3">
        {todayAppts.length === 0 && <p style={{ color: 'var(--color-muted)' }}>No appointments today.</p>}
        {todayAppts.map((a) => (
          <div key={a.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Patient #{a.patientId}</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {new Date(a.slotStart).toLocaleTimeString()} — {a.reason || 'Consultation'}
              </p>
            </div>
            <StatusChip status={a.status} />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}''')

w(ROOT / "pages/dashboards/ReceptionistDashboard.tsx", '''import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Appointment, Patient } from '../../types';

export default function ReceptionistDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/patients').then((r) => setPatients(unwrap(r))).catch(() => {});
    api.get('/appointments').then((r) => setAppointments(unwrap(r))).catch(() => {});
  }, []);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Receptionist" links={[{ to: '/receptionist', label: 'Front Desk' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Front Desk</h1>
      <input className="input-field mb-6 max-w-md" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Patients ({filtered.length})</h2>
          {filtered.slice(0, 8).map((p) => (
            <div key={p.id} className="border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {p.firstName} {p.lastName} — {p.phone || 'No phone'}
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Appointments</h2>
          {appointments.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span>#{a.id} — {new Date(a.slotStart).toLocaleString()}</span>
              <StatusChip status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}''')

w(ROOT / "pages/dashboards/PatientDashboard.tsx", '''import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Appointment, Doctor, Invoice, Patient } from '../../types';

export default function PatientDashboard() {
  const [profile, setProfile] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ slotStart: string; slotEnd: string }[]>([]);

  useEffect(() => {
    api.get('/patients/me').then((r) => setProfile(unwrap(r))).catch(() => {});
    api.get('/doctors').then((r) => setDoctors(unwrap(r))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    api.get(`/appointments/patient/${profile.id}`).then((r) => setAppointments(unwrap(r))).catch(() => {});
    api.get(`/billing/invoices/patient/${profile.id}`).then((r) => setInvoices(unwrap(r))).catch(() => {});
  }, [profile]);

  useEffect(() => {
    if (!selectedDoctor) return;
    api.get(`/doctors/${selectedDoctor}/slots?date=${selectedDate}`).then((r) => setSlots(unwrap(r))).catch(() => setSlots([]));
  }, [selectedDoctor, selectedDate]);

  const bookSlot = async (slot: { slotStart: string; slotEnd: string }) => {
    if (!profile || !selectedDoctor) return;
    await api.post('/appointments', {
      patientId: profile.id,
      doctorId: Number(selectedDoctor),
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
      reason: 'General consultation',
    });
    const r = await api.get(`/appointments/patient/${profile.id}`);
    setAppointments(unwrap(r));
  };

  return (
    <DashboardLayout title="Patient" links={[{ to: '/patient', label: 'My Health' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">My Health</h1>
      {!profile && (
        <div className="card mb-6 p-5">
          <p className="mb-3">Complete your patient profile first.</p>
          <button className="btn-primary" onClick={async () => {
            await api.post('/patients', { firstName: 'New', lastName: 'Patient', phone: '' });
            const r = await api.get('/patients/me');
            setProfile(unwrap(r));
          }}>Create Profile</button>
        </div>
      )}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Upcoming Appointments</h2>
          {appointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').map((a) => (
            <div key={a.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span>{new Date(a.slotStart).toLocaleString()}</span>
              <StatusChip status={a.status} />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Bills</h2>
          {invoices.map((inv) => (
            <div key={inv.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span>₹{inv.amount}</span>
              <StatusChip status={inv.status} />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Book Appointment</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="input-field max-w-xs" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
            <option value="">Select doctor</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.department}</option>)}
          </select>
          <input type="date" className="input-field max-w-xs" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button key={s.slotStart} type="button" className="btn-secondary text-xs" onClick={() => bookSlot(s)}>
              {new Date(s.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}''')

w(ROOT / "pages/dashboards/PharmacistDashboard.tsx", '''import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Medicine, Prescription } from '../../types';

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [lowStock, setLowStock] = useState<Medicine[]>([]);

  const load = () => {
    api.get('/pharmacy/prescriptions').then((r) => setPrescriptions(unwrap(r))).catch(() => {});
    api.get('/pharmacy/medicines/low-stock').then((r) => setLowStock(unwrap(r))).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const dispense = async (id: number) => {
    await api.patch(`/pharmacy/prescriptions/${id}/dispense`);
    load();
  };

  return (
    <DashboardLayout title="Pharmacist" links={[{ to: '/pharmacist', label: 'Pharmacy' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Pharmacy Desk</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Pending Prescriptions</h2>
          {prescriptions.map((p) => (
            <div key={p.id} className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="text-sm font-medium">Rx #{p.id} — Patient #{p.patientId}</p>
                <StatusChip status={p.status} />
              </div>
              {p.status === 'PENDING' && (
                <button type="button" className="btn-primary text-xs" onClick={() => dispense(p.id)}>Dispense</button>
              )}
            </div>
          ))}
        </div>
        <div className="card card-accent-amber p-5">
          <h2 className="mb-4 font-semibold">Low Stock Alerts</h2>
          {lowStock.map((m) => (
            <div key={m.id} className="border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {m.name} — <span className="text-red-600">{m.stockQty} left</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}''')

print("Frontend generated.")
