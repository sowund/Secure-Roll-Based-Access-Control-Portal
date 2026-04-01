import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const TYPES = ['syllabus','lecture','notes','textbook','video','other'];
const TYPE_ICONS = { syllabus:'📋', lecture:'📖', notes:'📝', textbook:'📗', video:'🎬', other:'📎' };

export default function MaterialsPage() {
  const { hasPermission, api } = useAuth();
  const canUpload = hasPermission('content:upload');

  const [items,   setItems]  = useState([]);
  const [stats,   setStats]  = useState({ total:0, downloads:0 });
  const [loading, setLoad]   = useState(true);
  const [search,  setSearch] = useState('');
  const [typeF,   setTypeF]  = useState('');
  const [modal,   setModal]  = useState(false);
  const [form,    setForm]   = useState({ title:'', course:'', subject:'', type:'notes', description:'', fileUrl:'' });
  const [saving,  setSaving] = useState(false);
  const [note,    setNote]   = useState('');
  const [error,   setError]  = useState('');

  const notify = m => { setNote(m); setTimeout(()=>setNote(''),3000); };

  const fetchItems = useCallback(async () => {
    setLoad(true);
    try {
      const params={};
      if (search) params.search = search;
      if (typeF)  params.type   = typeF;
      const r = await api.get('/materials', { params });
      setItems(r.data.items||[]);
    } catch { setError('Failed to load'); }
    finally { setLoad(false); }
  }, [api, search, typeF]);

  const fetchStats = useCallback(async () => {
    try { const r = await api.get('/materials/stats'); setStats(r.data.stats); } catch {}
  }, [api]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleCreate = async () => {
    if (!form.title || !form.course) return;
    setSaving(true);
    try {
      await api.post('/materials', form);
      notify('✅ Material uploaded!');
      setModal(false); fetchItems(); fetchStats();
    } catch(e) { setError(e.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handleDownload = async (item) => {
    await api.put(`/materials/${item._id}/download`).catch(()=>{});
    notify(`📥 Downloaded: ${item.title}`);
    fetchStats();
  };

  return (
    <div>
      {note  && <div className="alert alert-success" style={{ position:'fixed',top:80,right:24,zIndex:300,minWidth:280,boxShadow:'var(--shadow-lg)' }}>{note}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ {error} <button onClick={()=>setError('')} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'inherit' }}>✕</button></div>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>Course Materials</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>
            {canUpload ? '📤 Upload syllabi, lectures, and course documents.' : '📥 Download course materials from your faculty.'}
          </p>
        </div>
        {canUpload && (
          <button className="btn btn-primary" style={{ width:'auto', padding:'10px 20px' }} onClick={() => { setForm({ title:'', course:'', subject:'', type:'notes', description:'', fileUrl:'' }); setModal(true); }}>
            + Upload Material
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label:'Total Materials', value:stats.total,     icon:'📂', cls:'blue' },
          { label:'Total Downloads', value:stats.downloads, icon:'📥', cls:'green' },
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
          <input placeholder="Search materials..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width:'auto' }} value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{items.length} materials</span>
      </div>

      {loading ? <div className="page-spinner"><div className="spinner"/></div>
      : items.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📂</div>
          <p>{canUpload ? 'No materials yet. Upload the first one!' : 'No materials available yet.'}</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
          {items.map(item => (
            <div key={item._id} className="card" style={{ position:'relative' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                <div style={{ fontSize:28, flexShrink:0 }}>{TYPE_ICONS[item.type]||'📎'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.course}</div>
                </div>
              </div>
              {item.description && <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>{item.description}</p>}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)' }}>
                <span>by {item.uploadedBy?.name || item.uploadedByName}</span>
                <span>📥 {item.downloads}</span>
              </div>
              <button className="btn btn-primary" style={{ marginTop:12, padding:'8px', fontSize:13 }} onClick={() => handleDownload(item)}>
                📥 Download
              </button>
              {canUpload && (
                <button className="btn btn-ghost btn-icon" style={{ position:'absolute', top:12, right:12, color:'var(--danger)', fontSize:12 }}
                  onClick={async () => { if(window.confirm('Delete?')) { await api.delete(`/materials/${item._id}`); fetchItems(); fetchStats(); } }}>
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal" style={{ maxWidth:460 }}>
            <div className="modal-header">
              <h2 className="modal-title">📤 Upload Material</h2>
              <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Week 3 Lecture Slides" autoFocus />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input className="form-input" value={form.course} onChange={e=>setForm({...form,course:e.target.value})} placeholder="CS101" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                  {TYPES.map(t=><option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">File URL <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional)</span></label>
              <input className="form-input" value={form.fileUrl} onChange={e=>setForm({...form,fileUrl:e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief description..." style={{ resize:'vertical' }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving||!form.title||!form.course} style={{ width:'auto', padding:'10px 24px' }}>
                {saving?'⏳ Uploading...':'📤 Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}