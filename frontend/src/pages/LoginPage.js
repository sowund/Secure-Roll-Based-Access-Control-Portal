import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function ThemeBtn() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} style={{
      position:'fixed',top:20,right:20,zIndex:200,
      display:'flex',alignItems:'center',gap:8,padding:'8px 14px',
      borderRadius:20,background:'var(--bg-card)',border:'1px solid var(--border)',
      color:'var(--text-secondary)',cursor:'pointer',fontSize:13,
      fontFamily:'DM Sans,sans-serif',boxShadow:'var(--shadow-md)'
    }}>
      {theme==='dark'?'☀️ Light':'🌙 Dark'}
    </button>
  );
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(searchParams.get('error')==='google' ? 'Google sign-in failed.' : '');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); }
    catch(err) { setError(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <ThemeBtn />
      <div className="auth-bg-grid"/><div className="auth-bg-glow"/><div className="auth-bg-glow-2"/>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <div className="auth-logo-text">Academic<span>Portal</span></div>
        </div>
        <h1 className="auth-heading">Sign In</h1>
        <p className="auth-subheading">Access your institutional portal</p>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <button className="btn-google" onClick={loginWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
        <div className="auth-divider">or sign in with email</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@university.edu" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading?'⏳ Signing in...':'→ Sign In'}
          </button>
        </form>
        <div className="auth-footer">Don't have an account? <Link to="/register">Register</Link></div>
      </div>
    </div>
  );
}