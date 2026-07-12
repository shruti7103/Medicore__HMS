import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { AnalyticsSummary, AuditLog, Role, User } from '../../types';
import {
  Users, Stethoscope, Heart, Calendar, IndianRupee, Plus,
  Search, Building2, Activity, Shield, Trash2, Edit3, RefreshCw,
  CheckCircle2, XCircle, BarChart3, UserCheck, UserX
} from 'lucide-react';
const ROLES: Role[] = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'badge-purple', DOCTOR: 'badge-primary', NURSE: 'badge-success',
  RECEPTIONIST: 'badge-danger', PATIENT: 'badge-info', PHARMACIST: 'badge-warning',
};
export default function AdminDashboard() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'audit' | 'departments' | 'health'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DOCTOR' as Role });
  const [newDept, setNewDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const load = useCallback(() => {
    api.get('/analytics/summary').then((r) => setStats(unwrap(r))).catch(() => {});
    api.get('/auth/users').then((r) => setUsers(unwrap(r))).catch(() => {});
    api.get('/auth/audit-logs').then((r) => setAuditLogs(unwrap(r))).catch(() => {});
    api.get('/doctors/departments').then((r) => setDepartments(unwrap(r) || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = users.filter((u) => {
    const matchSearch = `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });
  const createUser = async () => {
    if (!form.name || !form.email || !form.password) return showToast('Fill all fields');
    setLoading(true);
    try {
      await api.post('/auth/users', form);
      setForm({ name: '', email: '', password: '', role: 'DOCTOR' });
      setShowCreateModal(false);
      load();
      showToast('User created successfully');
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Failed to create user');
    } finally { setLoading(false); }
  };
  const toggleStatus = async (u: User) => {
    if (!confirm(`${u.isActive === false ? 'Activate' : 'Deactivate'} ${u.name}?`)) return;
    try {
      await api.patch(`/auth/users/${u.id}/status`, { isActive: u.isActive === false });
      load(); showToast('Status updated');
    } catch { showToast('Action failed'); }
  };
  const changeRole = async (u: User) => {
    const role = prompt('New role (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT, PHARMACIST):', u.role);
    if (!role || !ROLES.includes(role as Role)) return;
    if (!confirm(`Change ${u.name} to ${role}?`)) return;
    try {
      await api.patch(`/auth/users/${u.id}/role`, { role });
      load(); showToast(`Role changed to ${role}`);
    } catch { showToast('Role change failed'); }
  };
  const resetPassword = async (u: User) => {
    if (!confirm(`Reset password for ${u.name}? They will use Reset@123`)) return;
    try {
      await api.post(`/auth/users/${u.id}/reset-password`);
      showToast('Password reset to Reset@123');
    } catch { showToast('Reset failed'); }
  };
  const addDepartment = async () => {
    if (!newDept.trim()) return;
    try {
      await api.post('/doctors/departments', { name: newDept, description: '' });
      setNewDept(''); load(); showToast('Department added');
    } catch { showToast('Failed to add department'); }
  };
  const removeDepartment = async (d: any) => {
    if (!confirm(`Remove department ${d.name}?`)) return;
    try {
      await api.delete(`/doctors/departments/${d.id}`);
      load(); showToast('Department removed');
    } catch { showToast('Failed to remove department'); }
  };
  return (
    <DashboardLayout
      title="Admin"
      links={[
        { to: '/admin', label: 'Overview' },
      ]}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 alert alert-info px-5 py-3 animate-fade-up shadow-xl">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title gradient-text">Admin Dashboard</h1>
          <p className="page-subtitle">Manage users, departments, and system health</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Create User
        </button>
      </div>
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8 stagger-children">
        <StatCard label="Total Patients" value={stats?.totalPatients ?? 'â€”'} accent="teal"
          icon={<Users size={22} />} trend={{ value: 8, label: 'this month' }} />
        <StatCard label="Doctors" value={stats?.totalDoctors ?? 'â€”'} accent="indigo"
          icon={<Stethoscope size={22} />} />
        <StatCard label="Nurses" value={stats?.totalNurses ?? 'â€”'} accent="green"
          icon={<Heart size={22} />} />
        <StatCard label="Appointments" value={stats?.totalAppointments ?? 'â€”'} accent="amber"
          icon={<Calendar size={22} />} trend={{ value: 12, label: 'vs last week' }} />
        <StatCard label="Revenue (â‚¹)" value={stats?.revenueThisMonth ? `${(stats.revenueThisMonth / 1000).toFixed(0)}K` : 'â€”'}
          accent="green" icon={<IndianRupee size={22} />} trend={{ value: 5, label: 'vs last month' }} />
      </div>
      {/* Tabs */}
      <div className="tabs mb-6">
        {([['users', 'User Management', <Users size={15}/>], ['audit', 'Audit Log', <Shield size={15}/>], ['departments', 'Departments', <Building2 size={15}/>], ['health', 'System Health', <Activity size={15}/>]] as const).map(([key, label, icon]) => (
          <button key={key} className={`tab-btn flex items-center gap-2 ${tab === key ? 'active' : ''}`} onClick={() => setTab(key as any)}>
            {icon} {label}
          </button>
        ))}
      </div>
      {/* --- USERS TAB --- */}
      {tab === 'users' && (
        <div className="animate-fade-in">
          <div className="card p-5">
            {/* Search + Filter */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                <input className="input-field pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="input-field max-w-[180px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn-secondary" onClick={load}><RefreshCw size={14} /></button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title mb-0">Staff Directory <span className="badge-muted badge ml-2">{filtered.length}</span></h2>
            </div>
            {filtered.length === 0 ? <EmptyState message="No users match your filters" /> : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="text-sm" style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                        <td><span className={`badge ${ROLE_COLORS[u.role] ?? 'badge-muted'}`}>{u.role}</span></td>
                        <td>
                          {u.isActive === false
                            ? <span className="badge badge-danger"><XCircle size={12}/> Inactive</span>
                            : <span className="badge badge-success"><CheckCircle2 size={12}/> Active</span>}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <button className="btn-secondary text-xs py-1 px-2" onClick={() => toggleStatus(u)}>
                              {u.isActive === false ? <UserCheck size={13}/> : <UserX size={13}/>}
                              {u.isActive === false ? 'Activate' : 'Disable'}
                            </button>
                            <button className="btn-secondary text-xs py-1 px-2" onClick={() => changeRole(u)}>
                              <Edit3 size={13}/> Role
                            </button>
                            <button className="btn-secondary text-xs py-1 px-2" onClick={() => resetPassword(u)}>
                              <RefreshCw size={13}/> Reset PW
                            </button>
                          </div>
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
      {/* --- AUDIT TAB --- */}
      {tab === 'audit' && (
        <div className="card p-5 animate-fade-in">
          <h2 className="section-title">Audit Log</h2>
          {auditLogs.length === 0 ? <EmptyState message="No audit entries yet" /> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {auditLogs.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
                    <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{a.action}</span>
                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}> â€” {a.entityType}</span>
                    {a.details && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{a.details}</p>}
                  </div>
                  {a.createdAt && <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-muted)' }}>{new Date(a.createdAt).toLocaleString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* --- DEPARTMENTS TAB --- */}
      {tab === 'departments' && (
        <div className="card p-5 animate-fade-in">
          <h2 className="section-title">Department Management</h2>
          <div className="flex gap-3 mb-5">
            <input className="input-field max-w-xs" placeholder="New Department Name" value={newDept} onChange={(e) => setNewDept(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDepartment()} />
            <button className="btn-primary" onClick={addDepartment}><Plus size={15}/> Add</button>
          </div>
          <div className="space-y-2">
            {departments.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                    <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span className="font-medium">{d.name}</span>
                </div>
                <button className="btn-danger text-xs py-1.5 px-3" onClick={() => removeDepartment(d)}>
                  <Trash2 size={13}/> Remove
                </button>
              </div>
            ))}
            {departments.length === 0 && <EmptyState message="No departments added yet" />}
          </div>
        </div>
      )}
      {/* --- HEALTH TAB --- */}
      {tab === 'health' && (
        <div className="animate-fade-in">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'API Gateway', status: 'ONLINE', uptime: '99.98%', extra: 'Avg Response: 28ms', color: '#10b981' },
              { name: 'Auth Service', status: 'ONLINE', uptime: '99.95%', extra: 'Response: 42ms', color: '#10b981' },
              { name: 'Patient Service', status: 'ONLINE', uptime: '99.90%', extra: 'Records: 1,204', color: '#10b981' },
              { name: 'Billing Service', status: 'ONLINE', uptime: '99.99%', extra: 'Invoices: 342', color: '#10b981' },
              { name: 'Database Cluster', status: 'HEALTHY', uptime: '100%', extra: 'Connections: 45/200', color: '#10b981' },
              { name: 'WebSocket / Messaging', status: 'ONLINE', uptime: '99.85%', extra: 'Active: 12 clients', color: '#10b981' },
            ].map((svc) => (
              <div key={svc.name} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${svc.color}20` }}>
                    <Activity size={18} style={{ color: svc.color }} />
                  </div>
                  <span className="badge badge-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {svc.status}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{svc.name}</h3>
                <p className="text-2xl font-bold mb-1" style={{ color: svc.color }}>{svc.uptime}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{svc.extra}</p>
                <div className="progress-bar mt-3">
                  <div className="progress-fill" style={{ width: svc.uptime, background: svc.color }} />
                </div>
              </div>
            ))}
          </div>
          {/* Analytics Summary */}
          <div className="card p-5 mt-6">
            <h2 className="section-title">Quick Analytics</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--color-bg)' }}>
                <BarChart3 size={24} className="mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                <p className="text-2xl font-bold">{stats?.todayAppointments ?? 0}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Today's Appointments</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--color-bg)' }}>
                <IndianRupee size={24} className="mx-auto mb-2" style={{ color: 'var(--color-success)' }} />
                <p className="text-2xl font-bold">â‚¹{((stats?.revenueThisMonth ?? 0) / 1000).toFixed(0)}K</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Monthly Revenue</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--color-bg)' }}>
                <Users size={24} className="mx-auto mb-2" style={{ color: 'var(--color-secondary)' }} />
                <p className="text-2xl font-bold">{(stats?.totalPatients ?? 0) + (stats?.totalDoctors ?? 0) + (stats?.totalNurses ?? 0)}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Total System Users</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Create New User</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>âœ•</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>FULL NAME</label>
                <input className="input-field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>EMAIL</label>
                <input className="input-field" type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>PASSWORD</label>
                <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-muted)' }}>ROLE</label>
                <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  {ROLES.filter((r) => r !== 'PATIENT').map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn-primary flex-1" onClick={createUser} disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
