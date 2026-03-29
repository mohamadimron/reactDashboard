import { useState, useEffect } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { resolveSessionExpiryDetail } from '../utils/sessionExpiry';

const SessionExpiredModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const handleExpired = (e) => {
      const detail = resolveSessionExpiryDetail(e.detail);
      setMessage(detail.message);
      setTitle(detail.title);
      setIsOpen(true);
    };

    window.addEventListener('session-expired', handleExpired);
    return () => window.removeEventListener('session-expired', handleExpired);
  }, []);

  const handleRedirect = () => {
    setIsOpen(false);
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"></div>

      {/* Modal Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
        <div className="bg-white p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6 animate-pulse">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
          <button
            onClick={handleRedirect}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <LogIn size={18} />
            <span>Login Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
