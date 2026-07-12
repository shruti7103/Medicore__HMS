import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Appointment, Doctor, Invoice } from '../../types';
import {
  Calendar, IndianRupee, Stethoscope, FileText,
  CheckCircle2, AlertTriangle, Video, Clock, Plus, Brain,
  RefreshCw, User
} from 'lucide-react';
interface PatientProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
}
export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ slotStart: string; slotEnd: string }[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [symptomResult, setSymptomResult] = useState<{ department: string; confidence: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [tab, setTab] = useState<'overview' | 'book' | 'bills' | 'symptoms'>('overview');
  const [checkingSymptoms, setCheckingSymptoms] = useState(false);
  const [booking, setBooking] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  // Create profile form fields
  const [createForm, setCreateForm] = useState({
    firstName: user?.name?.split(' ')[0] ?? '',
    lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
    phone: '',
  });
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  // Load doctors (independent of patient profile)
  useEffect(() => {
    api.get('/doctors')
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);
  // Try to load patient profile â€” gracefully handle 404
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const r = await api.get('/patients/me');
      const data = r.data?.data ?? r.data;
      if (data && data.id) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 400) {
        // Patient doesn't have a profile record yet â€” prompt to create one
        setProfile(null);
      } else {
        setProfileError('Could not reach patient service. Backend may be offline.');
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);
  useEffect(() => { loadProfile(); }, [loadProfile]);
  // Load appointments and invoices once profile is known
  useEffect(() => {
    if (!profile) return;
    api.get(`/appointments/patient/${profile.id}`)
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch(() => setAppointments([]));
    api.get(`/billing/invoices/patient/${profile.id}`)
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setInvoices(Array.isArray(data) ? data : []);
      })
      .catch(() => setInvoices([]));
  }, [profile]);
  // Load doctor slots
  useEffect(() => {
    if (!selectedDoctor) return;
    api.get(`/doctors/${selectedDoctor}/slots?date=${selectedDate}`)
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => setSlots([]));
  }, [selectedDoctor, selectedDate]);
  const createProfile = async () => {
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      return showToast('First name and last name are required', 'error');
    }
    setCreatingProfile(true);
    try {
      await api.post('/patients', {
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        phone: createForm.phone.trim() || null,
      });
      showToast('Patient profile created!');
      await loadProfile();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to create profile';
      showToast(msg, 'error');
    } finally {
      setCreatingProfile(false);
    }
  };
  const bookSlot = async (slot: { slotStart: string; slotEnd: string }) => {
    if (!profile || !selectedDoctor) return showToast('Select a doctor and date', 'error');
    setBooking(true);
    try {
      await api.post('/appointments', {
        patientId: profile.id,
        doctorId: Number(selectedDoctor),
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
        reason: 'General consultation',
      });
      const r = await api.get(`/appointments/patient/${profile.id}`);
      const data = r.data?.data ?? r.data ?? [];
      setAppointments(Array.isArray(data) ? data : []);
      showToast('Appointment booked!');
      setTab('overview');
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Booking failed', 'error');
    } finally {
      setBooking(false); }
  };
  const checkSymptoms = async () => {
    if (!symptoms.trim()) return showToast('Describe your symptoms first', 'error');
    setCheckingSymptoms(true);
    try {
      const r = await api.post('/symptom-check', { symptoms });
      const data = r.data?.data ?? r.data;
      setSymptomResult(data);
    } catch {
      showToast('Symptom check unavailable. Backend may be offline.', 'error');
    } finally {
      setCheckingSymptoms(false);
    }
  };
  const payInvoice = async (inv: Invoice) => {
    if (inv.status === 'PAID') return;
    if (!confirm(`Pay â‚¹${inv.amount} for invoice #${inv.id}?`)) return;
    try {
      await api.patch(`/billing/invoices/${inv.id}/pay`);
      if (profile) {
        const r = await api.get(`/billing/invoices/patient/${profile.id}`);
        const data = r.data?.data ?? r.data ?? [];
        setInvoices(Array.isArray(data) ? data : []);
      }
      showToast('Payment recorded');
    } catch { showToast('Payment failed', 'error'); }
  };
  const upcomingAppts = appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
  const totalDue = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);
  return (
    <DashboardLayout
      title="Patient"
      links={[
        { to: '/patient', label: 'My Health' },
      ]}
      actions={
        <button className="btn-secondary text-xs" onClick={loadProfile}>
          <RefreshCw size={13} />
        </button>
      }
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 alert ${toast.type === 'error' ? 'alert-danger' : toast.type === 'info' ? 'alert-info' : 'alert-success'} px-5 py-3 animate-fade-up shadow-xl`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {toast.msg}
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title gradient-text">My Health Portal</h1>
          <p className="page-subtitle">
            {profile ? `${profile.firstName} ${profile.lastName}` : user?.name ?? 'Welcome'} â€” manage appointments, bills &amp; more
          </p>
        </div>
      </div>
      {/* Backend offline banner */}
      {profileError && (
        <div className="alert alert-danger mb-6">
          <AlertTriangle size={16} />
          <span>{profileError}</span>
          <button className="btn-secondary text-xs py-1.5 px-3 ml-auto" onClick={loadProfile}>Retry</button>
        </div>
      )}
      {/* Loading */}
      {profileLoading && (
        <div className="card p-8 text-center mb-6">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent mx-auto mb-3 animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading your profile...</p>
        </div>
      )}
      {/* NO PROFILE â€” Create Profile Card */}
      {!profileLoading && !profileError && !profile && (
        <div className="card p-6 mb-6 border-2" style={{ borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary)', color: 'white' }}>
              <User size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Complete Your Patient Profile</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                Create your profile to book appointments, view bills, and access full features.
              </p>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>FIRST NAME *</label>
                  <input className="input-field" placeholder="First name"
                    value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>LAST NAME *</label>
                  <input className="input-field" placeholder="Last name"
                    value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>PHONE</label>
                  <input className="input-field" placeholder="+91 9999999999"
                    value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <button className="btn-primary" onClick={createProfile} disabled={creatingProfile}>
                {creatingProfile ? 'Creating...' : 'Create My Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PROFILE EXISTS â€” Show full dashboard */}
      {!profileLoading && profile && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4 mb-8 stagger-children">
            <StatCard label="Upcoming Appointments" value={upcomingAppts.length} icon={<Calendar size={22} />} accent="teal" />
            <StatCard label="Total Visits" value={appointments.filter(a => a.status === 'COMPLETED').length} icon={<CheckCircle2 size={22} />} accent="green" />
            <StatCard label="Pending Bills (â‚¹)" value={totalDue} icon={<IndianRupee size={22} />} accent="amber" />
            <StatCard label="My Doctors" value={new Set(appointments.map(a => a.doctorId)).size} icon={<Stethoscope size={22} />} accent="indigo" />
          </div>
          {/* Tabs */}
          <div className="tabs mb-6">
            {([
              ['overview', 'My Appointments', <Calendar size={14} />],
              ['book', 'Book Appointment', <Plus size={14} />],
              ['bills', 'Bills & Payments', <IndianRupee size={14} />],
              ['symptoms', 'Symptom Check', <Brain size={14} />],
            ] as const).map(([key, label, icon]) => (
              <button key={key} className={`tab-btn flex items-center gap-2 ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key as any)}>
                {icon} {label}
              </button>
            ))}
          </div>
          {/* â”€â”€ OVERVIEW TAB â”€â”€ */}
          {tab === 'overview' && (
            <div className="animate-fade-in space-y-3">
              {appointments.length === 0 && (
                <div className="card p-8 text-center">
                  <Calendar size={40} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
                  <p className="font-medium mb-2">No appointments yet</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>Book your first appointment with a doctor</p>
                  <button className="btn-primary" onClick={() => setTab('book')}><Plus size={15} /> Book Now</button>
                </div>
              )}
              {appointments.map(a => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-primary-light)' }}>
                        <Stethoscope size={18} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {doctors.find(d => d.id === a.doctorId)
                            ? `Dr. ${doctors.find(d => d.id === a.doctorId)?.firstName} ${doctors.find(d => d.id === a.doctorId)?.lastName}`
                            : `Dr. #${a.doctorId}`}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          <Clock size={11} className="inline mr-1" />
                          {new Date(a.slotStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        {a.reason && <p className="text-xs mt-0.5 italic">{a.reason}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={a.status} />
                      {a.telemedicineLink && (
                        <a href={`/telemedicine/${a.telemedicineLink}`} className="btn-primary text-xs py-1.5 px-3">
                          <Video size={12} /> Join
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* â”€â”€ BOOK APPOINTMENT TAB â”€â”€ */}
          {tab === 'book' && (
            <div className="card p-6 max-w-2xl animate-fade-in">
              <h2 className="section-title flex items-center gap-2"><Plus size={16} /> Book an Appointment</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-muted)' }}>SELECT DOCTOR</label>
                  <select className="input-field" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                    <option value="">Choose a doctor...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.firstName} {d.lastName} â€” {d.department ?? 'General'} {d.specialization ? `(${d.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-muted)' }}>SELECT DATE</label>
                  <input type="date" className="input-field max-w-xs"
                    min={new Date().toISOString().slice(0, 10)}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                {slots.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-muted)' }}>AVAILABLE SLOTS</label>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <button key={s.slotStart} type="button" className="btn-secondary text-xs py-2 px-3"
                          onClick={() => bookSlot(s)} disabled={booking}>
                          <Clock size={12} />
                          {new Date(s.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDoctor && slots.length === 0 && (
                  <div className="alert alert-warning">
                    <AlertTriangle size={15} /> No available slots for this date. Try another date.
                  </div>
                )}
                {!selectedDoctor && (
                  <div className="alert alert-info">
                    <Stethoscope size={15} /> Select a doctor and date to see available slots.
                  </div>
                )}
              </div>
            </div>
          )}
          {/* â”€â”€ BILLS TAB â”€â”€ */}
          {tab === 'bills' && (
            <div className="animate-fade-in">
              {totalDue > 0 && (
                <div className="alert alert-warning mb-5">
                  <IndianRupee size={16} /> You have <strong>â‚¹{totalDue}</strong> in unpaid bills.
                </div>
              )}
              <div className="card p-5">
                <h2 className="section-title flex items-center gap-2"><FileText size={16} /> Bills &amp; Invoices</h2>
                {invoices.length === 0 ? (
                  <div className="py-8 text-center" style={{ color: 'var(--color-muted)' }}>
                    <IndianRupee size={32} className="mx-auto mb-2 opacity-40" />
                    <p>No bills found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead><tr><th>Invoice #</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id}>
                            <td className="font-medium">INV-{inv.id}</td>
                            <td className="font-semibold">â‚¹{inv.amount}</td>
                            <td><StatusChip status={inv.status} /></td>
                            <td>
                              {inv.status === 'UNPAID' && (
                                <button className="btn-success text-xs py-1.5 px-3" onClick={() => payInvoice(inv)}>
                                  <IndianRupee size={12} /> Pay Now
                                </button>
                              )}
                              {inv.status === 'PAID' && (
                                <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>âœ“ Paid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* â”€â”€ SYMPTOM CHECK TAB â”€â”€ */}
          {tab === 'symptoms' && (
            <div className="card p-6 max-w-xl animate-fade-in">
              <h2 className="section-title flex items-center gap-2"><Brain size={16} /> AI Symptom Pre-Check</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                Describe your symptoms and get a department recommendation before booking.
              </p>
              <textarea
                className="input-field min-h-[120px] resize-none mb-4"
                placeholder="e.g. I have a severe headache, fever of 101Â°F, and body aches for the past 2 days..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              <button className="btn-primary w-full" onClick={checkSymptoms} disabled={checkingSymptoms}>
                <Brain size={15} /> {checkingSymptoms ? 'Analyzing...' : 'Check My Symptoms'}
              </button>
              {symptomResult && (
                <div className="mt-5 p-4 rounded-xl border" style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm mb-1">Recommended Department</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{symptomResult.department}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                        Confidence: {Math.round(symptomResult.confidence * 100)}%
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--color-primary)', color: 'white' }}>
                      <Stethoscope size={24} />
                    </div>
                  </div>
                  <button className="btn-primary w-full mt-4 text-sm" onClick={() => setTab('book')}>
                    <Calendar size={14} /> Book with a {symptomResult.department} specialist
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
