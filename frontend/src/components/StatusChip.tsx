type Status = string;

const MAP: Record<string, { label: string; cls: string; dot?: string }> = {
  PENDING:     { label: 'Pending',     cls: 'badge-warning', dot: '#f59e0b' },
  CONFIRMED:   { label: 'Confirmed',   cls: 'badge-primary', dot: 'var(--color-primary)' },
  COMPLETED:   { label: 'Completed',   cls: 'badge-success', dot: 'var(--color-success)' },
  CANCELLED:   { label: 'Cancelled',   cls: 'badge-danger',  dot: 'var(--color-danger)' },
  NO_SHOW:     { label: 'No Show',     cls: 'badge-muted',   dot: 'var(--color-muted)' },
  DISPENSED:   { label: 'Dispensed',   cls: 'badge-success', dot: 'var(--color-success)' },
  UNPAID:      { label: 'Unpaid',      cls: 'badge-danger',  dot: 'var(--color-danger)' },
  PAID:        { label: 'Paid',        cls: 'badge-success', dot: 'var(--color-success)' },
  TODO:        { label: 'To Do',       cls: 'badge-muted' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-info',    dot: 'var(--color-info)' },
  DONE:        { label: 'Done',        cls: 'badge-success', dot: 'var(--color-success)' },
  ACTIVE:      { label: 'Active',      cls: 'badge-success', dot: 'var(--color-success)' },
  INACTIVE:    { label: 'Inactive',    cls: 'badge-muted' },
};

export default function StatusChip({ status }: { status: Status }) {
  const s = MAP[status] ?? { label: status, cls: 'badge-muted' };
  return (
    <span className={`badge ${s.cls}`}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />}
      {s.label}
    </span>
  );
}
