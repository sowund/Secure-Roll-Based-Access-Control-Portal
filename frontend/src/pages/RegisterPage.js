import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SELF_REGISTER_ROLES = [
  { value:'student',            label:'Student',            icon:'🎓', color:'#3b82f6',
    desc:'Register for courses, submit assignments, view grades' },
  { value:'teaching_assistant', label:'Teaching Assistant', icon:'📝', color:'#06b6d4',
    desc:'Grade assignments, manage forums — subset of faculty access' },
  { value:'faculty',            label:'Faculty / Professor', icon:'👨‍🏫', color:'#8b5cf6',
    desc:'Upload materials, manage assignments, input final grades' },
];

const DEPARTMENTS = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Business','English','History'];

function ThemeBtn() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} style={{
      position:'fixed', top:20, right:20, zIndex:200,
      display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
      borderRadius:20, background:'var(--bg-card)', border:'1px solid var(--border)',
      color:'var(--text-secondary)', cursor:'pointer', fontSize:13,
      fontFamily:'DM Sans,sans-serif', boxShadow:'var(--shadow-md)'
    }}>
      {theme==='dark'?'☀️ Light':'🌙 Dark'}
    </button>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [step, setStep]   = useState(1);
  const [role, setRole]   = useState('');
  const [form, setForm]   = useState({ name:'', email:'', password:'', department:'', studentId:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return setError('Please select a role');
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password, role, form.department, form.studentId);
    } catch(err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <ThemeBtn />
      <div className="auth-bg-grid" /><div className="auth-bg-glow" /><div className="auth-bg-glow-2" />
      <div className="auth-card" style={{ maxWidth: step===1 ? 560 : 440 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <div className="auth-logo-text">Academic<span>Portal</span></div>
        </div>

        {/* Steps */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          {[1,2].map(s => (
            <React.Fragment key={s}>
              <div style={{
                width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0,
                background: step >= s ? 'var(--accent)' : 'var(--bg-elevated)',
                color: step >= s ? '#fff' : 'var(--text-muted)',
                border: `2px solid ${step >= s ? 'var(--accent)' : 'var(--border)'}`
              }}>{s}</div>
              {s < 2 && <div style={{ flex:1, height:2, background: step > s ? 'var(--accent)' : 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {step === 1 ? (
          <>
            <h1 className="auth-heading">Choose Your Role</h1>
            <p className="auth-subheading">Select the role that matches your position in the institution</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
              {SELF_REGISTER_ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                  borderRadius:12, border:`2px solid ${role===r.value ? r.color : 'var(--border)'}`,
                  background: role===r.value ? `${r.color}12` : 'var(--bg-secondary)',
                  cursor:'pointer', textAlign:'left', transition:'all 0.15s', width:'100%'
                }}>
                  <span style={{ fontSize:24, flexShrink:0 }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color: role===r.value ? r.color : 'var(--text-primary)', fontFamily:'var(--font-display)' }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{r.desc}</div>
                  </div>
                  {role===r.value && <span style={{ color:r.color, fontSize:18 }}>✓</span>}
                </button>
              ))}
            </div>
            <div className="alert alert-info" style={{ fontSize:12 }}>
              ℹ️ Admin, Registrar, Finance and other staff accounts are created by the System Administrator.
            </div>
            <button className="btn btn-primary" disabled={!role} onClick={() => { if(role) { setError(''); setStep(2); } }} style={{ marginTop:16 }}>
              Continue →
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-heading">Create Account</h1>
            <p className="auth-subheading">
              {SELF_REGISTER_ROLES.find(r=>r.value===role)?.icon} Registering as <strong>{SELF_REGISTER_ROLES.find(r=>r.value===role)?.label}</strong>
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Dr. Jane Smith" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="jane@university.edu" required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              {role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-input" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} placeholder="e.g. STU-2024-001" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex:1 }}>← Back</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:2 }}>
                  {loading ? '⏳ Creating...' : '🎓 Create Account'}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}