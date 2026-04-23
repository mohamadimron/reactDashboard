import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import RegisterRouteGate from './components/RegisterRouteGate';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import AuthLogs from './pages/AuthLogs';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SystemLogs from './pages/SystemLogs';
import SessionExpiredModal from './components/SessionExpiredModal';
import { installFrontendErrorLogging, logFrontendEvent } from './utils/frontendLogger';
import { fetchAndApplyUiBranding } from './utils/uiBranding';

const RouteChangeLogger = () => {
  const location = useLocation();

  useEffect(() => {
    logFrontendEvent('route_change', {
      pathname: location.pathname,
      search: location.search
    }, `Route changed to ${location.pathname}`);
  }, [location.pathname, location.search]);

  return null;
};

function App() {
  useEffect(() => installFrontendErrorLogging(), []);
  useEffect(() => {
    void fetchAndApplyUiBranding();
  }, []);

  return (
    <AuthProvider>
      <SessionExpiredModal />
      <BrowserRouter>
        <RouteChangeLogger />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterRouteGate />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="messages" 
                element={
                  <ProtectedRoute permissionKey="canViewMessages">
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              
              <Route
                path="users" 
                element={
                  <ProtectedRoute permissionKey="canViewUsers">
                    <Users />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="users/:id" 
                element={
                  <ProtectedRoute permissionKey="canViewUsers">
                    <UserDetail />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="logs" 
                element={
                  <ProtectedRoute permissionKey="canViewLogs">
                    <AuthLogs />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="system-logs"
                element={
                  <ProtectedRoute permissionKey="canViewLogs">
                    <SystemLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute permissionKey="canManageSettings">
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
