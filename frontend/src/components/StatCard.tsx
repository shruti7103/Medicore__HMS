import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: 'teal' | 'indigo' | 'amber' | 'green' | 'red';
  trend?: { value: number; label?: string };
  suffix?: string;
  className?: string;
}

const ACCENTS = {
  teal:   { border: 'card-accent-teal',   bg: 'stat-card-teal',   color: 'var(--color-primary)',   light: 'var(--color-primary-light)' },
  indigo: { border: 'card-accent-indigo', bg: 'stat-card-indigo', color: 'var(--color-secondary)',  light: 'var(--color-secondary-light)' },
  amber:  { border: 'card-accent-amber',  bg: 'stat-card-amber',  color: 'var(--color-warning)',   light: 'rgba(245,158,11,0.12)' },
  green:  { border: 'card-accent-green',  bg: 'stat-card-green',  color: 'var(--color-success)',   light: 'rgba(16,185,129,0.12)' },
  red:    { border: 'card-accent-red',    bg: '',                  color: 'var(--color-danger)',    light: 'rgba(239,68,68,0.12)' },
};

export default function StatCard({ label, value, icon, accent = 'teal', trend, suffix = '', className = '' }: StatCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className={`stat-card ${a.border} ${a.bg} animate-fade-up ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>{label}</p>
          <p className="text-3xl font-bold" style={{ color: a.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {value}{suffix}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {trend.label && <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.light }}>
            <span style={{ color: a.color }}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
