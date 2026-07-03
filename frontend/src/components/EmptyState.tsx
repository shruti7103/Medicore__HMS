export default function EmptyState({ message }: { message: string }) {
  return <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>{message}</div>;
}
