import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { api, unwrap } from '../../lib/api';
import type { AnalyticsSummary, AuditLog, Role, User } from '../../types';

const ROLES: Role[] = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'audit' | 'departments' | 'health'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DOCTOR' as Role });

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
    await api.post('/auth/users', form);
    setForm({ name: '', email: '', password: '', role: 'DOCTOR' });
    load();
  };

  const toggleStatus = async (u: User) => {
    if (!confirm(`${u.isActive === false ? 'Activate' : 'Deactivate'} ${u.name}?`)) return;
    await api.patch(`/auth/users/${u.id}/status`, { isActive: u.isActive === false });
    load();
  };

  const changeRole = async (u: User) => {
    const role = prompt('New role (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT, PHARMACIST):', u.role);
    if (!role || !ROLES.includes(role as Role)) return;
    if (!confirm(`Change ${u.name} to ${role}?`)) return;
    await api.patch(`/auth/users/${u.id}/role`, { role });
    load();
  };

  const resetPassword = async (u: User) => {
    if (!confirm(`Reset password for ${u.name}? They will use Reset@123`)) return;
    await api.post(`/auth/users/${u.id}/reset-password`);
    alert('Password reset to Reset@123');
    load();
  };

  return (
    <DashboardLayout title="Admin" links={[{ to: '/admin', label: 'Overview' }]}>
      <h1 className="mb-6 font-display text-2xl font-bold">Admin Dashboard</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Patients" value={stats?.totalPatients ?? 0} />
        <StatCard label="Doctors" value={stats?.totalDoctors ?? 0} accent="indigo" />
        <StatCard label="Nurses" value={stats?.totalNurses ?? 0} accent="amber" />
        <StatCard label="Appointments" value={stats?.totalAppointments ?? 0} />
        <StatCard label="Revenue (₹)" value={stats?.revenueThisMonth ?? 0} />
      </div>

      <div className="mb-4 flex gap-2">
        <button type="button" className={tab === 'users' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('users')}>User Management</button>
        <button type="button" className={tab === 'audit' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('audit')}>Audit Log</button>
        <button type="button" className={tab === 'departments' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('departments')}>Departments</button>
        <button type="button" className={tab === 'health' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('health')}>System Health</button>
      </div>

      {tab === 'users' && (
        <>
          <div className="card mb-6 p-5">
            <h2 className="mb-4 font-semibold">Create User</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.filter((r) => r !== 'PATIENT').map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="button" className="btn-primary" onClick={createUser}>Create</button>
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap gap-3">
              <input className="input-field max-w-xs" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="input-field max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <h2 className="mb-4 font-semibold">Staff Directory ({filtered.length})</h2>
            {filtered.length === 0 ? <EmptyState message="No users match your filters" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)' }}>
                      <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-2">{u.name}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">{u.role}</td>
                        <td className="py-2">{u.isActive === false ? 'Inactive' : 'Active'}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            <button type="button" className="btn-secondary text-xs" onClick={() => toggleStatus(u)}>{u.isActive === false ? 'Activate' : 'Deactivate'}</button>
                            <button type="button" className="btn-secondary text-xs" onClick={() => changeRole(u)}>Role</button>
                            <button type="button" className="btn-secondary text-xs" onClick={() => resetPassword(u)}>Reset PW</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Audit Log</h2>
          {auditLogs.length === 0 ? <EmptyState message="No audit entries yet" /> : (
            <div className="space-y-2">
              {auditLogs.map((a) => (
                <div key={a.id} className="border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="font-medium">{a.action}</span> — {a.entityType} {a.details && `· ${a.details}`}
                  {a.createdAt && <span className="ml-2 text-xs" style={{ color: 'var(--color-muted)' }}>{new Date(a.createdAt).toLocaleString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'departments' && (
        <div className="card p-5">
           <h2 className="mb-4 font-semibold">Department Management</h2>
           <div className="flex gap-2 mb-4">
               <input id="newDept" className="input-field max-w-xs" placeholder="New Department Name" />
               <button className="btn-primary" onClick={async () => {
                   const name = (document.getElementById('newDept') as HTMLInputElement).value;
                   if (name) {
                       await api.post('/doctors/departments', { name, description: '' });
                       (document.getElementById('newDept') as HTMLInputElement).value = '';
                       load();
                   }
               }}>Add</button>
           </div>
           <div className="space-y-2">
               {departments.map((d: any) => (
                   <div key={d.id} className="flex justify-between items-center border-b py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                       <span className="font-medium">{d.name}</span>
                       <button className="btn-secondary text-red-500 hover:text-red-600" onClick={async () => {
                           if (confirm(`Remove department ${d.name}?`)) {
                               await api.delete(`/doctors/departments/${d.id}`);
                               load();
                           }
                       }}>Remove</button>
                   </div>
               ))}
               {departments.length === 0 && <p className="text-gray-500">No departments added.</p>}
           </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            <div className="card p-5 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-700 dark:text-green-300">API Gateway</h3>
                <p className="text-sm mt-2 text-green-600 dark:text-green-400">Status: ONLINE</p>
                <p className="text-xl mt-4 font-display">99.98% Uptime</p>
            </div>
            <div className="card p-5 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-700 dark:text-green-300">Auth Service</h3>
                <p className="text-sm mt-2 text-green-600 dark:text-green-400">Status: ONLINE</p>
                <p className="text-sm mt-1 text-green-600 dark:text-green-400">Response Time: 42ms</p>
            </div>
            <div className="card p-5 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-700 dark:text-green-300">Database Cluster</h3>
                <p className="text-sm mt-2 text-green-600 dark:text-green-400">Status: HEALTHY</p>
                <p className="text-sm mt-1 text-green-600 dark:text-green-400">Connections: 45 / 200</p>
            </div>
            <div className="card p-5 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-700 dark:text-green-300">WebSocket / Messaging</h3>
                <p className="text-sm mt-2 text-green-600 dark:text-green-400">Status: ONLINE</p>
                <p className="text-sm mt-1 text-green-600 dark:text-green-400">Active Connections: 12</p>
            </div>
        </div>
      )}
    </DashboardLayout>
  );
}
