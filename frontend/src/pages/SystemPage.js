import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SystemPage() {
  const { api } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState('');

  const fetchHealth = async () => {
    setLoad(true);
    try {
      const r = await api.get('/system/health');
      setHealth(r.data);
    } catch(e) { setError(e.response?.data?.message || 'Failed to fetch system health'); }
    finally { setLoad(false); }
  };

  useEffect(() => { fetchHealth(); }, []);

  const formatBytes = (b) => {
    if (b > 1024*1024) return `${(b/1024/1024).toFixed(1)} MB`;
    return `${(b/1024).toFixed(1)} KB`;
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>System Health</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginTop:4 }}>⚙️ System Admin only — infrastructure monitoring.</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchHealth} style={{ fontSize:12 }}>↺ Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <div className="page-spinner"><div className="spinner"/></div> : health && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
          {[
            { label:'Status',       value:health.status?.toUpperCase(), icon:'💚', color:'#10b981' },
            { label:'Database',     value:health.dbState,               icon:'🗄️', color:'#3b82f6' },
            { label:'Uptime',       value:`${Math.floor(health.uptime/60)} min`, icon:'⏱️', color:'#8b5cf6' },
            { label:'Node Version', value:health.nodeVersion,           icon:'⚙️', color:'#f59e0b' },
            { label:'Heap Used',    value:formatBytes(health.memory?.heapUsed||0), icon:'🧠', color:'#06b6d4' },
            { label:'Heap Total',   value:formatBytes(health.memory?.heapTotal||0), icon:'💾', color:'#f97316' },
          ].map(s => (
            <div className="card" key={s.label}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:28 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="card" style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>Last Checked</div>
            <div style={{ fontFamily:'monospace', fontSize:13 }}>{new Date(health.timestamp).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}