import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { NursingTask } from '../../types';
import {
  Heart, ClipboardList, Activity, CheckCircle2, Thermometer,
  Pill, User, Clock, AlertTriangle, RefreshCw, Plus, X
} from 'lucide-react';

interface Assignment { id: number; patientId: number; status: string; notes?: string; }
interface VitalsForm { bpSystolic: string; bpDiastolic: string; pulse: string; temperatureC: string; weightKg: string; spO2: string; }

export default function NurseDashboard() {
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'mar' | 'tasks'>('overview');
  const [patientId, setPatientId] = useState('');
  const [vitals, setVitals] = useState<VitalsForm>({ bpSystolic: '', bpDiastolic: '', pulse: '', temperatureC: '', weightKg: '', spO2: '' });
  const [medLog, setMedLog] = useState({ prescriptionItemId: '', notes: '' });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    api.get('/nurse/tasks').then((r) => setTasks(unwrap(r))).catch(() => setTasks([]));
    api.get('/nurse/assignments').then((r) => setAssignments(unwrap(r))).catch(() => setAssignments([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async (id: number) => {
    try { await api.patch(`/nurse/tasks/${id}/complete`); load(); showToast('Task completed'); }
    catch { showToast('Failed to complete task', 'error'); }
  };

  const recordVitals = async () => {
    if (!patientId) return showToast('Enter patient ID', 'error');
    setSaving(true);
    try {
      await api.post(`/patients/${patientId}/vitals`, {
        bpSystolic: Number(vitals.bpSystolic) || null,
        bpDiastolic: Number(vitals.bpDiastolic) || null,
        pulse: Number(vitals.pulse) || null,
        temperatureC: Number(vitals.temperatureC) || null,
        weightKg: Number(vitals.weightKg) || null,
        spO2: Number(vitals.spO2) || null,
      });
      showToast('Vitals recorded successfully');
      setVitals({ bpSystolic: '', bpDiastolic: '', pulse: '', temperatureC: '', weightKg: '', spO2: '' });
    } catch { showToast('Failed to record vitals', 'error'); }
    finally { setSaving(false); }
  };

  const logMedication = async () => {
    if (!patientId || !medLog.prescriptionItemId) return showToast('Fill all required fields', 'error');
    setSaving(true);
    try {
      await api.post('/nurse/medication-log', {
        patientId: Number(patientId),
        prescriptionItemId: Number(medLog.prescriptionItemId),
        notes: medLog.notes,
      });
      showToast('Medication administration logged');
      setMedLog({ prescriptionItemId: '', notes: '' });
    } catch { showToast('Failed to log medication', 'error'); }
    finally { setSaving(false); }
  };

  const openTasks = tasks.filter(t => t.status !== 'DONE');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const VITALS_FIELDS: { key: keyof VitalsForm; label: string; unit: string; placeholder: string }[] = [
    { key: 'bpSystolic', label: 'BP Systolic', unit: 'mmHg', placeholder: '120' },
    { key: 'bpDiastolic', label: 'BP Diastolic', unit: 'mmHg', placeholder: '80' },
    { key: 'pulse', label: 'Pulse Rate', unit: 'bpm', placeholder: '72' },
    { key: 'temperatureC', label: 'Temperature', unit: '°C', placeholder: '37.0' },
    { key: 'weightKg', label: 'Weight', unit: 'kg', placeholder: '65' },
    { key: 'spO2', label: 'SpO₂', unit: '%', placeholder: '98' },
  ];

  return (
    <DashboardLayout
      title="Nurse"
      links={[
        { to: '/nurse', label: 'Ward' },
        { to: '/messages', label: 'Messages' },
      ]}
      actions={<button className="btn-secondary text-xs" onClick={load}><RefreshCw size={13}/></button>}
    >
      {toast && (
        <div className={`fixed top-6 right-6 z-50 alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'} px-5 py-3 animate-fade-up shadow-xl`}>
          {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title gradient-text">Nursing Station</h1>
          <p className="page-subtitle">Patient care, vitals monitoring & task management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8 stagger-children">
        <StatCard label="Assigned Patients" value={assignments.length} icon={<User size={22}/>} accent="teal" />
        <StatCard label="Open Tasks" value={openTasks.length} icon={<ClipboardList size={22}/>} accent="amber" />
        <StatCard label="Completed Today" value={doneTasks.length} icon={<CheckCircle2 size={22}/>} accent="green" />
        <StatCard label="Urgent Tasks" value={openTasks.filter(t=>t.status==='IN_PROGRESS').length} icon={<AlertTriangle size={22}/>} accent="red" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {([['overview','Overview',<Heart size={14}/>],['vitals','Record Vitals',<Thermometer size={14}/>],['mar','Medication (MAR)',<Pill size={14}/>],['tasks','Task Board',<ClipboardList size={14}/>]] as const).map(([key,label,icon])=>(
          <button key={key} className={`tab-btn flex items-center gap-2 ${activeTab===key?'active':''}`} onClick={() => setActiveTab(key as any)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2 animate-fade-in">
          <div className="card p-5">
            <h2 className="section-title flex items-center gap-2"><User size={16}/> Assigned Patients</h2>
            {assignments.length === 0 ? <EmptyState message="No patient assignments" /> : assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 mb-2 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                  <User size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Patient #{a.patientId}</p>
                  {a.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{a.notes}</p>}
                </div>
                <StatusChip status={a.status} />
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="section-title flex items-center gap-2"><Activity size={16}/> Quick Overview</h2>
            <div className="space-y-3">
              {tasks.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Patient #{t.patientId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={t.status} />
                    {t.status !== 'DONE' && (
                      <button className="btn-success text-xs py-1 px-2" onClick={() => complete(t.id)}>
                        <CheckCircle2 size={12}/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <EmptyState message="No tasks assigned" />}
            </div>
          </div>
        </div>
      )}

      {/* VITALS TAB */}
      {activeTab === 'vitals' && (
        <div className="card p-6 max-w-2xl animate-fade-in">
          <h2 className="section-title flex items-center gap-2"><Thermometer size={16}/> Record Patient Vitals</h2>
          <div className="mb-4">
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>PATIENT ID *</label>
            <input className="input-field max-w-xs" placeholder="Enter patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VITALS_FIELDS.map(({ key, label, unit, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold mb-1 flex items-center justify-between" style={{ color: 'var(--color-muted)' }}>
                  <span>{label}</span> <span className="badge badge-muted">{unit}</span>
                </label>
                <input
                  className="input-field"
                  placeholder={placeholder}
                  type="number"
                  value={vitals[key]}
                  onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <button className="btn-primary mt-5 w-full" onClick={recordVitals} disabled={saving}>
            <Activity size={15}/> {saving ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>
      )}

      {/* MAR TAB */}
      {activeTab === 'mar' && (
        <div className="card p-6 max-w-xl animate-fade-in">
          <h2 className="section-title flex items-center gap-2"><Pill size={16}/> Medication Administration Record</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>PATIENT ID *</label>
              <input className="input-field" placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>PRESCRIPTION ITEM ID *</label>
              <input className="input-field" placeholder="Prescription Item ID" value={medLog.prescriptionItemId} onChange={(e) => setMedLog({ ...medLog, prescriptionItemId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>NOTES</label>
              <textarea className="input-field min-h-[80px] resize-none" placeholder="Administration notes..." value={medLog.notes} onChange={(e) => setMedLog({ ...medLog, notes: e.target.value })} />
            </div>
            <button className="btn-primary w-full" onClick={logMedication} disabled={saving}>
              <Plus size={15}/> {saving ? 'Logging...' : 'Log Dose Given'}
            </button>
          </div>
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="animate-fade-in">
          {openTasks.length > 0 && (
            <div className="card p-5 mb-5">
              <h2 className="section-title flex items-center gap-2"><Clock size={16}/> Open Tasks <span className="badge badge-warning">{openTasks.length}</span></h2>
              <div className="space-y-2">
                {openTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: t.status === 'IN_PROGRESS' ? 'var(--color-warning)' : 'var(--color-muted)' }} />
                      <div>
                        <p className="font-medium text-sm">{t.title}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Patient #{t.patientId} {t.dueAt && `· Due: ${new Date(t.dueAt).toLocaleTimeString()}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={t.status} />
                      <button className="btn-success text-xs py-1.5 px-3" onClick={() => complete(t.id)}>
                        <CheckCircle2 size={13}/> Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {doneTasks.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title flex items-center gap-2"><CheckCircle2 size={16}/> Completed <span className="badge badge-success">{doneTasks.length}</span></h2>
              <div className="space-y-2">
                {doneTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl opacity-70" style={{ background: 'var(--color-bg)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                    <p className="text-sm line-through">{t.title}</p>
                    <span className="ml-auto text-xs" style={{ color: 'var(--color-muted)' }}>Patient #{t.patientId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tasks.length === 0 && <EmptyState message="No tasks assigned" />}
        </div>
      )}
    </DashboardLayout>
  );
}
