import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Profile from './pages/Profile';
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
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <Users />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users/:id" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UserDetail />
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
