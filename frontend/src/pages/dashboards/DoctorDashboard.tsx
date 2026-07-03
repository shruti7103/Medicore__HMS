import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import { api, unwrap } from '../../lib/api';
import type { Appointment } from '../../types';
import { wsService } from '../../lib/websocket';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activePrescriptionAppt, setActivePrescriptionAppt] = useState<number | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ medication: '', dosage: '', instructions: '' });

  useEffect(() => {
    api.get('/doctors/me').then((r) => {
      const doc = unwrap<{ id: number }>(r);
      return api.get(`/appointments/doctor/${doc.id}`);
    }).then((r) => setAppointments(unwrap(r))).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.slotStart.startsWith(today));

  const joinTelemedicine = (roomId: string) => {
      navigate(`/telemedicine/${roomId}`);
  };

  const sendPrescription = async (apptId: number, patientId: number) => {
      try {
          const payload = {
              patientId, doctorId: apptId, // Using apptId for context
              medications: [{ 
                  name: prescriptionForm.medication, 
                  dosage: prescriptionForm.dosage, 
                  instructions: prescriptionForm.instructions 
              }]
          };
          await api.post('/prescriptions', payload);
          // Broadcast via WS
          wsService.sendMessage('/app/pharmacy.new', payload);
          alert('Prescription sent to pharmacy queue.');
          setActivePrescriptionAppt(null);
          setPrescriptionForm({ medication: '', dosage: '', instructions: '' });
      } catch {}
  };

  return (
    <DashboardLayout title="Doctor" links={[{ to: '/doctor', label: 'Schedule' }, { to: '/messages', label: 'Messages' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Today&apos;s Schedule</h1>
      <div className="space-y-3">
        {todayAppts.length === 0 && <p style={{ color: 'var(--color-muted)' }}>No appointments today.</p>}
        {todayAppts.map((a) => (
          <div key={a.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Patient #{a.patientId}</p>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    {new Date(a.slotStart).toLocaleTimeString()} — {a.reason || 'Consultation'}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                    <StatusChip status={a.status} />
                    {a.telemedicineLink && (
                        <button className="btn-primary" onClick={() => joinTelemedicine(a.telemedicineLink!)}>
                           Join Video
                        </button>
                    )}
                    <button className="btn-secondary" onClick={() => setActivePrescriptionAppt(activePrescriptionAppt === a.id ? null : a.id)}>
                        Rx
                    </button>
                </div>
              </div>
              
              {activePrescriptionAppt === a.id && (
                  <div className="mt-4 p-4 border-t border-[var(--color-border)] bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-bold mb-2">E-Prescription Composer</h3>
                      <div className="flex flex-col gap-2">
                          <input className="input-field" placeholder="Medication Name" 
                                 value={prescriptionForm.medication} onChange={e => setPrescriptionForm(f => ({...f, medication: e.target.value}))}/>
                          <input className="input-field" placeholder="Dosage (e.g. 1 pill twice a day)" 
                                 value={prescriptionForm.dosage} onChange={e => setPrescriptionForm(f => ({...f, dosage: e.target.value}))}/>
                          <input className="input-field" placeholder="Additional Instructions" 
                                 value={prescriptionForm.instructions} onChange={e => setPrescriptionForm(f => ({...f, instructions: e.target.value}))}/>
                          <div className="flex justify-end mt-2">
                              <button className="btn-primary" onClick={() => sendPrescription(a.id, a.patientId)}>Send to Pharmacy</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
