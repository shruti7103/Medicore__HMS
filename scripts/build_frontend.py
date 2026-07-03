#!/usr/bin/env python3
"""Update frontend for 6 roles - Java master build."""
from pathlib import Path
ROOT = Path(r"d:\Shruti HMS")
F = ROOT / "frontend" / "src"

def w(p, c):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(c.strip()+"\n", encoding="utf-8"); print("+", p.relative_to(ROOT))

w(F/"types/index.ts", '''export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PrescriptionStatus = 'PENDING' | 'DISPENSED' | 'CANCELLED';
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }
export interface User { id: number; name: string; email: string; role: Role; isActive?: boolean; }
export interface AuthTokens { accessToken: string; refreshToken: string; user: User; }
export interface Patient { id: number; userId: number; firstName: string; lastName: string; phone?: string; }
export interface Doctor { id: number; firstName: string; lastName: string; department?: string; specialization?: string; }
export interface Appointment { id: number; patientId: number; doctorId: number; slotStart: string; slotEnd: string; status: AppointmentStatus; reason?: string; }
export interface Invoice { id: number; patientId: number; amount: number; status: InvoiceStatus; appointmentId?: number; }
export interface Prescription { id: number; patientId: number; doctorId: number; status: PrescriptionStatus; items?: { id: number; medicineId: number; dosage: string; frequency: string; durationDays: number }[]; }
export interface Medicine { id: number; name: string; stockQty: number; unitPrice: number; reorderLevel?: number; description?: string; }
export interface NursingTask { id: number; patientId: number; title: string; status: TaskStatus; dueAt?: string; }
export interface Notification { id: number; title: string; message: string; isRead: boolean; type: string; }
export interface AnalyticsSummary { totalPatients: number; totalDoctors: number; totalNurses?: number; totalAppointments: number; todayAppointments?: number; totalInvoices?: number; revenueThisMonth?: number; }
export interface AuditLog { id: number; action: string; entityType: string; details?: string; createdAt?: string; }

export const ROLE_ROUTES: Record<Role, string> = {
  ADMIN: '/admin', DOCTOR: '/doctor', NURSE: '/nurse', RECEPTIONIST: '/receptionist', PATIENT: '/patient', PHARMACIST: '/pharmacist',
};''')

w(F/"components/NotificationBell.tsx", '''import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api, unwrap } from '../lib/api';
import type { Notification } from '../types';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => {
    api.get('/notifications/unread-count').then(r => setCount(unwrap<{count:number}>(r).count)).catch(() => {});
    api.get('/notifications').then(r => setItems(unwrap(r).slice(0, 8))).catch(() => {});
  };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="btn-secondary relative p-2">
        <Bell className="h-4 w-4" />
        {count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs text-white">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border p-2 shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {items.length === 0 && <p className="p-2 text-sm" style={{ color: 'var(--color-muted)' }}>No notifications</p>}
          {items.map(n => (
            <div key={n.id} className="border-b p-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-medium">{n.title}</p><p style={{ color: 'var(--color-muted)' }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}''')

w(F/"components/EmptyState.tsx", '''export default function EmptyState({ message }: { message: string }) {
  return <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>{message}</div>;
}''')

w(F/"pages/dashboards/NurseDashboard.tsx", '''import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { NursingTask } from '../../types';

export default function NurseDashboard() {
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [patientId, setPatientId] = useState('1');
  const [vitals, setVitals] = useState({ bpSystolic: '', bpDiastolic: '', pulse: '', temperatureC: '', weightKg: '' });
  const load = () => api.get('/nurse/tasks').then(r => setTasks(unwrap(r))).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  const complete = async (id: number) => { await api.patch(`/nurse/tasks/${id}/complete`); load(); };
  const recordVitals = async () => {
    await api.post(`/patients/${patientId}/vitals`, {
      bpSystolic: Number(vitals.bpSystolic) || null, bpDiastolic: Number(vitals.bpDiastolic) || null,
      pulse: Number(vitals.pulse) || null, temperatureC: Number(vitals.temperatureC) || null,
      weightKg: Number(vitals.weightKg) || null,
    });
    alert('Vitals recorded');
  };

  return (
    <DashboardLayout title="Nurse Ward">
      <h1 className="mb-6 font-display text-2xl font-bold">Nursing Station</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Task Board</h2>
          {tasks.length === 0 ? <EmptyState message="No tasks assigned" /> : tasks.map(t => (
            <div key={t.id} className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div><p className="font-medium">{t.title}</p><p className="text-sm">Patient #{t.patientId}</p><StatusChip status={t.status} /></div>
              {t.status !== 'DONE' && <button className="btn-primary text-xs" onClick={() => complete(t.id)}>Done</button>}
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Record Vitals</h2>
          <input className="input-field mb-2" placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            {(['bpSystolic','bpDiastolic','pulse','temperatureC','weightKg'] as const).map(k => (
              <input key={k} className="input-field" placeholder={k} value={vitals[k]} onChange={e => setVitals({...vitals,[k]:e.target.value})} />
            ))}
          </div>
          <button className="btn-primary mt-3" onClick={recordVitals}>Save Vitals</button>
        </div>
      </div>
    </DashboardLayout>
  );
}''')

print("Frontend core updated - run App/Sidebar/Admin updates manually")
