import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_ROUTES } from '../types';
import { Activity, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@medicore.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.role]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error)?.message ?? 'Login failed';
      if (msg.includes('Network Error') || msg.includes('ECONNREFUSED')) {
        setError('Cannot reach backend. Start backend services first (start-backend.bat).');
      } else {
        setError(msg === 'Invalid credentials' ? 'Invalid email or password' : msg);
      }
    } finally { setLoading(false); }
  };

  // All 6 roles with demo credentials — all use the same seed password Admin@123
  const DEMO_CREDENTIALS = [
    { role: 'Admin',        email: 'admin@medicore.local',       pw: 'Admin@123', color: '#8b5cf6' },
    { role: 'Doctor',       email: 'doctor@medicore.local',      pw: 'Admin@123', color: '#0ea5e9' },
    { role: 'Nurse',        email: 'nurse@medicore.local',       pw: 'Admin@123', color: '#10b981' },
    { role: 'Pharmacist',   email: 'pharmacist@medicore.local',  pw: 'Admin@123', color: '#f59e0b' },
    { role: 'Receptionist', email: 'reception@medicore.local',   pw: 'Admin@123', color: '#ef4444' },
    { role: 'Patient',      email: 'patient@medicore.local',     pw: 'Admin@123', color: '#06b6d4' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-bg relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--color-primary)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: 'var(--color-secondary)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: 'var(--color-muted)' }}>
          <ArrowLeft size={14}/> Back to home
        </Link>

        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MediCore HMS</h1>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Hospital Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-muted)' }}>EMAIL ADDRESS</label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-muted)' }}>PASSWORD</label>
              <div className="relative">
                <input
                  className="input-field pr-11"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-muted)' }} onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger text-sm">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              <LogIn size={17}/> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            New patient? <Link to="/register" style={{ color: 'var(--color-primary)' }} className="font-medium">Register</Link>
          </p>

          {/* Demo credentials — all 6 roles in 3-column grid */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-semibold mb-3 text-center" style={{ color: 'var(--color-muted)' }}>
              DEMO ACCOUNTS — click to fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map(d => (
                <button
                  key={d.role}
                  type="button"
                  className="text-left p-2.5 rounded-xl border text-xs transition-all hover:shadow-md"
                  style={{ borderColor: `${d.color}40`, background: `${d.color}10` }}
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                >
                  <span className="font-bold block mb-0.5" style={{ color: d.color }}>{d.role}</span>
                  <span className="text-xs leading-tight block" style={{ color: 'var(--color-muted)', fontSize: '0.65rem' }}>
                    {d.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
