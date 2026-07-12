import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatusChip from '../../components/StatusChip';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { wsService } from '../../lib/websocket';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Video, FileText, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Send, Pill, User, Search, RefreshCw,
  UserCheck, ClipboardList, Plus, X
} from 'lucide-react';
import type { Appointment } from '../../types';
interface PrescriptionForm {
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}
interface Nurse {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  shiftPattern?: string;
}
interface AssignForm {
  patientId: string;
  nurseId: string;
  notes: string;
}
interface TaskForm {
  patientId: string;
  nurseId: string;
  title: string;
  dueAt: string;
}
export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Doctor identity
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] ?? '',
    lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
    specialization: '',
    department: 'General Medicine',
    experienceYears: '5',
    consultationFee: '500',
    bio: ''
  });
  // Appointments
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'today' | 'upcoming' | 'history' | 'nurses'>('today');
  const [search, setSearch] = useState('');
  // Prescription
  const [activePrescriptionAppt, setActivePrescriptionAppt] = useState<number | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>({
    medication: '', dosage: '', frequency: 'Twice a day', durationDays: 7, instructions: '',
  });
  const [sendingRx, setSendingRx] = useState(false);
  // Nurses
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [patients, setPatients] = useState<{id: number; firstName: string; lastName: string}[]>([]);
  const [assignForm, setAssignForm] = useState<AssignForm>({ patientId: '', nurseId: '', notes: '' });
  const [taskForm, setTaskForm] = useState<TaskForm>({ patientId: '', nurseId: '', title: '', dueAt: '' });
  const [assigning, setAssigning] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [nurseTab, setNurseTab] = useState<'assign' | 'task'>('assign');
  const [assignments, setAssignments] = useState<any[]>([]);
  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  // â”€â”€ Load core data â”€â”€
  const load = useCallback(() => {
    setProfileLoading(true);
    api.get('/doctors/me')
      .then((r) => {
        const doc = r.data?.data ?? r.data;
        if (doc?.id) {
          setDoctorId(doc.id);
          setShowProfileForm(false);
          return api.get(`/appointments/doctor/${doc.id}`);
        } else {
          setShowProfileForm(true);
        }
      })
      .then((r) => {
        if (!r) return;
        const appts = r.data?.data ?? r.data ?? [];
        setAllAppointments(Array.isArray(appts) ? appts : []);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setShowProfileForm(true);
        }
      })
      .finally(() => {
        setProfileLoading(false);
      });
    // Load nurses list
    api.get('/nurse')
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setNurses(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    // Load patients for assignment dropdowns
    api.get('/patients')
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    // Load existing assignments
    api.get('/nurse/assignments/all')
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setAssignments(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  // â”€â”€ Computed appointment lists â”€â”€
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = allAppointments.filter(a => a.slotStart.startsWith(today));
  const upcomingAppts = allAppointments.filter(a =>
    a.slotStart > new Date().toISOString() && !a.slotStart.startsWith(today)
  );
  const historyAppts = allAppointments.filter(a =>
    a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );
  // Sync tab â†’ appointments list
  useEffect(() => {
    const src = tab === 'today' ? todayAppts
      : tab === 'upcoming' ? upcomingAppts
      : historyAppts;
    setAppointments(
      search
        ? src.filter(a => `Patient #${a.patientId} ${a.reason ?? ''}`.toLowerCase().includes(search.toLowerCase()))
        : src
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, allAppointments, search]);
  // â”€â”€ Actions â”€â”€
  const updateStatus = async (appt: Appointment, status: string) => {
    try {
      await api.patch(`/appointments/${appt.id}/status`, { status });
      load();
      showToast(`Appointment ${status.toLowerCase()}`);
    } catch { showToast('Failed to update status', 'error'); }
  };
  // â”€â”€ Send prescription â€” fixed doctorId bug â”€â”€
  const sendPrescription = async (patientId: number) => {
    if (!prescriptionForm.medication.trim()) return showToast('Enter medication name', 'error');
    if (!doctorId) return showToast('Doctor profile not loaded yet', 'error');
    setSendingRx(true);
    try {
      const payload = {
        patientId,
        doctorId,   // âœ… correct â€” uses the actual doctor's ID from /doctors/me
        medications: [{
          name: prescriptionForm.medication.trim(),
          dosage: prescriptionForm.dosage.trim(),
          frequency: prescriptionForm.frequency,
          durationDays: prescriptionForm.durationDays,
          instructions: prescriptionForm.instructions.trim(),
        }],
      };
      await api.post('/pharmacy/prescriptions', payload);
      // Also push via WebSocket to pharmacy queue (best-effort)
      wsService.sendMessage('/app/pharmacy.new', payload);
      showToast('âœ“ Prescription sent to pharmacy queue');
      setActivePrescriptionAppt(null);
      setPrescriptionForm({ medication: '', dosage: '', frequency: 'Twice a day', durationDays: 7, instructions: '' });
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to send prescription', 'error');
    } finally {
      setSendingRx(false);
    }
  };
  const createProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.specialization.trim()) {
      return showToast('First Name, Last Name and Specialization are required', 'error');
    }
    setCreatingProfile(true);
    try {
      await api.post('/doctors', {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        specialization: profileForm.specialization.trim(),
        department: profileForm.department,
        experienceYears: Number(profileForm.experienceYears) || 0,
        consultationFee: Number(profileForm.consultationFee) || 0.0,
        bio: profileForm.bio.trim() || null
      });
      showToast('Doctor profile created successfully!');
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to create profile', 'error');
    } finally {
      setCreatingProfile(false);
    }
  };
  // â”€â”€ Assign nurse to patient â”€â”€
  const assignNurse = async () => {
    if (!assignForm.patientId || !assignForm.nurseId) {
      return showToast('Select both patient and nurse', 'error');
    }
    if (!doctorId) return showToast('Doctor profile not loaded', 'error');
    setAssigning(true);
    try {
      await api.post('/nurse/assignments', {
        nurseId: Number(assignForm.nurseId),
        patientId: Number(assignForm.patientId),
        assignedBy: doctorId,
        notes: assignForm.notes.trim() || null,
      });
      showToast('Nurse assigned to patient');
      setAssignForm({ patientId: '', nurseId: '', notes: '' });
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Assignment failed', 'error');
    } finally { setAssigning(false); }
  };
  // â”€â”€ Create nurse task â”€â”€
  const createTask = async () => {
    if (!taskForm.patientId || !taskForm.nurseId || !taskForm.title.trim()) {
      return showToast('Fill patient, nurse and task title', 'error');
    }
    if (!doctorId) return showToast('Doctor profile not loaded', 'error');
    setAddingTask(true);
    try {
      await api.post('/nurse/tasks', {
        patientId: Number(taskForm.patientId),
        assignedNurseId: Number(taskForm.nurseId),
        createdBy: doctorId,
        title: taskForm.title.trim(),
        dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
      });
      showToast('Task assigned to nurse');
      setTaskForm({ patientId: '', nurseId: '', title: '', dueAt: '' });
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to create task', 'error');
    } finally { setAddingTask(false); }
  };
  return (
    <DashboardLayout
      title="Doctor"
      links={[
        { to: '/doctor', label: 'My Schedule' },
      ]}
      actions={<button className="btn-secondary text-xs" onClick={load}><RefreshCw size={13} /></button>}
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'} px-5 py-3 animate-fade-up shadow-xl`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
        </div>
      )}
      {profileLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-teal-600 mr-2" size={20} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading your profile...</p>
        </div>
      )}
      {!profileLoading && showProfileForm && (
        <div className="card p-6 max-w-2xl mx-auto border-2 animate-fade-in" style={{ borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary)', color: 'white' }}>
              <User size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Complete Your Doctor Profile</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                Set up your medical specialty and consultation fee to unlock your dashboard and schedule.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>FIRST NAME *</label>
                  <input className="input-field" placeholder="Dr. First name"
                    value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>LAST NAME *</label>
                  <input className="input-field" placeholder="Last name"
                    value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>SPECIALIZATION *</label>
                  <input className="input-field" placeholder="e.g. Cardiologist, General Physician"
                    value={profileForm.specialization} onChange={e => setProfileForm(f => ({ ...f, specialization: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DEPARTMENT *</label>
                  <select className="input-field" value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>EXPERIENCE (YEARS)</label>
                  <input className="input-field" type="number" placeholder="5"
                    value={profileForm.experienceYears} onChange={e => setProfileForm(f => ({ ...f, experienceYears: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>CONSULTATION FEE (â‚¹)</label>
                  <input className="input-field" type="number" placeholder="500"
                    value={profileForm.consultationFee} onChange={e => setProfileForm(f => ({ ...f, consultationFee: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>BIOGRAPHY</label>
                  <textarea className="input-field min-h-[80px] py-2" placeholder="Brief bio about your medical background..."
                    value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
              </div>
              <button className="btn-primary" onClick={createProfile} disabled={creatingProfile}>
                {creatingProfile ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
      {!profileLoading && !showProfileForm && (
        <>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="page-title gradient-text">Doctor Dashboard</h1>
              <p className="page-subtitle">Manage appointments, prescriptions &amp; patient care</p>
            </div>
          </div>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8 stagger-children">
        <StatCard label="Today's Appointments" value={todayAppts.length} icon={<Calendar size={22} />} accent="teal" />
        <StatCard label="Pending" value={todayAppts.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length} icon={<Clock size={22} />} accent="amber" />
        <StatCard label="Completed Today" value={todayAppts.filter(a => a.status === 'COMPLETED').length} icon={<CheckCircle2 size={22} />} accent="green" />
        <StatCard label="Total Patients" value={new Set(allAppointments.map(a => a.patientId)).size} icon={<User size={22} />} accent="indigo" />
      </div>
      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="tabs">
          {([
            ['today', 'Today', todayAppts.length],
            ['upcoming', 'Upcoming', upcomingAppts.length],
            ['history', 'History', historyAppts.length],
            ['nurses', 'Nurse Assignments', nurses.length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              className={`tab-btn flex items-center gap-2 ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              {key === 'nurses' ? <UserCheck size={13} /> : null}
              {label}
              {key !== 'nurses' && (
                <span className="badge badge-muted text-xs px-1.5 py-0.5">{count}</span>
              )}
            </button>
          ))}
        </div>
        {tab !== 'nurses' && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input className="input-field pl-9 w-56" placeholder="Search appointments..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
      </div>
      {/* â•â•â•â•â•â•â•â•â•â• APPOINTMENT TABS â•â•â•â•â•â•â•â•â•â• */}
      {tab !== 'nurses' && (
        <div className="space-y-3">
          {appointments.length === 0 && <EmptyState message={`No ${tab} appointments`} />}
          {appointments.map((a) => (
            <div key={a.id} className="card p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-primary-light)' }}>
                    <User size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold">Patient #{a.patientId}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(a.slotStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {a.reason && <p className="text-sm mt-1 italic">{a.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <StatusChip status={a.status} />
                  {a.telemedicineLink && (
                    <button className="btn-primary text-xs py-1.5 px-3"
                      onClick={() => navigate(`/telemedicine/${a.telemedicineLink}`)}>
                      <Video size={13} /> Join Video
                    </button>
                  )}
                  {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                    <>
                      <button className="btn-success text-xs py-1.5 px-3" onClick={() => updateStatus(a, 'COMPLETED')}>
                        <CheckCircle2 size={13} /> Complete
                      </button>
                      <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => updateStatus(a, 'CANCELLED')}>
                        <XCircle size={13} /> Cancel
                      </button>
                    </>
                  )}
                  <button
                    className="btn-secondary text-xs py-1.5 px-3"
                    onClick={() => setActivePrescriptionAppt(activePrescriptionAppt === a.id ? null : a.id)}
                  >
                    <Pill size={13} /> Rx
                    {activePrescriptionAppt === a.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>
              {/* â”€â”€ E-Prescription Composer â”€â”€ */}
              {activePrescriptionAppt === a.id && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText size={15} style={{ color: 'var(--color-primary)' }} /> E-Prescription Composer
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>
                        MEDICATION NAME *
                      </label>
                      <input className="input-field" placeholder="e.g. Amoxicillin 500mg"
                        value={prescriptionForm.medication}
                        onChange={e => setPrescriptionForm(f => ({ ...f, medication: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DOSAGE</label>
                      <input className="input-field" placeholder="e.g. 1 tablet"
                        value={prescriptionForm.dosage}
                        onChange={e => setPrescriptionForm(f => ({ ...f, dosage: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>FREQUENCY</label>
                      <select className="input-field" value={prescriptionForm.frequency}
                        onChange={e => setPrescriptionForm(f => ({ ...f, frequency: e.target.value }))}>
                        {['Once a day', 'Twice a day', 'Three times a day', 'Every 6 hours', 'Before meals', 'After meals', 'At bedtime', 'As needed'].map(f => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DURATION (DAYS)</label>
                      <input className="input-field" type="number" min="1" max="365"
                        value={prescriptionForm.durationDays}
                        onChange={e => setPrescriptionForm(f => ({ ...f, durationDays: Number(e.target.value) }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>ADDITIONAL INSTRUCTIONS</label>
                      <input className="input-field" placeholder="e.g. Take with food, avoid alcohol..."
                        value={prescriptionForm.instructions}
                        onChange={e => setPrescriptionForm(f => ({ ...f, instructions: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      className="btn-primary"
                      disabled={sendingRx || !doctorId}
                      onClick={() => sendPrescription(a.patientId)}
                    >
                      <Send size={14} /> {sendingRx ? 'Sending...' : 'Send to Pharmacy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* â•â•â•â•â•â•â•â•â•â• NURSE ASSIGNMENTS TAB â•â•â•â•â•â•â•â•â•â• */}
      {tab === 'nurses' && (
        <div className="animate-fade-in">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left â€” Forms */}
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="tabs">
                <button className={`tab-btn flex items-center gap-2 ${nurseTab === 'assign' ? 'active' : ''}`}
                  onClick={() => setNurseTab('assign')}>
                  <UserCheck size={13} /> Assign Nurse to Patient
                </button>
                <button className={`tab-btn flex items-center gap-2 ${nurseTab === 'task' ? 'active' : ''}`}
                  onClick={() => setNurseTab('task')}>
                  <ClipboardList size={13} /> Assign Task to Nurse
                </button>
              </div>
              {/* Assign Nurse Form */}
              {nurseTab === 'assign' && (
                <div className="card p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <UserCheck size={16} style={{ color: 'var(--color-primary)' }} /> Assign Nurse to Patient
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>SELECT PATIENT *</label>
                      <select className="input-field" value={assignForm.patientId}
                        onChange={e => setAssignForm(f => ({ ...f, patientId: e.target.value }))}>
                        <option value="">Select patient...</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                        {patients.length === 0 && allAppointments.map(a => (
                          <option key={a.patientId} value={a.patientId}>Patient #{a.patientId}</option>
                        )).filter((v, i, arr) => arr.findIndex(x => x.key === v.key) === i)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>SELECT NURSE *</label>
                      <select className="input-field" value={assignForm.nurseId}
                        onChange={e => setAssignForm(f => ({ ...f, nurseId: e.target.value }))}>
                        <option value="">Select nurse...</option>
                        {nurses.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.firstName} {n.lastName} â€” {n.department} {n.shiftPattern ? `(${n.shiftPattern})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>NOTES (OPTIONAL)</label>
                      <input className="input-field" placeholder="e.g. Post-op monitoring required"
                        value={assignForm.notes}
                        onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <button className="btn-primary w-full" onClick={assignNurse} disabled={assigning}>
                      <UserCheck size={15} /> {assigning ? 'Assigning...' : 'Assign Nurse'}
                    </button>
                  </div>
                  {nurses.length === 0 && (
                    <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
                      âš  No nurses found. Nurse profiles must be created by admin first.
                    </p>
                  )}
                </div>
              )}
              {/* Task Assignment Form */}
              {nurseTab === 'task' && (
                <div className="card p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <ClipboardList size={16} style={{ color: 'var(--color-secondary)' }} /> Assign Task to Nurse
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>ABOUT PATIENT *</label>
                      <select className="input-field" value={taskForm.patientId}
                        onChange={e => setTaskForm(f => ({ ...f, patientId: e.target.value }))}>
                        <option value="">Select patient...</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                        {patients.length === 0 && allAppointments.map(a => (
                          <option key={a.patientId} value={a.patientId}>Patient #{a.patientId}</option>
                        )).filter((v, i, arr) => arr.findIndex(x => x.key === v.key) === i)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>ASSIGN TO NURSE *</label>
                      <select className="input-field" value={taskForm.nurseId}
                        onChange={e => setTaskForm(f => ({ ...f, nurseId: e.target.value }))}>
                        <option value="">Select nurse...</option>
                        {nurses.map(n => (
                          <option key={n.id} value={n.id}>{n.firstName} {n.lastName} â€” {n.department}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>TASK DESCRIPTION *</label>
                      <input className="input-field" placeholder="e.g. Record vitals every 2 hours, change dressing..."
                        value={taskForm.title}
                        onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>DUE DATE &amp; TIME (OPTIONAL)</label>
                      <input className="input-field" type="datetime-local"
                        value={taskForm.dueAt}
                        onChange={e => setTaskForm(f => ({ ...f, dueAt: e.target.value }))} />
                    </div>
                    <button className="btn-primary w-full" onClick={createTask} disabled={addingTask}>
                      <Plus size={15} /> {addingTask ? 'Adding...' : 'Add Task'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Right â€” Current Assignments */}
            <div className="card p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ClipboardList size={16} style={{ color: 'var(--color-primary)' }} />
                Current Nurse Assignments
                <span className="badge badge-primary ml-1">{assignments.length}</span>
              </h3>
              {assignments.length === 0 ? (
                <div className="py-8 text-center" style={{ color: 'var(--color-muted)' }}>
                  <UserCheck size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No assignments yet</p>
                  <p className="text-xs mt-1">Use the form to assign a nurse to a patient</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {assignments.map((asgn: any) => (
                    <div key={asgn.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} style={{ color: 'var(--color-primary)' }} />
                          <span className="font-semibold text-sm">
                            {nurses.find(n => n.id === asgn.nurseId)
                              ? `${nurses.find(n => n.id === asgn.nurseId)?.firstName} ${nurses.find(n => n.id === asgn.nurseId)?.lastName}`
                              : `Nurse #${asgn.nurseId}`}
                          </span>
                        </div>
                        <StatusChip status={asgn.status ?? 'ACTIVE'} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Patient #{asgn.patientId}
                        {asgn.notes && ` Â· ${asgn.notes}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Nurse Directory */}
              {nurses.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
                    AVAILABLE NURSES ({nurses.length})
                  </h4>
                  <div className="space-y-2">
                    {nurses.map(n => (
                      <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg"
                        style={{ background: 'var(--color-surface-secondary)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}>
                          {n.firstName.charAt(0)}{n.lastName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{n.firstName} {n.lastName}</p>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {n.department} {n.shiftPattern ? `Â· ${n.shiftPattern}` : ''}
                          </p>
                        </div>
                        <button className="btn-secondary text-xs py-1 px-2"
                          onClick={() => { setAssignForm(f => ({ ...f, nurseId: String(n.id) })); setNurseTab('assign'); }}>
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </DashboardLayout>
  );
}
