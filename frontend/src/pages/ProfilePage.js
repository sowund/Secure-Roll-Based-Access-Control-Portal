import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  student:            { color:'#3b82f6', label:'Student',            icon:'🎓' },
  teaching_assistant: { color:'#06b6d4', label:'Teaching Assistant', icon:'📝' },
  faculty:            { color:'#8b5cf6', label:'Faculty',            icon:'👨‍🏫' },
  registrar:          { color:'#10b981', label:'Registrar',          icon:'📋' },
  admissions:         { color:'#f59e0b', label:'Admissions',         icon:'📨' },
  finance:            { color:'#f97316', label:'Finance',            icon:'💰' },
  department_head:    { color:'#ec4899', label:'Department Head',    icon:'🏛️' },
  helpdesk:           { color:'#6b7280', label:'Help Desk',          icon:'🛠️' },
  security_officer:   { color:'#ef4444', label:'Security Officer',   icon:'🔐' },
  system_admin:       { color:'#dc2626', label:'System Admin',       icon:'⚙️' },
};

const PERM_GROUPS = {
  'Academic':     ['grades:view_own','grades:input','courses:register','assignments:submit','assignments:manage','assignments:grade','materials:download','content:upload','roster:view','forums:manage'],
  'Records':      ['enrollment:manage','transcripts:manage','catalog:manage','reports:department','curriculum:approve','faculty:manage'],
  'Finance':      ['billing:manage','payments:process','financial:manage','financial:view_own','admissions:update','applicants:manage'],
  'System':       ['users:view','users:manage','roles:manage','password:reset','audit:view','access:monitor','system:configure','system:health','issues:troubleshoot'],
};

export default function ProfilePage() {
  const { user, setUser, api } = useAuth();
  const meta = ROLE_META[user?.role] || { color:'#6b7280', label:user?.role, icon:'👤' };

  const [form, setForm]     = useState({ name: user?.name||'', department: user?.department||'', studentId: user?.studentId||'' });
  const [pwForm, setPwForm] = useState({ current:'', newPwd:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwS] = useState(false);
  const [note,   setNote]   = useState('');
  const [error,  setError]  = useState('');

  const notify = m => { setNote(m); setTimeout(()=>setNote(''), 3000); };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      setUser(data.user);
      notify('✅ Profile updated!');
    } catch(e) { setError(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPwd !== pwForm.confirm) return setError('Passwords do not match');
    if (pwForm.newPwd.length < 6) return setError('Password must be at least 6 characters');
    setPwS(true);
    try {
      await api.put('/users/password', { newPassword: pwForm.newPwd });
      setPwForm({ current:'', newPwd:'', confirm:'' });
      notify('🔑 Password changed!');
    } catch(e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setPwS(false); }
  };

  return (
    <div style={{ maxWidth:700 }}>
      {note  && <div className="alert alert-success" style={{ position:'fixed',top:80,right:24,zIndex:300,minWidth:280,boxShadow:'var(--shadow-lg)' }}>{note}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ {error} <button onClick={()=>setError('')} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'inherit' }}>✕</button></div>}

      {/* Role card */}
      <div className="card" style={{ marginBottom:20, borderColor:`${meta.color}40`, background:`${meta.color}08` }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:`${meta.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover' }} /> : meta.icon}
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>{user?.name}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{user?.email}</div>
            <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:6, fontSize:12, padding:'4px 12px', borderRadius:20, background:`${meta.color}20`, color:meta.color, fontWeight:700, border:`1px solid ${meta.color}30` }}>
              {meta.icon} {meta.label}
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header">
          <h3 className="card-title">Edit Profile</h3>
        </div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <input className="form-input" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="e.g. Computer Science" />
        </div>
        {user?.role === 'student' && (
          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input className="form-input" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} placeholder="STU-2024-001" />
          </div>
        )}
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ width:'auto', padding:'10px 24px' }}>
          {saving?'⏳ Saving...':'💾 Save Changes'}
        </button>
      </div>

      {/* Change password */}
      {user?.authProvider === 'local' && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header">
            <h3 className="card-title">Change Password</h3>
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pwForm.newPwd} onChange={e=>setPwForm({...pwForm,newPwd:e.target.value})} placeholder="Min. 6 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} placeholder="Repeat new password" />
          </div>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={pwSaving||!pwForm.newPwd||!pwForm.confirm} style={{ width:'auto', padding:'10px 24px' }}>
            {pwSaving?'⏳ Updating...':'🔑 Update Password'}
          </button>
        </div>
      )}

      {/* Permissions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔐 Your Permissions</h3>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>{user?.permissions?.length||0} total</span>
        </div>
        <div className="alert alert-info" style={{ fontSize:12, marginBottom:16 }}>
          Permissions are assigned by your role. They update automatically if your role changes.
        </div>
        {Object.entries(PERM_GROUPS).map(([group, perms]) => {
          const owned = perms.filter(p => user?.permissions?.includes(p));
          if (owned.length === 0) return null;
          return (
            <div key={group} style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{group}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {owned.map(p => (
                  <span key={p} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background:`${meta.color}15`, color:meta.color, border:`1px solid ${meta.color}25`, fontWeight:500 }}>
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}