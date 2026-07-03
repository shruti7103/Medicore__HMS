import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Appointment, Doctor, Invoice, Patient } from '../../types';

export default function PatientDashboard() {
  const [profile, setProfile] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ slotStart: string; slotEnd: string }[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [symptomResult, setSymptomResult] = useState<{ department: string; confidence: number } | null>(null);

  useEffect(() => {
    api.get('/patients/me').then((r) => setProfile(unwrap(r))).catch(() => {});
    api.get('/doctors').then((r) => setDoctors(unwrap(r))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    api.get(`/appointments/patient/${profile.id}`).then((r) => setAppointments(unwrap(r))).catch(() => {});
    api.get(`/billing/invoices/patient/${profile.id}`).then((r) => setInvoices(unwrap(r))).catch(() => {});
  }, [profile]);

  useEffect(() => {
    if (!selectedDoctor) return;
    api.get(`/doctors/${selectedDoctor}/slots?date=${selectedDate}`).then((r) => setSlots(unwrap(r))).catch(() => setSlots([]));
  }, [selectedDoctor, selectedDate]);

  const bookSlot = async (slot: { slotStart: string; slotEnd: string }) => {
    if (!profile || !selectedDoctor) return;
    await api.post('/appointments', {
      patientId: profile.id,
      doctorId: Number(selectedDoctor),
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
      reason: 'General consultation',
    });
    const r = await api.get(`/appointments/patient/${profile.id}`);
    setAppointments(unwrap(r));
  };

  const checkSymptoms = async () => {
    if (!symptoms.trim()) return;
    const r = await api.post('/symptom-check', { symptoms });
    setSymptomResult(unwrap(r));
  };

  return (
    <DashboardLayout title="Patient" links={[{ to: '/patient', label: 'My Health' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">My Health</h1>
      {!profile && (
        <div className="card mb-6 p-5">
          <p className="mb-3">Complete your patient profile first.</p>
          <button className="btn-primary" onClick={async () => {
            await api.post('/patients', { firstName: 'New', lastName: 'Patient', phone: '' });
            const r = await api.get('/patients/me');
            setProfile(unwrap(r));
          }}>Create Profile</button>
        </div>
      )}
      <div className="card mb-6 p-5">
        <h2 className="mb-3 font-semibold">Symptom Pre-Check</h2>
        <textarea className="input-field mb-2 min-h-[80px]" placeholder="Describe your symptoms..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        <button type="button" className="btn-secondary mr-2" onClick={checkSymptoms}>Check Symptoms</button>
        {symptomResult && <p className="mt-2 text-sm">Suggested: <strong>{symptomResult.department}</strong> ({Math.round(symptomResult.confidence * 100)}% confidence)</p>}
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Upcoming Appointments</h2>
          {appointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').map((a) => (
            <div key={a.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span>{new Date(a.slotStart).toLocaleString()}</span>
              <StatusChip status={a.status} />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Bills</h2>
          {invoices.map((inv) => (
            <div key={inv.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <span>₹{inv.amount}</span>
              <StatusChip status={inv.status} />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Book Appointment</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="input-field max-w-xs" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
            <option value="">Select doctor</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.department}</option>)}
          </select>
          <input type="date" className="input-field max-w-xs" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button key={s.slotStart} type="button" className="btn-secondary text-xs" onClick={() => bookSlot(s)}>
              {new Date(s.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
