import { useState } from 'react';
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
}
