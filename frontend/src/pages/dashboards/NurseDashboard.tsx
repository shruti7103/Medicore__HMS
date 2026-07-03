import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { NursingTask } from '../../types';

interface Assignment { id: number; patientId: number; status: string; notes?: string; }

export default function NurseDashboard() {
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [patientId, setPatientId] = useState('1');
  const [vitals, setVitals] = useState({ bpSystolic: '', bpDiastolic: '', pulse: '', temperatureC: '', weightKg: '' });
  const [medLog, setMedLog] = useState({ prescriptionItemId: '', notes: '' });

  const load = () => {
    api.get('/nurse/tasks').then((r) => setTasks(unwrap(r))).catch(() => setTasks([]));
    api.get('/nurse/assignments').then((r) => setAssignments(unwrap(r))).catch(() => setAssignments([]));
  };

  useEffect(() => { load(); }, []);

  const complete = async (id: number) => {
    await api.patch(`/nurse/tasks/${id}/complete`);
    load();
  };

  const recordVitals = async () => {
    await api.post(`/patients/${patientId}/vitals`, {
      bpSystolic: Number(vitals.bpSystolic) || null,
      bpDiastolic: Number(vitals.bpDiastolic) || null,
      pulse: Number(vitals.pulse) || null,
      temperatureC: Number(vitals.temperatureC) || null,
      weightKg: Number(vitals.weightKg) || null,
    });
    alert('Vitals recorded');
  };

  const logMedication = async () => {
    await api.post('/nurse/medication-log', {
      patientId: Number(patientId),
      prescriptionItemId: Number(medLog.prescriptionItemId),
      notes: medLog.notes,
    });
    alert('Medication administration logged');
    setMedLog({ prescriptionItemId: '', notes: '' });
  };

  return (
    <DashboardLayout title="Nurse" links={[{ to: '/nurse', label: 'Ward' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Nursing Station</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{assignments.length}</p><p className="text-sm" style={{ color: 'var(--color-muted)' }}>Assigned Patients</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{tasks.filter((t) => t.status !== 'DONE').length}</p><p className="text-sm" style={{ color: 'var(--color-muted)' }}>Open Tasks</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{tasks.filter((t) => t.status === 'DONE').length}</p><p className="text-sm" style={{ color: 'var(--color-muted)' }}>Completed Today</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Assigned Patients</h2>
          {assignments.length === 0 ? <EmptyState message="No patient assignments" /> : assignments.map((a) => (
            <div key={a.id} className="mb-3 border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-medium">Patient #{a.patientId}</p>
              {a.notes && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{a.notes}</p>}
              <StatusChip status={a.status} />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Task Board</h2>
          {tasks.length === 0 ? <EmptyState message="No tasks assigned" /> : tasks.map((t) => (
            <div key={t.id} className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm">Patient #{t.patientId}</p>
                <StatusChip status={t.status} />
              </div>
              {t.status !== 'DONE' && <button type="button" className="btn-primary text-xs" onClick={() => complete(t.id)}>Done</button>}
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Record Vitals</h2>
          <input className="input-field mb-2" placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            {(['bpSystolic', 'bpDiastolic', 'pulse', 'temperatureC', 'weightKg'] as const).map((k) => (
              <input key={k} className="input-field" placeholder={k} value={vitals[k]} onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })} />
            ))}
          </div>
          <button type="button" className="btn-primary mt-3" onClick={recordVitals}>Save Vitals</button>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Medication Administration (MAR)</h2>
          <input className="input-field mb-2" placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <input className="input-field mb-2" placeholder="Prescription Item ID" value={medLog.prescriptionItemId} onChange={(e) => setMedLog({ ...medLog, prescriptionItemId: e.target.value })} />
          <input className="input-field mb-2" placeholder="Notes" value={medLog.notes} onChange={(e) => setMedLog({ ...medLog, notes: e.target.value })} />
          <button type="button" className="btn-primary" onClick={logMedication}>Log Dose</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
