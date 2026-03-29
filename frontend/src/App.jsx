import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import SessionExpiredModal from './components/SessionExpiredModal';

function App() {
  return (
    <AuthProvider>
      <SessionExpiredModal />
      <BrowserRouter>
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
