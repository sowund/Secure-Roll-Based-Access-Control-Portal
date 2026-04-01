import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  student:            { color:'#3b82f6', label:'Student',            icon:'🎓', welcome:'Welcome back, Scholar!' },
  teaching_assistant: { color:'#06b6d4', label:'Teaching Assistant', icon:'📝', welcome:'Ready to guide students today?' },
  faculty:            { color:'#8b5cf6', label:'Faculty',            icon:'👨‍🏫', welcome:'Welcome, Professor!' },
  registrar:          { color:'#10b981', label:'Registrar',          icon:'📋', welcome:'Manage enrollments & records.' },
  admissions:         { color:'#f59e0b', label:'Admissions',         icon:'📨', welcome:'Manage incoming applicants.' },
  finance:            { color:'#f97316', label:'Finance',            icon:'💰', welcome:'Bursar Office Dashboard.' },
  department_head:    { color:'#ec4899', label:'Department Head',    icon:'🏛️', welcome:'Oversee your department.' },
  helpdesk:           { color:'#6b7280', label:'Help Desk',          icon:'🛠️', welcome:'Here to help resolve issues.' },
  security_officer:   { color:'#ef4444', label:'Security Officer',   icon:'🔐', welcome:'Monitor access & security.' },
  system_admin:       { color:'#dc2626', label:'System Admin',       icon:'⚙️', welcome:'Full system control.' },
};

const ACCESS_CARDS = [
  { icon:'📚', label:'Assignments',      path:'/assignments', desc:'Submit or manage assignments',           perms:['assignments:submit','assignments:manage','assignments:grade'] },
  { icon:'📂', label:'Course Materials', path:'/materials',   desc:'Access and upload course content',       perms:['materials:download'] },
  { icon:'📋', label:'Enrollments',      path:'/enrollments', desc:'Register or manage course enrollments',  perms:['courses:register','enrollment:manage','roster:view'] },
  { icon:'🎯', label:'Grades',           path:'/grades',      desc:'View or input academic grades',          perms:['grades:view_own','grades:input','reports:department'] },
  { icon:'👥', label:'User Management',  path:'/users',       desc:'Manage portal accounts & roles',         perms:['users:view'] },
  { icon:'🔍', label:'Audit Logs',       path:'/audit',       desc:'Security & access audit trail',          perms:['audit:view'] },
  { icon:'⚙️', label:'System Health',   path:'/system',      desc:'Monitor system infrastructure',          perms:['system:health'] },
];

