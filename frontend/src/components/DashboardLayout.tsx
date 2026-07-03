import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  links?: { to: string; label: string }[];
  actions?: ReactNode;
}

export default function DashboardLayout({ title, children, links, actions }: DashboardLayoutProps) {
  const { user } = useAuth();
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar title={title} links={links} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header
          className="flex items-center justify-between border-b px-6 py-3 flex-shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            height: 'var(--header-height)',
          }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{greeting},</p>
            <p className="font-semibold text-sm leading-tight">{user?.name ?? 'Welcome'}</p>
          </div>
          <div className="flex items-center gap-3">
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium">{now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'var(--color-primary-light)' }}>
              <Activity size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Live</span>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
