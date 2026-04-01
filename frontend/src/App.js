import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import GoogleCallbackPage   from './pages/GoogleCallbackPage';
import DashboardPage        from './pages/DashboardPage';
import ProfilePage          from './pages/ProfilePage';
import AssignmentsPage      from './pages/AssignmentsPage';
import MaterialsPage        from './pages/MaterialsPage';
import EnrollmentsPage      from './pages/EnrollmentsPage';
import GradesPage           from './pages/GradesPage';
import UsersPage            from './pages/UsersPage';
import AuditPage            from './pages/AuditPage';
import SystemPage           from './pages/SystemPage';
import './styles.css';

const Spinner = () => <div className="loading-screen"><div className="spinner"/></div>;

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return <Layout />;
};

const PermRoute = ({ perm }) => {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (!hasPermission(perm)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const AnyPermRoute = ({ perms }) => {
  const { user, loading, hasAnyPermission } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (!hasAnyPermission(...perms)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/auth/google/success" element={<GoogleCallbackPage />} />
            <Route path="/auth/google/error"   element={<Navigate to="/login?error=google" replace />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile"   element={<ProfilePage />} />

              {/* Academic */}
              <Route element={<AnyPermRoute perms={['assignments:submit','assignments:manage','assignments:grade']} />}>
                <Route path="/assignments" element={<AssignmentsPage />} />
              </Route>
              <Route element={<PermRoute perm="materials:download" />}>
                <Route path="/materials" element={<MaterialsPage />} />
              </Route>
              <Route element={<AnyPermRoute perms={['courses:register','enrollment:manage','roster:view']} />}>
                <Route path="/enrollments" element={<EnrollmentsPage />} />
              </Route>
              <Route element={<AnyPermRoute perms={['grades:view_own','grades:input','reports:department']} />}>
                <Route path="/grades" element={<GradesPage />} />
              </Route>

              {/* Admin / System */}
              <Route element={<PermRoute perm="users:view" />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
              <Route element={<PermRoute perm="audit:view" />}>
                <Route path="/audit" element={<AuditPage />} />
              </Route>
              <Route element={<PermRoute perm="system:health" />}>
                <Route path="/system" element={<SystemPage />} />
              </Route>
            </Route>

            <Route path="/"   element={<Navigate to="/dashboard" replace />} />
            <Route path="*"   element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}