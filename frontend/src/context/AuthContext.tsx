import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, tokenStorage, unwrap } from '../lib/api';
import type { AuthTokens, User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
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
    return data.user;
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
}
