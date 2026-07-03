const styles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  UNPAID: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  DISPENSED: 'bg-green-100 text-green-800',
};

export default function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
