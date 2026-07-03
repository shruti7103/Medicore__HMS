import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  links?: { to: string; label: string }[];
}

export default function DashboardLayout({ title, children, links }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar title={title} links={links} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end border-b px-6 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
