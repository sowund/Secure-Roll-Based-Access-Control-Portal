import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = ['Mathematics','Computer Science','Physics','Chemistry','Biology','English','History','Economics','Engineering'];

const ST = {
  open:      { color:'#3b82f6', label:'🔓 Open' },
  submitted: { color:'#f59e0b', label:'📤 Submitted' },
  graded:    { color:'#10b981', label:'✅ Graded' },
  closed:    { color:'#6b7280', label:'🔒 Closed' },
};
const PR = { low:{color:'#6b7280'}, medium:{color:'#f59e0b'}, high:{color:'#ef4444'} };

export default function AssignmentsPage() {
  const { user, hasPermission, hasAnyPermission, api } = useAuth();
  const isStudent = user?.role === 'student';
  const canCreate = hasAnyPermission('assignments:manage');
  const canGrade  = hasAnyPermission('grades:input','assignments:grade');

  const [items,   setItems]   = useState([]);
  const [stats,   setStats]   = useState({ total:0, open:0, submitted:0, graded:0 });
  const [loading, setLoad]    = useState(true);
  const [search,  setSearch]  = useState('');
  const [subF,    setSubF]    = useState('');
  const [stF,     setStF]     = useState('');
  const [modal,   setModal]   = useState(false);
  const [gradeModal,setGradeM]= useState(null);
  const [subModal, setSubM]   = useState(null);
  const DEPARTMENTS = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Engineering','Business','English','History'];
  const [form, setForm]       = useState({ title:'', course:'', subject:'Computer Science', description:'', dueDate:'', priority:'medium', totalMarks:100, targetDepartments:[] });
  const [gradeForm,setGF]     = useState({ grade:'', feedback:'', isFinal:false });
  const [subText,  setSubText]= useState('');
  const [saving,   setSaving] = useState(false);
  const [note,     setNote]   = useState('');
  const [error,    setError]  = useState('');

  const notify = m => { setNote(m); setTimeout(()=>setNote(''),3000); };

  const fetchItems = useCallback(async () => {
    setLoad(true);
    try {
      const params={};
      if (search) params.search  = search;
      if (subF)   params.subject = subF;
      if (stF)    params.status  = stF;
      const r = await api.get('/assignments', { params });
      setItems(r.data.items||[]);
    } catch { setError('Failed to load'); }
    finally { setLoad(false); }
  }, [api, search, subF, stF]);

  const fetchStats = useCallback(async () => {
    try { const r = await api.get('/assignments/stats'); setStats(r.data.stats); } catch {}
  }, [api]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleCreate = async () => {
    if (!form.title || !form.course) return;
    setSaving(true);
    try {
      await api.post('/assignments', form);
      notify('✅ Assignment created!');
      setModal(false); fetchItems(); fetchStats();
    } catch(e) { setError(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put(`/assignments/${subModal._id}/submit`, { submissionText: subText });
      notify('📤 Assignment submitted!');
      setSubM(null); fetchItems(); fetchStats();
    } catch(e) { setError(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handleGrade = async () => {
    setSaving(true);
    try {
      await api.put(`/assignments/${gradeModal._id}/grade`, gradeForm);
      notify(`✅ Grade submitted${gradeForm.isFinal?' (Final)':''}`);
      setGradeM(null); fetchItems(); fetchStats();
    } catch(e) { setError(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {note  && <div className="alert alert-success" style={{ position:'fixed',top:80,right:24,zIndex:300,minWidth:280,boxShadow:'var(--shadow-lg)' }}>{note}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ {error} <button onClick={()=>setError('')} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'inherit' }}>✕</button></div>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>Assignments</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>
            {isStudent ? '📤 Submit your assignments before the due date.' :
             canCreate  ? '📚 Manage and grade student assignments.' :
                          '📝 Grade assigned work.'}
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" style={{ width:'auto', padding:'10px 20px' }} onClick={() => { setForm({ title:'', course:'', subject:'Computer Science', description:'', dueDate:'', priority:'medium', totalMarks:100, targetDepartments:[] }); setModal(true); }}>
            + New Assignment
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total',     value:stats.total,     icon:'📚', cls:'blue' },
          { label:'Open',      value:stats.open,      icon:'🔓', cls:'green' },
          { label:'Submitted', value:stats.submitted, icon:'📤', cls:'orange' },
          { label:'Graded',    value:stats.graded,    icon:'✅', cls:'purple' },
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
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width:'auto' }} value={subF} onChange={e=>setSubF(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="form-input" style={{ width:'auto' }} value={stF} onChange={e=>setStF(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(ST).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{items.length} items</span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Course</th><th>Subject</th><th>For Dept.</th><th>Priority</th><th>Status</th><th>Due</th><th>Grade</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}><div className="page-spinner"><div className="spinner"/></div></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📚</div><p>No assignments found.</p></div></td></tr>
            ) : items.map(item => {
              const st = ST[item.status] || ST.open;
              const pr = PR[item.priority] || PR.medium;
              const isOwner = String(item.submittedBy?._id || item.submittedBy) === String(user?._id);
              const canSubmit = isStudent && item.status === 'open';
              const canGradeThis = canGrade && item.status === 'submitted';
              return (
                <tr key={item._id}>
                  <td style={{ fontWeight:500 }}>{item.title}</td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.course}</td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.subject}</td>
                  <td style={{ fontSize:11 }}>
                    {item.targetDepartments && item.targetDepartments.length > 0
                      ? <span style={{ color:'#3b82f6', background:'rgba(59,130,246,0.1)', padding:'2px 7px', borderRadius:10, border:'1px solid rgba(59,130,246,0.2)' }}>
                          {item.targetDepartments.join(', ')}
                        </span>
                      : <span style={{ color:'var(--text-muted)' }}>All</span>
                    }
                  </td>
                  <td>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, color:pr.color, background:`${pr.color}18`, fontWeight:600, textTransform:'capitalize' }}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, color:st.color, background:`${st.color}18`, fontWeight:600 }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {item.grade ? (
                      <div>
                        <div style={{ fontWeight:700, color:'var(--success)' }}>{item.grade}</div>
                        {item.isFinalGrade && <div style={{ fontSize:10, color:'var(--danger)' }}>FINAL</div>}
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {canSubmit && (
                        <button className="btn btn-ghost btn-icon" title="Submit Assignment"
                          onClick={() => { setSubM(item); setSubText(''); }}
                          style={{ color:'var(--accent)' }}>📤</button>
                      )}
                      {canGradeThis && (
                        <button className="btn btn-ghost btn-icon" title="Grade Assignment"
                          onClick={() => { setGradeM(item); setGF({ grade:'', feedback:'', isFinal: false }); }}
                          style={{ color:'var(--purple)' }}>✏️</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal" style={{ maxWidth:500 }}>
            <div className="modal-header">
              <h2 className="modal-title">📚 New Assignment</h2>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Assignment title..." autoFocus />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input className="form-input" value={form.course} onChange={e=>setForm({...form,course:e.target.value})} placeholder="e.g. CS101" />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select className="form-input" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input className="form-input" type="number" value={form.totalMarks} onChange={e=>setForm({...form,totalMarks:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the assignment..." style={{ resize:'vertical' }} />
            </div>

            {/* Target Departments */}
            <div className="form-group">
              <label className="form-label">
                Target Departments
                <span style={{ fontWeight:400, color:'var(--text-muted)', marginLeft:6, fontSize:11 }}>
                  (leave all unchecked = visible to every department)
                </span>
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-secondary)' }}>
                {DEPARTMENTS.map(dept => {
                  const checked = form.targetDepartments.includes(dept);
                  return (
                    <label key={dept} style={{
                      display:'flex', alignItems:'center', gap:6, cursor:'pointer',
                      padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:500,
                      border:`1px solid ${checked ? '#3b82f6' : 'var(--border)'}`,
                      background: checked ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: checked ? '#3b82f6' : 'var(--text-secondary)',
                      transition:'all 0.15s'
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? form.targetDepartments.filter(d => d !== dept)
                            : [...form.targetDepartments, dept];
                          setForm({ ...form, targetDepartments: next });
                        }}
                        style={{ display:'none' }}
                      />
                      {checked ? '✓ ' : ''}{dept}
                    </label>
                  );
                })}
              </div>
              {form.targetDepartments.length > 0 ? (
                <div style={{ fontSize:11, color:'#3b82f6', marginTop:6 }}>
                  📌 Visible only to: {form.targetDepartments.join(', ')}
                </div>
              ) : (
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
                  🌐 Visible to all departments
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving||!form.title||!form.course} style={{ width:'auto', padding:'10px 24px' }}>
                {saving?'⏳ Saving...':'➕ Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {subModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setSubM(null)}>
          <div className="modal" style={{ maxWidth:440 }}>
            <div className="modal-header">
              <h2 className="modal-title">📤 Submit Assignment</h2>
              <button className="modal-close" onClick={()=>setSubM(null)}>✕</button>
            </div>
            <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:16 }}>
              <div style={{ fontWeight:600 }}>{subModal.title}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{subModal.course} · {subModal.subject}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Submission Notes</label>
              <textarea className="form-input" rows={4} value={subText} onChange={e=>setSubText(e.target.value)} placeholder="Add your submission notes or answer here..." style={{ resize:'vertical' }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setSubM(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ width:'auto', padding:'10px 24px' }}>
                {saving?'⏳ Submitting...':'📤 Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setGradeM(null)}>
          <div className="modal" style={{ maxWidth:440 }}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Grade Assignment</h2>
              <button className="modal-close" onClick={()=>setGradeM(null)}>✕</button>
            </div>
            <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:16 }}>
              <div style={{ fontWeight:600 }}>{gradeModal.title}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Submitted by: {gradeModal.submittedByName}</div>
              {gradeModal.submissionText && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, fontStyle:'italic' }}>"{gradeModal.submissionText}"</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input className="form-input" value={gradeForm.grade} onChange={e=>setGF({...gradeForm,grade:e.target.value})} placeholder="e.g. A+, 88/100, Pass" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Feedback</label>
              <textarea className="form-input" rows={3} value={gradeForm.feedback} onChange={e=>setGF({...gradeForm,feedback:e.target.value})} placeholder="Feedback for the student..." style={{ resize:'vertical' }} />
            </div>
            {user?.role === 'faculty' && (
              <div className="form-group">
                <div style={{
                  padding: '12px 14px', borderRadius: 8,
                  border: `2px solid ${gradeForm.isFinal ? 'var(--danger)' : 'var(--border)'}`,
                  background: gradeForm.isFinal ? 'rgba(239,68,68,0.06)' : 'var(--bg-secondary)',
                  transition: 'all 0.2s', cursor: 'pointer'
                }}
                  onClick={() => setGF({ ...gradeForm, isFinal: !gradeForm.isFinal })}>
                  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                    <input
                      type="checkbox"
                      checked={gradeForm.isFinal === true}
                      onChange={e => setGF({ ...gradeForm, isFinal: e.target.checked })}
                      onClick={e => e.stopPropagation()}
                      style={{ width:16, height:16, cursor:'pointer' }}
                    />
                    <div>
                      <div style={{ color:'var(--danger)', fontWeight:700, fontSize:13 }}>
                        🔒 Mark as Final Grade
                      </div>
                      <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>
                        Once marked final, the student will see a FINAL badge. Faculty only.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
            {user?.role === 'teaching_assistant' && (
              <div className="alert alert-info" style={{ fontSize:12 }}>ℹ️ As a TA, you can grade assignments but cannot submit final grades. Only Faculty can finalize grades.</div>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setGradeM(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGrade} disabled={saving||!gradeForm.grade} style={{ width:'auto', padding:'10px 24px' }}>
                {saving?'⏳ Saving...':'✅ Submit Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}