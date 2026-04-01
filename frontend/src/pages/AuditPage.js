import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  student:            { color:'#3b82f6', label:'Student',            icon:'🎓' },
  teaching_assistant: { color:'#06b6d4', label:'Teaching Assistant', icon:'📝' },
  faculty:            { color:'#8b5cf6', label:'Faculty',            icon:'👨‍🏫' },
  registrar:          { color:'#10b981', label:'Registrar',          icon:'📋' },
  admissions:         { color:'#f59e0b', label:'Admissions',         icon:'📨' },
  finance:            { color:'#f97316', label:'Finance',            icon:'💰' },
  department_head:    { color:'#ec4899', label:'Dept. Head',         icon:'🏛️' },
  helpdesk:           { color:'#6b7280', label:'Help Desk',          icon:'🛠️' },
  security_officer:   { color:'#ef4444', label:'Security',           icon:'🔐' },
  system_admin:       { color:'#dc2626', label:'Sys Admin',          icon:'⚙️' },
};

const ALL_ROLES = Object.keys(ROLE_META);

export default function UsersPage() {
  const { user, hasPermission, api } = useAuth();
  const canManage = hasPermission('users:manage');
  const canRoles  = hasPermission('roles:manage');

  const [users, setUsers]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRF]   = useState('');
  const [showModal, setModal] = useState(null); // user being role-edited
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving]   = useState(false);
  const [note, setNote]       = useState('');
  const [error, setError]     = useState('');

  const notify = m => { setNote(m); setTimeout(()=>setNote(''),3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const [ur, sr] = await Promise.all([
        api.get('/users', { params }),
        api.get('/users/stats')
      ]);
      setUsers(ur.data.users);
      setStats(sr.data.stats);
    } catch(e) { setError('Failed to load users'); }
    finally { setLoading(false); }
  }, [api, search, roleFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRoleChange = async () => {
    if (!newRole || newRole === showModal.role) return;
    setSaving(true);
    try {
      await api.put(`/users/${showModal._id}/role`, { role: newRole });
      notify(`✅ Role updated to ${newRole}`);
      setModal(null);
      fetchAll();
    } catch(e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (u) => {
    try {
      await api.put(`/users/${u._id}/toggle`);
      notify(`${u.isActive ? '🔴 Deactivated' : '✅ Activated'}: ${u.name}`);
      fetchAll();
    } catch(e) { setError(e.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name}?`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      notify('🗑️ User deleted');
      fetchAll();
    } catch(e) { setError(e.response?.data?.message || 'Failed'); }
  };

  const handlePasswordReset = async (u) => {
    const pwd = window.prompt(`Set new password for ${u.name}:`);
    if (!pwd || pwd.length < 6) return;
    try {
      await api.put('/users/password', { userId: u._id, newPassword: pwd });
      notify(`🔑 Password reset for ${u.name}`);
    } catch(e) { setError('Reset failed'); }
  };

  return (
    <div>
      {note  && <div className="alert alert-success" style={{ position:'fixed',top:80,right:24,zIndex:300,minWidth:280,boxShadow:'var(--shadow-lg)' }}>{note}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ {error} <button onClick={()=>setError('')} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'inherit' }}>✕</button></div>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>User Management</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>
            {canRoles ? '🔐 You can view users and manage roles.' : canManage ? '👥 Full user management access.' : '👁️ View-only access.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom:20 }}>
          {[
            { label:'Total Users', value:stats.total,  icon:'👥', cls:'blue' },
            { label:'Active',      value:stats.active, icon:'✅', cls:'green' },
            { label:'Roles Active',value:stats.byRole?.length||0, icon:'🔐', cls:'purple' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
          {stats.byRole?.map(r => {
            const m = ROLE_META[r._id];
            if (!m) return null;
            return (
              <div className="stat-card" key={r._id} style={{ borderColor:`${m.color}30` }}>
                <div className="stat-icon" style={{ background:`${m.color}15` }}>{m.icon}</div>
                <div><div className="stat-value" style={{ color:m.color }}>{r.count}</div><div className="stat-label">{m.label}</div></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <span>🔍</span>
          <input placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
          {search && <button onClick={()=>setSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}>✕</button>}
        </div>
        <select className="form-input" style={{ width:'auto' }} value={roleFilter} onChange={e=>setRF(e.target.value)}>
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].icon} {ROLE_META[r].label}</option>)}
        </select>
        {(search||roleFilter) && <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>{setSearch('');setRF('');}}>Clear</button>}
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{users.length} users</span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="page-spinner"><div className="spinner"/></div></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div><p>No users found.</p></div></td></tr>
            ) : users.map(u => {
              const m = ROLE_META[u.role] || { color:'#6b7280', label:u.role, icon:'👤' };
              const isSelf = u._id === user?._id;
              return (
                <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                  <td>
                    <div className="user-row-info">
                      <div className="avatar-sm" style={{ background:`${m.color}30`, color:m.color, fontSize:14 }}>
                        {u.avatar ? <img src={u.avatar} alt={u.name}/> : u.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:500, fontSize:14 }}>{u.name} {isSelf && <span style={{ fontSize:10, color:'var(--accent)' }}>(you)</span>}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, padding:'4px 10px', borderRadius:20, background:`${m.color}15`, color:m.color, fontWeight:600, border:`1px solid ${m.color}30` }}>
                      {m.icon} {m.label}
                    </span>
                  </td>
                  <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{u.department || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive?'badge-active':'badge-inactive'}`}>
                      {u.isActive ? '✅ Active' : '🔴 Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {canRoles && !isSelf && (
                        <button className="btn btn-ghost btn-icon" title="Change Role"
                          onClick={() => { setModal(u); setNewRole(u.role); }}>🔐</button>
                      )}
                      {canManage && !isSelf && (
                        <button className="btn btn-ghost btn-icon" title={u.isActive?'Deactivate':'Activate'}
                          onClick={() => handleToggle(u)}>
                          {u.isActive?'🔴':'✅'}
                        </button>
                      )}
                      {hasPermission('password:reset') && !isSelf && (
                        <button className="btn btn-ghost btn-icon" title="Reset Password"
                          onClick={() => handlePasswordReset(u)}>🔑</button>
                      )}
                      {canManage && !isSelf && (
                        <button className="btn btn-ghost btn-icon" title="Delete"
                          onClick={() => handleDelete(u)} style={{ color:'var(--danger)' }}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Change Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal" style={{ maxWidth:420 }}>
            <div className="modal-header">
              <h2 className="modal-title">🔐 Change Role</h2>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:16, fontSize:13 }}>
              Changing role for <strong>{showModal.name}</strong>. Permissions update automatically.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:360, overflowY:'auto' }}>
              {ALL_ROLES.map(r => {
                const m = ROLE_META[r];
                return (
                  <button key={r} type="button" onClick={()=>setNewRole(r)} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                    borderRadius:8, border:`2px solid ${newRole===r ? m.color : 'var(--border)'}`,
                    background: newRole===r ? `${m.color}12` : 'transparent',
                    cursor:'pointer', textAlign:'left', transition:'all 0.15s', width:'100%'
                  }}>
                    <span style={{ fontSize:20 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:newRole===r?m.color:'var(--text-primary)' }}>{m.label}</div>
                    </div>
                    {newRole===r && <span style={{ marginLeft:'auto', color:m.color }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRoleChange} disabled={saving||newRole===showModal.role}
                style={{ width:'auto', padding:'10px 24px' }}>
                {saving?'⏳ Saving...':'✅ Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}