import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  active:     { color:'#10b981', label:'✅ Active' },
  dropped:    { color:'#ef4444', label:'🚫 Dropped' },
  completed:  { color:'#3b82f6', label:'🎓 Completed' },
  waitlisted: { color:'#f59e0b', label:'⏳ Waitlisted' },
};

export default function EnrollmentsPage() {
  const { user, hasPermission, api } = useAuth();
  const isStudent     = user?.role === 'student';
  const canManage     = hasPermission('enrollment:manage');
  const canViewRoster = hasPermission('roster:view');

  const [items,   setItems]  = useState([]);
  const [stats,   setStats]  = useState({ total:0, active:0, completed:0, dropped:0 });
  const [loading, setLoad]   = useState(true);
  const [search,  setSearch] = useState('');
  const [stF,     setStF]    = useState('');
  const [modal,   setModal]  = useState(false); // register or manage
  const [form,    setForm]   = useState({ course:'', subject:'', semester:'', credits:3 });
  const [saving,  setSaving] = useState(false);
  const [note,    setNote]   = useState('');
  const [error,   setError]  = useState('');

  const notify = m => { setNote(m); setTimeout(()=>setNote(''),3000); };

  const fetchItems = useCallback(async () => {
    setLoad(true);
    try {
      const params={};
      if (search) params.search = search;
      if (stF)    params.status = stF;
      const r = await api.get('/enrollments', { params });
      setItems(r.data.items||[]);
    } catch { setError('Failed to load'); }
    finally { setLoad(false); }
  }, [api, search, stF]);

  const fetchStats = useCallback(async () => {
    try { const r = await api.get('/enrollments/stats'); setStats(r.data.stats); } catch {}
  }, [api]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleRegister = async () => {
    if (!form.course || !form.semester) return;
    setSaving(true);
    try {
      await api.post('/enrollments/register', form);
      notify('✅ Enrolled successfully!');
      setModal(false); fetchItems(); fetchStats();
    } catch(e) { setError(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (item, newStatus) => {
    try {
      await api.put(`/enrollments/${item._id}`, { status: newStatus });
      notify(`✅ Status updated to ${newStatus}`);
      fetchItems(); fetchStats();
    } catch { setError('Update failed'); }
  };

  return (
    <div>
      {note  && <div className="alert alert-success" style={{ position:'fixed',top:80,right:24,zIndex:300,minWidth:280,boxShadow:'var(--shadow-lg)' }}>{note}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ {error} <button onClick={()=>setError('')} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'inherit' }}>✕</button></div>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>Enrollments</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>
            {isStudent ? '📋 Register for courses and track your enrollment status.' :
             canManage  ? '🗂️ Manage student enrollments and update records.' :
                          '👥 View student rosters and enrollment data.'}
          </p>
        </div>
        {isStudent && (
          <button className="btn btn-primary" style={{ width:'auto', padding:'10px 20px' }} onClick={() => { setForm({ course:'', subject:'', semester:'', credits:3 }); setModal(true); }}>
            + Register Course
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total',     value:stats.total,     icon:'📋', cls:'blue' },
          { label:'Active',    value:stats.active,    icon:'✅', cls:'green' },
          { label:'Completed', value:stats.completed, icon:'🎓', cls:'purple' },
          { label:'Dropped',   value:stats.dropped,   icon:'🚫', cls:'orange' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <span>🔍</span>
          <input placeholder="Search courses..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width:'auto' }} value={stF} onChange={e=>setStF(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(STATUS_STYLE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{items.length} enrollments</span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              {!isStudent && <th>Student</th>}
              <th>Semester</th><th>Credits</th><th>Status</th><th>Grade</th><th>Enrolled</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="page-spinner"><div className="spinner"/></div></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state"><div className="empty-icon">📋</div>
                  <p>{isStudent ? 'Not enrolled in any courses yet.' : 'No enrollment records found.'}</p>
                </div>
              </td></tr>
            ) : items.map(item => {
              const st = STATUS_STYLE[item.status] || STATUS_STYLE.active;
              return (
                <tr key={item._id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{item.course}</div>
                    {item.subject && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.subject}</div>}
                  </td>
                  {!isStudent && (
                    <td style={{ fontSize:13 }}>
                      {item.student?.name || item.studentName || '—'}
                      {item.studentId && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.studentId}</div>}
                    </td>
                  )}
                  <td style={{ fontSize:13 }}>{item.semester}</td>
                  <td style={{ fontSize:13 }}>{item.credits}</td>
                  <td>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, color:st.color, background:`${st.color}18`, fontWeight:600 }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ fontWeight:700, color:'#10b981' }}>{item.grade || '—'}</td>
                  <td style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                  {canManage && (
                    <td>
                      <select className="form-input" style={{ width:130, padding:'4px 8px', fontSize:12 }}
                        value={item.status} onChange={e=>handleUpdate(item,e.target.value)}>
                        <option value="active">Active</option>
                        <option value="dropped">Dropped</option>
                        <option value="completed">Completed</option>
                        <option value="waitlisted">Waitlisted</option>
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal" style={{ maxWidth:420 }}>
            <div className="modal-header">
              <h2 className="modal-title">📋 Register for Course</h2>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input className="form-input" value={form.course} onChange={e=>setForm({...form,course:e.target.value})} placeholder="e.g. CS101, MATH201" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <input className="form-input" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} placeholder="e.g. Spring 2025" />
            </div>
            <div className="form-group">
              <label className="form-label">Credits</label>
              <input className="form-input" type="number" min={1} max={6} value={form.credits} onChange={e=>setForm({...form,credits:parseInt(e.target.value)})} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRegister} disabled={saving||!form.course||!form.semester} style={{ width:'auto', padding:'10px 24px' }}>
                {saving?'⏳ Registering...':'📋 Register'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}