import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Moon, Sun, Activity } from 'lucide-react';
import { useEffect } from 'react';
import { wsService } from '../lib/websocket';

interface SidebarProps {
  title: string;
  links?: { to: string; label: string }[];
}

export default function Sidebar({ title, links = [] }: SidebarProps) {
  const { user, logout } = useAuth();
  const token = localStorage.getItem('token');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (token && user) {
        wsService.connect(token, () => {
            console.log("WebSocket connected");
            // Generic user topic
            wsService.subscribe(`/topic/user/${user.id}`, (msg) => {
                console.log("Global Notification", msg);
                // Can trigger a toast here
            });
            // Role specific
            if (user.role === 'PHARMACIST') {
                wsService.subscribe('/topic/prescriptions', (msg) => {
                    console.log("New Prescription", msg);
                });
            }
        }, (err) => console.error("WS error", err));
    }
    return () => {
        wsService.disconnect();
    };
  }, [token, user]);

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
}
