import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Medicine, Prescription } from '../../types';

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [lowStock, setLowStock] = useState<Medicine[]>([]);

  const load = () => {
    api.get('/pharmacy/prescriptions').then((r) => setPrescriptions(unwrap(r))).catch(() => {});
    api.get('/pharmacy/medicines/low-stock').then((r) => setLowStock(unwrap(r))).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const dispense = async (id: number) => {
    await api.patch(`/pharmacy/prescriptions/${id}/dispense`);
    load();
  };

  return (
    <DashboardLayout title="Pharmacist" links={[{ to: '/pharmacist', label: 'Pharmacy' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Pharmacy Desk</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Pending Prescriptions</h2>
          {prescriptions.map((p) => (
            <div key={p.id} className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="text-sm font-medium">Rx #{p.id} — Patient #{p.patientId}</p>
                <StatusChip status={p.status} />
              </div>
              {p.status === 'PENDING' && (
                <button type="button" className="btn-primary text-xs" onClick={() => dispense(p.id)}>Dispense</button>
              )}
            </div>
          ))}
        </div>
        <div className="card card-accent-amber p-5">
          <h2 className="mb-4 font-semibold">Low Stock Alerts</h2>
          {lowStock.map((m) => (
            <div key={m.id} className="border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {m.name} — <span className="text-red-600">{m.stockQty} left</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
