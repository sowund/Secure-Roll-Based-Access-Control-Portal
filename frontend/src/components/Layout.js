import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Role metadata: color + label
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

const NAV = [
  // Always visible
  { path:'/dashboard', icon:'🏠', label:'Dashboard', section:'Overview' },
  { path:'/profile',   icon:'👤', label:'My Profile', section:'Overview' },

  // Academic section
  { path:'/assignments', icon:'📚', label:'Assignments',    section:'Academic',
    perms:['assignments:submit','assignments:manage','assignments:grade'] },
  { path:'/materials',   icon:'📂', label:'Course Materials', section:'Academic',
    perms:['materials:download'] },
  { path:'/enrollments', icon:'📋', label:'Enrollments',    section:'Academic',
    perms:['courses:register','enrollment:manage','roster:view'] },
  { path:'/grades',      icon:'🎯', label:'Grades',         section:'Academic',
    perms:['grades:view_own','grades:input','reports:department'] },

  // Administration section
  { path:'/users',  icon:'👥', label:'User Management', section:'Administration', perms:['users:view'] },
  { path:'/audit',  icon:'🔍', label:'Audit Logs',      section:'Administration', perms:['audit:view'] },
  { path:'/system', icon:'⚙️', label:'System Health',   section:'Administration', perms:['system:health'] },
];

const PAGE_TITLES = {
  '/dashboard':'/Dashboard','/profile':'My Profile','/assignments':'Assignments',
  '/materials':'Course Materials','/enrollments':'Enrollments','/grades':'Grades',
  '/users':'User Management','/audit':'Audit Logs','/system':'System Health',
};

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} style={{
      display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
      borderRadius:20, background:'var(--bg-elevated)', border:'1px solid var(--border)',
      color:'var(--text-secondary)', cursor:'pointer', fontSize:12,
      fontFamily:'var(--font-body)', transition:'all 0.2s'
    }}>
      <span>{theme==='dark'?'☀️':'🌙'}</span>
      <span>{theme==='dark'?'Light':'Dark'}</span>
    </button>
  );
}

export default function Layout() {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const getInitials  = (n) => n?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const meta = ROLE_META[user?.role] || { color:'#6b7280', label: user?.role, icon:'👤' };
  const sections = ['Overview','Academic','Administration'];
  const pageTitle = PAGE_TITLES[location.pathname] || 'Portal';

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99, backdropFilter:'blur(2px)' }}
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🎓</div>
          <div>
            <div className="sidebar-brand">Academic<span>RBAC</span></div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>Secure Portal v2.0</div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding:'12px 16px 0' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
            background:`${meta.color}15`, borderRadius:10, border:`1px solid ${meta.color}30`
          }}>
            <span style={{ fontSize:18 }}>{meta.icon}</span>
            <div>
              <div style={{ fontSize:12, color:meta.color, fontWeight:700 }}>{meta.label}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{user?.permissions?.length||0} permissions</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => {
            const items = NAV.filter(item => {
              if (item.section !== section) return false;
              if (!item.perms) return true;
              return hasAnyPermission(...item.perms);
            });
            if (items.length === 0) return null;
            return (
              <div key={section}>
                <div className="nav-section-label">{section}</div>
                {items.map(item => (
                  <NavLink key={item.path} to={item.path}
                    className={({isActive}) => `nav-item ${isActive?'active':''}`}
                    onClick={() => setSidebarOpen(false)}>
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user.name}/> : getInitials(user?.name)}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.email}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout}
            style={{ marginTop:8, color:'var(--danger)' }}>
            <span className="nav-icon">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background:'none', border:'none', color:'var(--text-primary)', fontSize:20, cursor:'pointer', padding:4, display:'flex', alignItems:'center' }}>
              ☰
            </button>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            {user?.department && (
              <span style={{ fontSize:11, color:'var(--text-muted)', padding:'3px 10px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--border)' }}>
                🏛️ {user.department}
              </span>
            )}
            {user?.studentId && (
              <span style={{ fontSize:11, color:'var(--text-muted)', padding:'3px 10px', background:'var(--bg-elevated)', borderRadius:8, border:'1px solid var(--border)' }}>
                🪪 {user.studentId}
              </span>
            )}
            <ThemeToggle />
            <span style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background:`${meta.color}20`, color:meta.color, fontWeight:600, border:`1px solid ${meta.color}30` }}>
              {meta.icon} {meta.label}
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}