import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { user, loading } = useAuth();

  console.log('AuthLayout: Rendering', { hasUser: !!user, loading });

  if (loading) {
    console.log('AuthLayout: Waiting for auth...');
    return null;
  }

  if (user) {
    console.log('AuthLayout: User already logged in, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AuthLayout: Rendering forms via Outlet');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
