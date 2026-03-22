import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../services/api';
import { LayoutDashboard, Users, LogOut, Menu, X, ChevronRight, User, ClipboardList, MessageSquare, Settings } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/messages');
      const data = Array.isArray(res.data) ? res.data : [];
      const total = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadTotal(total);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Listen for manual refresh events (e.g. from Messages page)
    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener('refresh-unread', handleRefresh);
    
    const interval = setInterval(fetchUnreadCount, 20000); // Poll every 20s
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-unread', handleRefresh);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: true },
    { to: '/dashboard/profile', label: 'My Profile', icon: User, permission: true },
    { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare, permission: true },
    { to: '/dashboard/users', label: 'User Management', icon: Users, permission: user?.permissions?.canViewUsers },
    { to: '/dashboard/logs', label: 'Auth Logs', icon: ClipboardList, permission: user?.permissions?.canViewLogs },
    { to: '/dashboard/settings', label: 'System Settings', icon: Settings, permission: user?.permissions?.canManageSettings },
  ];

  const filteredLinks = navLinks.filter(link => link.permission);

  const NavItem = ({ link, onClick }) => {
    const isActive = location.pathname === link.to;
    return (
      <Link
        to={link.to}
        onClick={onClick}
        className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <link.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'} />
          <span className="font-semibold text-sm">{link.label}</span>
        </div>
        {link.to === '/dashboard/messages' && unreadTotal > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-bounce">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
        {isActive && link.to !== '/dashboard/messages' && <ChevronRight size={14} className="text-white opacity-70" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin<span className="text-blue-600">Pro</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-3">Main Menu</div>
          {filteredLinks.map(link => (
            <NavItem key={link.to} link={link} />
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {user?.avatar ? (
                  <img src={`${API_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full space-x-3 p-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          >
            <LogOut size={20} className="text-red-400 group-hover:text-red-500" />
            <span className="font-bold text-sm">Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white z-[70] lg:hidden transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin<span className="text-blue-600">Pro</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredLinks.map(link => (
            <NavItem key={link.to} link={link} onClick={() => setIsMobileMenuOpen(false)} />
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full space-x-3 p-4 text-red-500 bg-red-50 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 bg-gray-50 rounded-xl lg:hidden text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl font-black text-gray-900 capitalize tracking-tight">
                {location.pathname.split('/').pop() || 'Dashboard Overview'}
              </h2>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Welcome back to your control center</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{user?.role}</p>
            </div>
            <Link to="/dashboard/profile" className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl p-0.5 shadow-lg shadow-blue-100 hover:scale-105 transition-transform active:scale-95 overflow-hidden">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-black text-blue-600 text-lg overflow-hidden">
                {user?.avatar ? (
                  <img src={`${API_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-4 lg:p-10 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
