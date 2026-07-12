import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut, Moon, Sun, Activity, LayoutDashboard, Calendar, Users, ClipboardList,
  Pill, MessageSquare, ShieldCheck, Heart, Bell, Stethoscope, Thermometer,
  FileText, BarChart3, Settings, ChevronRight, Building2, Home
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { wsService } from '../lib/websocket';

interface SidebarProps {
  title: string;
  links?: { to: string; label: string; icon?: string }[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'Schedule':       <Calendar size={18} />,
  'My Schedule':    <Calendar size={18} />,
  'Ward':           <Heart size={18} />,
  'Nursing Station':<Heart size={18} />,
  'Pharmacy':       <Pill size={18} />,
  'Front Desk':     <LayoutDashboard size={18} />,
  'Overview':       <BarChart3 size={18} />,
  'Dashboard':      <LayoutDashboard size={18} />,
  'My Health':      <Heart size={18} />,
  'Messages':       <MessageSquare size={18} />,
  'Appointments':   <Calendar size={18} />,
  'Reports':        <FileText size={18} />,
  'Settings':       <Settings size={18} />,
  'Inventory':      <ClipboardList size={18} />,
  'Patients':       <Users size={18} />,
  'Doctors':        <Stethoscope size={18} />,
  'Vitals':         <Thermometer size={18} />,
  'Tasks':          <ClipboardList size={18} />,
  'Admin Panel':    <ShieldCheck size={18} />,
  'Departments':    <Building2 size={18} />,
  'Billing':        <FileText size={18} />,
  'Analytics':      <BarChart3 size={18} />,
  'Notifications':  <Bell size={18} />,
  'Home':           <Home size={18} />,
};

const ROLE_CONFIG: Record<string, { color: string; gradient: string; label: string; icon: React.ReactNode }> = {
  DOCTOR:      { color: '#0ea5e9', gradient: 'from-sky-400 to-cyan-500', label: 'Doctor', icon: <Stethoscope size={20}/> },
  NURSE:       { color: '#10b981', gradient: 'from-emerald-400 to-green-500', label: 'Nurse', icon: <Heart size={20}/> },
  ADMIN:       { color: '#8b5cf6', gradient: 'from-violet-400 to-purple-600', label: 'Administrator', icon: <ShieldCheck size={20}/> },
  PHARMACIST:  { color: '#f59e0b', gradient: 'from-amber-400 to-orange-500', label: 'Pharmacist', icon: <Pill size={20}/> },
  RECEPTIONIST:{ color: '#ef4444', gradient: 'from-rose-400 to-red-500', label: 'Receptionist', icon: <Bell size={20}/> },
  PATIENT:     { color: '#06b6d4', gradient: 'from-cyan-400 to-teal-500', label: 'Patient', icon: <Users size={20}/> },
};

export default function Sidebar({ title, links = [] }: SidebarProps) {
  const { user, logout } = useAuth();
  const token = localStorage.getItem('medicore_access_token');
  const { theme, toggle } = useTheme();
  const [wsConnected, setWsConnected] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const roleConfig = user ? (ROLE_CONFIG[user.role] ?? { color: 'var(--color-primary)', gradient: 'from-blue-400 to-cyan-500', label: title, icon: <Activity size={20}/> }) : null;

  useEffect(() => {
    if (token && user) {
      const handleUserNotif = () => {
        setNotifCount(n => n + 1);
      };
      const handleRxNotif = () => {
        setNotifCount(n => n + 1);
      };

      wsService.connect(token, () => {
        setWsConnected(true);
        wsService.subscribe(`/topic/user/${user.id}`, handleUserNotif);
        if (user.role === 'PHARMACIST') {
          wsService.subscribe('/topic/prescriptions', handleRxNotif);
        }
      }, () => setWsConnected(false));

      return () => {
        wsService.unsubscribe(`/topic/user/${user.id}`, handleUserNotif);
        if (user.role === 'PHARMACIST') {
          wsService.unsubscribe('/topic/prescriptions', handleRxNotif);
        }
        if (!localStorage.getItem('medicore_access_token')) {
          wsService.disconnect();
          setWsConnected(false);
        }
      };
    }
  }, [token, user]);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <Activity size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-base leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MediCore HMS</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Hospital Management</p>
        </div>
      </Link>

      {/* Role Badge */}
      {roleConfig && (
        <div className="mx-3 mt-4 mb-2 p-3 rounded-xl" style={{ background: `${roleConfig.color}15`, border: `1px solid ${roleConfig.color}25` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: roleConfig.color, color: 'white' }}>
              {roleConfig.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: roleConfig.color }}>{roleConfig.label}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{user?.name}</p>
            </div>
            {wsConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Live connected" />
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to.split('/').length <= 2}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="flex-shrink-0">{ICON_MAP[l.label] ?? <ChevronRight size={16} />}</span>
            <span className="truncate">{l.label}</span>
            {l.label === 'Messages' && notifCount > 0 && (
              <span className="ml-auto badge badge-danger text-xs px-1.5 py-0.5">{notifCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={toggle}
            className="btn-ghost flex-1 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span className="hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