export default function DashboardPage() {
  const { user, hasAnyPermission, api } = useAuth();
  const isStudent = user?.role === 'student';

  const [adminStats,   setAdminStats]   = useState(null);
  const [studentStats, setStudentStats] = useState(null);

  const meta = ROLE_META[user?.role] || { color:'#6b7280', label:user?.role, icon:'👤', welcome:'Welcome!' };
  const accessibleCards = ACCESS_CARDS.filter(c => hasAnyPermission(...c.perms));

  useEffect(() => {
    // Admin/security: show user counts
    if (hasAnyPermission('users:view')) {
      api.get('/users/stats').then(r => setAdminStats(r.data.stats)).catch(() => {});
    }

    // Students: fetch their personal assignment stats
    if (isStudent) {
      api.get('/assignments/stats').then(r => setStudentStats(r.data.stats)).catch(() => {});
    }
  }, []);

  return (
    <div>
      {/* ── Welcome Banner ── */}
      <div style={{
        padding: '28px 32px', borderRadius: 16, marginBottom: 24,
        background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}08)`,
        border: `1px solid ${meta.color}30`, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', right:32, top:'50%', transform:'translateY(-50%)', fontSize:72, opacity:0.12 }}>
          {meta.icon}
        </div>
        <div style={{ fontSize:11, color:meta.color, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
          {meta.label}
        </div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, marginBottom:4 }}>
          {meta.welcome}
        </h2>
        <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom: isStudent ? 12 : 0 }}>
          {user?.name}
          {user?.department ? ` · ${user.department}` : ' · No department set'}
          {user?.studentId  ? ` · ID: ${user.studentId}` : ''}
        </p>

        {/* Student: department assignment notice */}
        {isStudent && user?.department && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, padding: '4px 12px', borderRadius: 20,
            background: `${meta.color}25`, color: meta.color,
            border: `1px solid ${meta.color}40`, fontWeight: 600, marginBottom: 8
          }}>
            📚 Showing assignments for: {user.department}
          </div>
        )}
        {isStudent && !user?.department && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, padding: '4px 12px', borderRadius: 20,
            background: 'rgba(245,158,11,0.15)', color: '#d97706',
            border: '1px solid rgba(245,158,11,0.3)', fontWeight: 500, marginBottom: 8
          }}>
            ⚠️ No department set — you may see all assignments. Set it in your Profile.
          </div>
        )}

        {/* Permission tags */}
        <div style={{ marginTop: 8, display:'flex', gap:8, flexWrap:'wrap' }}>
          {user?.permissions?.slice(0, 6).map(p => (
            <span key={p} style={{
              fontSize:11, padding:'3px 10px', borderRadius:20,
              background:`${meta.color}20`, color:meta.color,
              border:`1px solid ${meta.color}30`, fontWeight:500
            }}>{p}</span>
          ))}
          {(user?.permissions?.length || 0) > 6 && (
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'var(--bg-elevated)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
              +{user.permissions.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* ── Student Personal Stats ── */}
      {isStudent && studentStats && (
        <>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Your Assignment Summary  ·  {user?.department || 'All Departments'}
          </h3>
          <div className="stats-grid" style={{ marginBottom:24 }}>
            {[
              { label:'Available',      value: studentStats.open,      icon:'🔓', cls:'blue',
                desc: 'Open for submission' },
              { label:'You Submitted',  value: studentStats.submitted, icon:'📤', cls:'orange',
                desc: 'Awaiting grade' },
              { label:'Graded',         value: studentStats.graded,    icon:'✅', cls:'green',
                desc: 'Check your grades' },
              { label:'In Your Dept',   value: studentStats.total,     icon:'📚', cls:'purple',
                desc: user?.department || 'All subjects' },
            ].map(s => (
              <div className="stat-card" key={s.label} style={{ flexDirection:'column', alignItems:'flex-start', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', paddingLeft:4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Admin/Security Stats ── */}
      {adminStats && (
        <div className="stats-grid" style={{ marginBottom:24 }}>
          {[
            { label:'Total Users',  value: adminStats.total,          icon:'👥', cls:'blue' },
            { label:'Active Users', value: adminStats.active,         icon:'✅', cls:'green' },
            { label:'Roles in Use', value: adminStats.byRole?.length || 0, icon:'🔐', cls:'purple' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Access Cards ── */}
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, marginBottom:14, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
        Your Access Modules
      </h3>
      {accessibleCards.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
          <p style={{ color:'var(--text-secondary)' }}>No modules assigned yet. Contact your System Administrator.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 }}>
          {accessibleCards.map(c => {
            // For student assignment card: add a live count badge
            const isAssignCard = c.path === '/assignments' && isStudent && studentStats;
            return (
              <Link to={c.path} key={c.path} style={{ textDecoration:'none' }}>
                <div className="card" style={{ cursor:'pointer', transition:'all 0.2s', height:'100%', position:'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}>
                  {isAssignCard && studentStats.open > 0 && (
                    <div style={{
                      position:'absolute', top:12, right:12,
                      background:'#ef4444', color:'#fff',
                      borderRadius:20, fontSize:11, fontWeight:700,
                      padding:'2px 8px', lineHeight:'18px'
                    }}>{studentStats.open} open</div>
                  )}
                  <div style={{ fontSize:32, marginBottom:12 }}>{c.icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:6 }}>{c.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
                    {isAssignCard
                      ? `${studentStats.open} open · ${studentStats.submitted} submitted · ${studentStats.graded} graded`
                      : c.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── RBAC Info ── */}
      <div className="card" style={{ marginTop:24, background:'var(--bg-secondary)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <span style={{ fontSize:20 }}>🔐</span>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>About Academic RBAC</span>
        </div>
        <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>
          In this portal, <strong style={{ color:'var(--text-primary)' }}>permissions are assigned to roles, not to individuals</strong>.
          Your access is determined entirely by your role as <em style={{ color:meta.color }}>{meta.label}</em>.
          {isStudent && user?.department && (
            <> Assignments are filtered to your department <strong style={{ color:meta.color }}>{user.department}</strong> — you only see what is relevant to your studies.</>
          )}
        </p>
      </div>
    </div>
  );
}