import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { Medicine, Prescription } from '../../types';
import { wsService } from '../../lib/websocket';
import {
  Pill, AlertTriangle, CheckCircle2, Package, RefreshCw, Plus, Search,
  TrendingDown, ClipboardList, Bell, BarChart3, ShoppingCart, Eye
} from 'lucide-react';

interface MedicineForm { name: string; description: string; unitPrice: string; stockQty: string; reorderLevel: string; }

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [lowStock, setLowStock] = useState<Medicine[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [tab, setTab] = useState<'queue' | 'inventory' | 'add'>('queue');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [dispensing, setDispensing] = useState<number | null>(null);
  const [newMedForm, setNewMedForm] = useState<MedicineForm>({ name: '', description: '', unitPrice: '', stockQty: '', reorderLevel: '' });
  const [addingMed, setAddingMed] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    api.get('/pharmacy/prescriptions').then((r) => setPrescriptions(unwrap(r))).catch(() => {});
    api.get('/pharmacy/medicines/low-stock').then((r) => setLowStock(unwrap(r))).catch(() => {});
    api.get('/pharmacy/medicines').then((r) => setAllMedicines(unwrap(r) ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const handleNewPrescription = () => {
      setLiveCount(c => c + 1);
      showToast('New prescription received!', 'info');
      load();
    };
    wsService.subscribe('/topic/prescriptions', handleNewPrescription);
    return () => {
      wsService.unsubscribe('/topic/prescriptions', handleNewPrescription);
    };
  }, [load]);

  const dispense = async (id: number) => {
    setDispensing(id);
    try {
      await api.patch(`/pharmacy/prescriptions/${id}/dispense`);
      load(); showToast('Prescription dispensed successfully');
    } catch { showToast('Failed to dispense', 'error'); }
    finally { setDispensing(null); }
  };

  const addMedicine = async () => {
    if (!newMedForm.name || !newMedForm.unitPrice || !newMedForm.stockQty) return showToast('Fill required fields', 'error');
    setAddingMed(true);
    try {
      await api.post('/pharmacy/medicines', {
        name: newMedForm.name,
        description: newMedForm.description,
        unitPrice: Number(newMedForm.unitPrice),
        stockQty: Number(newMedForm.stockQty),
        reorderLevel: Number(newMedForm.reorderLevel) || 10,
      });
      load(); showToast('Medicine added to inventory');
      setNewMedForm({ name: '', description: '', unitPrice: '', stockQty: '', reorderLevel: '' });
    } catch { showToast('Failed to add medicine', 'error'); }
    finally { setAddingMed(false); }
  };

  const pendingRx = prescriptions.filter(p => p.status === 'PENDING');
  const filteredMeds = allMedicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      title="Pharmacist"
      links={[{ to: '/pharmacist', label: 'Pharmacy' }]}
      actions={<button className="btn-secondary text-xs" onClick={load}><RefreshCw size={13}/></button>}
    >
      {toast && (
        <div className={`fixed top-6 right-6 z-50 alert ${toast.type==='error'?'alert-danger':toast.type==='info'?'alert-info':'alert-success'} px-5 py-3 animate-fade-up shadow-xl`}>
          {toast.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>} {toast.msg}
        </div>
      )}

      {liveCount > 0 && (
        <div className="fixed top-20 right-6 z-40 card p-3 shadow-xl animate-fade-in border-l-4" style={{ borderLeftColor: 'var(--color-warning)' }}>
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: 'var(--color-warning)' }} />
            <span className="text-sm font-medium">{liveCount} new prescription{liveCount > 1 ? 's' : ''}</span>
            <button className="text-xs" style={{ color: 'var(--color-muted)' }} onClick={() => setLiveCount(0)}>✕</button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title gradient-text">Pharmacy Desk</h1>
          <p className="page-subtitle">Manage prescriptions, inventory & dispensing</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8 stagger-children">
        <StatCard label="Pending Rx" value={pendingRx.length} icon={<ClipboardList size={22}/>} accent="amber" />
        <StatCard label="Low Stock Items" value={lowStock.length} icon={<TrendingDown size={22}/>} accent="red" />
        <StatCard label="Dispensed Today" value={prescriptions.filter(p=>p.status==='DISPENSED').length} icon={<CheckCircle2 size={22}/>} accent="green" />
        <StatCard label="Total Medicines" value={allMedicines.length} icon={<Package size={22}/>} accent="teal" />
      </div>

      {/* Low-stock banner */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle size={16}/> <strong>{lowStock.length} medicine{lowStock.length>1?'s':''}</strong> running low on stock — reorder soon
        </div>
      )}

      {/* Tabs */}
      <div className="tabs mb-6">
        {([
          ['queue', 'Prescription Queue', <ClipboardList size={14}/>, pendingRx.length],
          ['inventory', 'Inventory', <Package size={14}/>, null],
          ['add', 'Add Medicine', <Plus size={14}/>, null],
        ] as const).map(([key, label, icon, count]) => (
          <button key={key} className={`tab-btn flex items-center gap-2 ${tab===key?'active':''}`} onClick={() => setTab(key as any)}>
            {icon} {label}
            {count ? <span className="badge badge-warning text-xs px-1.5 py-0.5">{count}</span> : null}
          </button>
        ))}
      </div>

      {/* QUEUE TAB */}
      {tab === 'queue' && (
        <div className="animate-fade-in space-y-4">
          {prescriptions.length === 0 ? <EmptyState message="No prescriptions in queue" /> : (
            prescriptions.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)' }}>
                      <Pill size={18} style={{ color: p.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-success)' }} />
                    </div>
                    <div>
                      <p className="font-semibold">Rx #{p.id}</p>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Patient #{p.patientId} · Dr. #{p.doctorId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={p.status} />
                    {p.status === 'PENDING' && (
                      <button className="btn-primary text-xs py-1.5 px-3" onClick={() => dispense(p.id)} disabled={dispensing === p.id}>
                        <CheckCircle2 size={13}/> {dispensing === p.id ? 'Dispensing...' : 'Dispense'}
                      </button>
                    )}
                  </div>
                </div>
                {p.items && p.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-muted)' }}>MEDICATIONS</p>
                    <div className="flex flex-wrap gap-2">
                      {p.items.map((it) => (
                        <span key={it.id} className="badge badge-primary">Medicine #{it.medicineId} — {it.dosage}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* INVENTORY TAB */}
      {tab === 'inventory' && (
        <div className="animate-fade-in">
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
              <input className="input-field pl-9" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {lowStock.length > 0 && (
            <div className="card card-accent-amber p-5 mb-5">
              <h2 className="section-title flex items-center gap-2"><TrendingDown size={16}/> Low Stock Alerts</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {lowStock.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)' }}>
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="badge badge-danger"><AlertTriangle size={11}/> {m.stockQty} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="section-title flex items-center gap-2"><Package size={16}/> All Medicines ({filteredMeds.length})</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Medicine</th><th>Description</th><th>Stock</th><th>Unit Price</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredMeds.map(m => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.name}</td>
                      <td className="text-sm" style={{ color: 'var(--color-muted)' }}>{m.description ?? '—'}</td>
                      <td>
                        <span className={m.stockQty <= (m.reorderLevel ?? 10) ? 'text-red-500 font-semibold' : ''}>{m.stockQty} units</span>
                      </td>
                      <td>₹{m.unitPrice}</td>
                      <td>
                        {m.stockQty <= (m.reorderLevel ?? 10)
                          ? <span className="badge badge-danger"><AlertTriangle size={11}/> Low</span>
                          : <span className="badge badge-success">In Stock</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredMeds.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6"><EmptyState message="No medicines found" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEDICINE TAB */}
      {tab === 'add' && (
        <div className="card p-6 max-w-xl animate-fade-in">
          <h2 className="section-title flex items-center gap-2"><Plus size={16}/> Add Medicine to Inventory</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>MEDICINE NAME *</label>
              <input className="input-field" placeholder="e.g. Amoxicillin 500mg" value={newMedForm.name} onChange={e => setNewMedForm(f=>({...f, name:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DESCRIPTION</label>
              <textarea className="input-field resize-none min-h-[70px]" placeholder="Medicine description..." value={newMedForm.description} onChange={e => setNewMedForm(f=>({...f, description:e.target.value}))} />
            </div>
            <div className="grid gap-3 grid-cols-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>UNIT PRICE (₹) *</label>
                <input className="input-field" type="number" min="0" placeholder="0.00" value={newMedForm.unitPrice} onChange={e => setNewMedForm(f=>({...f, unitPrice:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>STOCK QTY *</label>
                <input className="input-field" type="number" min="0" placeholder="100" value={newMedForm.stockQty} onChange={e => setNewMedForm(f=>({...f, stockQty:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>REORDER LEVEL</label>
                <input className="input-field" type="number" min="0" placeholder="10" value={newMedForm.reorderLevel} onChange={e => setNewMedForm(f=>({...f, reorderLevel:e.target.value}))} />
              </div>
            </div>
            <button className="btn-primary w-full" onClick={addMedicine} disabled={addingMed}>
              <ShoppingCart size={15}/> {addingMed ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
