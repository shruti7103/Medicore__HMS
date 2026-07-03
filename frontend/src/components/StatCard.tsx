interface StatCardProps {
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
}
