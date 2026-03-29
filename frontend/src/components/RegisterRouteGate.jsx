import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import Register from '../pages/Register';

const RegisterRouteGate = () => {
  const [loading, setLoading] = useState(true);
  const [registerEnabled, setRegisterEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRegisterStatus = async () => {
      try {
        const res = await api.get('/settings/public');
        if (mounted) {
          setRegisterEnabled(Boolean(res.data?.registerPageEnabled));
        }
      } catch (error) {
        if (mounted) {
          setRegisterEnabled(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRegisterStatus();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (!registerEnabled) {
    return <Navigate to="/login" replace />;
  }

  return <Register />;
};

export default RegisterRouteGate;
