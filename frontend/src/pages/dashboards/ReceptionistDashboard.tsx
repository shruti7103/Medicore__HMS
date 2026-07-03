import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { Appointment, Patient } from '../../types';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import {
  Users, Calendar, Plus, Search, CheckCircle2, AlertTriangle,
  Phone, RefreshCw, Clock, User, FileText, IndianRupee
} from 'lucide-react';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar as any);

interface BookForm { patientId: string; doctorId: string; date: string; time: string; reason: string; }

export default function ReceptionistDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'calendar' | 'patients' | 'book' | 'today'>('today');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookForm, setBookForm] = useState<BookForm>({ patientId: '', doctorId: '', date: new Date().toISOString().slice(0,10), time: '09:00', reason: '' });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    api.get('/patients').then((r) => setPatients(unwrap(r))).catch(() => {});
    api.get('/appointments').then((r) => setAppointments(unwrap(r))).catch(() => {});
    api.get('/doctors').then((r) => setDoctors(unwrap(r) ?? [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.phone ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.slotStart.startsWith(today));

  const events = appointments.map(a => ({
    id: a.id, title: `Patient #${a.patientId}`, start: new Date(a.slotStart),
    end: new Date(new Date(a.slotStart).getTime() + 30 * 60000),
    resource: a,
  }));

  const onEventDrop = async ({ event, start }: any) => {
    try {
      await api.patch(`/appointments/${event.id}/reschedule`, null, { params: { newTime: (start as Date).toISOString() } });
      load(); showToast('Appointment rescheduled');
    } catch { showToast('Reschedule failed', 'error'); }
  };

  const bookAppointment = async () => {
    if (!bookForm.patientId || !bookForm.doctorId) return showToast('Select patient and doctor', 'error');
    setBooking(true);
    try {
      const slotStart = new Date(`${bookForm.date}T${bookForm.time}:00`).toISOString();
      const slotEnd = new Date(new Date(slotStart).getTime() + 30 * 60000).toISOString();
      await api.post('/appointments', {
        patientId: Number(bookForm.patientId),
        doctorId: Number(bookForm.doctorId),
        slotStart, slotEnd,
        reason: bookForm.reason || 'General consultation',
      });
      load(); showToast('Appointment booked successfully');
      setBookForm({ patientId: '', doctorId: '', date: today, time: '09:00', reason: '' });
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Booking failed', 'error');
    } finally { setBooking(false); }
  };

  const cancelAppt = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return;
    try { await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' }); load(); showToast('Appointment cancelled'); }
    catch { showToast('Failed to cancel', 'error'); }
  };

  return (
    <DashboardLayout
      title="Receptionist"
      links={[
        { to: '/receptionist', label: 'Front Desk' },
        { to: '/messages', label: 'Messages' },
      ]}
      actions={<button className="btn-secondary text-xs" onClick={load}><RefreshCw size={13}/></button>}
    >
      {toast && (
        <div className={`fixed top-6 right-6 z-50 alert ${toast.type==='error'?'alert-danger':'alert-success'} px-5 py-3 animate-fade-up shadow-xl`}>
          {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>} {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title gradient-text">Front Desk</h1>
          <p className="page-subtitle">Manage appointments, patients & scheduling</p>
        </div>
        <button className="btn-primary" onClick={() => setTab('book')}>
          <Plus size={16}/> Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8 stagger-children">
        <StatCard label="Today's Appointments" value={todayAppts.length} icon={<Calendar size={22}/>} accent="teal" />
        <StatCard label="Pending Check-ins" value={todayAppts.filter(a=>a.status==='PENDING').length} icon={<Clock size={22}/>} accent="amber" />
        <StatCard label="Total Patients" value={patients.length} icon={<Users size={22}/>} accent="indigo" />
        <StatCard label="Completed Today" value={todayAppts.filter(a=>a.status==='COMPLETED').length} icon={<CheckCircle2 size={22}/>} accent="green" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {([
          ['today', "Today's Appointments", <Clock size={14}/>],
          ['calendar', 'Calendar View', <Calendar size={14}/>],
          ['patients', 'Patient Directory', <Users size={14}/>],
          ['book', 'Book Appointment', <Plus size={14}/>],
        ] as const).map(([key, label, icon]) => (
          <button key={key} className={`tab-btn flex items-center gap-2 ${tab===key?'active':''}`} onClick={() => setTab(key as any)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <div className="animate-fade-in space-y-3">
          {todayAppts.length === 0 && <EmptyState message="No appointments today" />}
          {todayAppts.map(a => (
            <div key={a.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                    <User size={18} style={{ color: 'var(--color-primary)' }}/>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Patient #{a.patientId}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {new Date(a.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Dr. #{a.doctorId}
                    </p>
                    {a.reason && <p className="text-xs mt-0.5">{a.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={a.status} />
                  {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                    <button className="btn-secondary text-xs py-1 px-2" onClick={() => cancelAppt(a.id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR TAB */}
      {tab === 'calendar' && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0 flex items-center gap-2"><Calendar size={16}/> Appointment Calendar</h2>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Drag to reschedule</p>
          </div>
          <div style={{ height: 520 }}>
            <DnDCalendar
              localizer={localizer}
              events={events}
              style={{ height: '100%' }}
              onEventDrop={onEventDrop}
              resizable
              onSelectEvent={(ev: any) => setSelectedEvent(ev)}
              popup
            />
          </div>
          {selectedEvent && (
            <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
              <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold mb-3">Appointment Details</h3>
                <p className="text-sm mb-1"><strong>Patient:</strong> #{selectedEvent.resource?.patientId}</p>
                <p className="text-sm mb-1"><strong>Time:</strong> {new Date(selectedEvent.resource?.slotStart).toLocaleString()}</p>
                <p className="text-sm mb-3"><strong>Status:</strong> <StatusChip status={selectedEvent.resource?.status}/></p>
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => setSelectedEvent(null)}>Close</button>
                  {selectedEvent.resource?.status !== 'CANCELLED' && selectedEvent.resource?.status !== 'COMPLETED' && (
                    <button className="btn-danger flex-1" onClick={() => { cancelAppt(selectedEvent.id); setSelectedEvent(null); }}>Cancel Appt.</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PATIENTS TAB */}
      {tab === 'patients' && (
        <div className="animate-fade-in">
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}/>
              <input className="input-field pl-9" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="card p-5">
            <h2 className="section-title flex items-center gap-2 mb-4">
              <Users size={16}/> Patients <span className="badge badge-muted">{filtered.length}</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Appointments</th></tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))' }}>
                            {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                          </div>
                          <span className="font-medium">{p.firstName} {p.lastName}</span>
                        </div>
                      </td>
                      <td>
                        {p.phone ? <><Phone size={12} className="inline mr-1"/>{p.phone}</> : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                      </td>
                      <td>
                        <span className="badge badge-primary">{appointments.filter(a=>a.patientId===p.id).length} appts</span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={3}><EmptyState message="No patients found" /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BOOK TAB */}
      {tab === 'book' && (
        <div className="card p-6 max-w-2xl animate-fade-in">
          <h2 className="section-title flex items-center gap-2"><Plus size={16}/> Book New Appointment</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>PATIENT *</label>
                <select className="input-field" value={bookForm.patientId} onChange={e => setBookForm(f=>({...f, patientId: e.target.value}))}>
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DOCTOR *</label>
                <select className="input-field" value={bookForm.doctorId} onChange={e => setBookForm(f=>({...f, doctorId: e.target.value}))}>
                  <option value="">Select doctor...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.department ?? 'General'}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DATE *</label>
                <input className="input-field" type="date" min={today} value={bookForm.date} onChange={e => setBookForm(f=>({...f, date: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>TIME *</label>
                <input className="input-field" type="time" value={bookForm.time} onChange={e => setBookForm(f=>({...f, time: e.target.value}))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>REASON FOR VISIT</label>
                <input className="input-field" placeholder="e.g. General consultation, follow-up..." value={bookForm.reason} onChange={e => setBookForm(f=>({...f, reason: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setTab('today')}>Cancel</button>
              <button className="btn-primary flex-1" onClick={bookAppointment} disabled={booking}>
                <Calendar size={15}/> {booking ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
