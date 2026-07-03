import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api, unwrap } from '../../lib/api';
import type { Appointment, Patient } from '../../types';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = momentLocalizer(moment);
const Calendar = withDragAndDrop(BigCalendar);

export default function ReceptionistDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/patients').then((r) => setPatients(unwrap(r))).catch(() => {});
    api.get('/appointments').then((r) => setAppointments(unwrap(r))).catch(() => {});
  }, []);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase()));

  const events = appointments.map(a => ({
    id: a.id,
    title: `Appt #${a.id} - ${a.status}`,
    start: new Date(a.slotStart),
    end: new Date(new Date(a.slotStart).getTime() + 30 * 60000)
  }));

  const onEventDrop = async ({ event, start }: any) => {
    try {
        await api.patch(`/appointments/${event.id}/reschedule`, null, { params: { newTime: start.toISOString() } });
        api.get('/appointments').then((r) => setAppointments(unwrap(r))).catch(() => {});
    } catch {}
  };

  return (
    <DashboardLayout title="Receptionist" links={[{ to: '/receptionist', label: 'Front Desk' }, { to: '/messages', label: 'Messages' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Front Desk & Calendar</h1>
      <div className="mb-6">
        <input className="input-field max-w-md" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-4 font-semibold">Patients ({filtered.length})</h2>
          {filtered.slice(0, 8).map((p) => (
            <div key={p.id} className="border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {p.firstName} {p.lastName} — {p.phone || 'No phone'}
            </div>
          ))}
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Appointment Calendar</h2>
          <div style={{ height: 400 }}>
             <Calendar
                localizer={localizer}
                events={events}
                style={{ height: '100%' }}
                onEventDrop={onEventDrop}
                resizable
             />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
