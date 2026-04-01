import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('academic_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('academic_token');
    if (token) { fetchMe(); } else { setLoading(false); }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch { localStorage.removeItem('academic_token'); }
    finally  { setLoading(false); }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('academic_token', data.token);
    setUser(data.user);
  };

  const register = async (name, email, password, role, department, studentId) => {
    const { data } = await api.post('/auth/register', { name, email, password, role, department, studentId });
    localStorage.setItem('academic_token', data.token);
    setUser(data.user);
  };

  const logout = () => { localStorage.removeItem('academic_token'); setUser(null); };

  const loginWithGoogle = () => { window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`; };

  const hasPermission = (p)  => user?.permissions?.includes(p) || false;
  const hasRole       = (r)  => {
    const levels = { student:1, teaching_assistant:2, helpdesk:2, faculty:3, admissions:3, finance:3, registrar:4, department_head:5, security_officer:6, system_admin:7 };
    return (levels[user?.role]||0) >= (levels[r]||99);
  };
  const hasAnyPermission = (...perms) => perms.some(p => hasPermission(p));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, hasPermission, hasRole, hasAnyPermission, api, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;