import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_URL } from '../services/api';
import { 
  ArrowLeft, Mail, Shield, Calendar, Clock, 
  User as UserIcon, CheckCircle2, XCircle, 
  Search, Maximize2, X
} from 'lucide-react';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-gray-900">User not found</h3>
        <button 
          onClick={() => navigate('/dashboard/users')}
          className="mt-4 text-blue-600 font-bold hover:underline inline-flex items-center"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to User Management
        </button>
      </div>
    );
  }

  const avatarUrl = userData.avatar ? `${API_URL}${userData.avatar}` : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* Header Navigation */}
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard/users')}
          className="group flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <div className="p-2 rounded-xl group-hover:bg-blue-50 transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="font-bold text-sm">Back to User Management</span>
        </button>
        
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
          <div className={`w-2.5 h-2.5 rounded-full ${userData.lastLogin ? 'bg-green-500' : 'bg-gray-300'} animate-pulse`}></div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            {userData.lastLogin ? 'Active Member' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="px-8 lg:px-12 pb-12">
          {/* Profile Section */}
          <div className="relative -mt-24 flex flex-col md:flex-row md:items-end md:space-x-8 mb-12">
            <div className="relative group self-center md:self-auto">
              <div className="w-48 h-48 bg-white rounded-[2rem] p-1.5 shadow-2xl shadow-blue-900/10 transition-transform duration-500 hover:scale-[1.02]">
                <div 
                  className="w-full h-full bg-blue-50 rounded-[1.7rem] flex items-center justify-center text-blue-600 font-black text-6xl overflow-hidden cursor-zoom-in relative"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    userData.name.charAt(0).toUpperCase()
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="text-white" size={32} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 mt-6 md:mt-0 text-center md:text-left pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">{userData.name}</h2>
                <span className={`inline-flex self-center md:self-auto items-center px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mt-2 md:mt-0 ${
                  userData.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {userData.role}
                </span>
              </div>
              <p className="text-lg text-gray-500 font-medium flex items-center justify-center md:justify-start space-x-2">
                <Mail size={18} className="text-gray-400" />
                <span>{userData.email}</span>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="bg-[#f8fafc] rounded-[2rem] p-8 space-y-6 border border-gray-100/50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-black text-gray-900">Security Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Account ID</span>
                  <span className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-100 font-bold text-gray-700">{userData.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">System Access</span>
                  <span className="flex items-center space-x-1.5 text-green-600 font-black text-sm">
                    <CheckCircle2 size={16} />
                    <span>AUTHORIZED</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Role Level</span>
                  <span className="text-gray-900 font-black text-sm">{userData.role === 'ADMIN' ? 'MASTER PRIVILEGE' : 'STANDARD ACCESS'}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-[#f8fafc] rounded-[2rem] p-8 space-y-6 border border-gray-100/50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <Calendar size={20} />
                </div>
                <h3 className="text-xl font-black text-gray-900">Activity History</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 text-gray-500 font-bold text-sm uppercase tracking-wider">
                    <Calendar size={14} />
                    <span>Registered</span>
                  </div>
                  <div className="text-right text-gray-900 font-black text-sm">
                    {new Date(userData.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(userData.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 text-gray-500 font-bold text-sm uppercase tracking-wider">
                    <Clock size={14} />
                    <span>Last Update</span>
                  </div>
                  <div className="text-right text-gray-900 font-black text-sm">
                    {new Date(userData.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(userData.updatedAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 text-gray-500 font-bold text-sm uppercase tracking-wider">
                    <Clock size={14} />
                    <span>Last Login</span>
                  </div>
                  <div className="text-right text-gray-900 font-black text-sm">
                    {userData.lastLogin ? (
                      <>
                        {new Date(userData.lastLogin).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(userData.lastLogin).toLocaleTimeString()}</p>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">NEVER LOGGED IN</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && avatarUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative animate-in zoom-in-95 duration-300 max-w-2xl w-full">
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-16 right-0 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <img 
                src={avatarUrl} 
                alt={userData.name} 
                className="w-full h-auto rounded-[2rem] shadow-inner"
              />
              <div className="p-6 text-center">
                <h4 className="text-xl font-black text-gray-900">{userData.name}</h4>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{userData.role} AVATAR</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
