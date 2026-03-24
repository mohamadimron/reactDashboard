import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Settings as SettingsIcon, Plus, Trash2, 
  CheckCircle2, XCircle, Save, Loader2, Info, Lock, X, Check
} from 'lucide-react';

const Settings = () => {
  const { user: currentUser, updateUserContext } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'access'
  const [newRoleName, setNewRoleName] = useState('');
  
  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      await api.post('/roles', { name: newRoleName });
      setNewRoleName('');
      fetchRoles();
      showSuccess(`Role "${newRoleName.toUpperCase()}" registered successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  const openDeleteModal = (role) => {
    if (role.name === 'ADMIN') return;
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await api.delete(`/roles/${roleToDelete.id}`);
      fetchRoles();
      closeDeleteModal();
      showSuccess(`Role has been removed.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleTogglePermission = (roleId, field) => {
    setRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        return { ...r, [field]: !r[field] };
      }
      return r;
    }));
  };

  const savePermissions = async (role) => {
    setIsSaving(role.id);
    try {
      await api.put(`/roles/${role.id}/permissions`, {
        canViewUsers: role.canViewUsers,
        canCreateUsers: role.canCreateUsers,
        canEditUsers: role.canEditUsers,
        canDeleteUsers: role.canDeleteUsers,
        canViewLogs: role.canViewLogs,
        canManageSettings: role.canManageSettings,
        canViewMessages: role.canViewMessages,
        canDeleteMessages: role.canDeleteMessages
      });

      // Update current user context if they modified their own role
      if (currentUser && currentUser.role === role.name) {
        updateUserContext({
          permissions: {
            canViewUsers: role.canViewUsers,
            canCreateUsers: role.canCreateUsers,
            canEditUsers: role.canEditUsers,
            canDeleteUsers: role.canDeleteUsers,
            canViewLogs: role.canViewLogs,
            canManageSettings: role.canManageSettings,
            canViewMessages: role.canViewMessages,
            canDeleteMessages: role.canDeleteMessages
          }
        });
      }

      showSuccess(`Access Matrix for ${role.name} updated!`);
    } catch (err) {
      alert('Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <SettingsIcon size={24} />
            </div>
            System Administration
          </h2>
          <p className="text-sm text-gray-500 font-medium ml-1">Configure global roles and granular access permissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('roles')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === 'roles' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Role Management
        </button>
        <button 
          onClick={() => setActiveTab('access')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === 'access' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Access Control Matrix
        </button>
      </div>

      {activeTab === 'roles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-left-4 duration-500">
          {/* Add Role Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6">Create New Role</h3>
              <form onSubmit={handleAddRole} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Role Identifier</label>
                  <input 
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="e.g. MODERATOR"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Register Role
                </button>
              </form>
            </div>
          </div>

          {/* Roles Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Role Name</th>
                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="2" className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">Syncing Roles Matrix...</td></tr>
                  ) : roles.map(role => (
                    <tr key={role.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5 font-black text-gray-900">{role.name}</td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => openDeleteModal(role)}
                          className={`p-2.5 rounded-xl transition-all ${
                            role.name === 'ADMIN' 
                              ? 'text-gray-200 cursor-not-allowed opacity-50' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50 shadow-sm border border-transparent'
                          }`}
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inline Access Control Matrix */
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900">{role.name}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Permissions Configuration</p>
                  </div>
                </div>
                <button 
                  onClick={() => savePermissions(role)}
                  disabled={isSaving === role.id}
                  className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving === role.id ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Update Matrix</span>
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-4 lg:col-span-3">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Module: User Management
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PermissionToggle label="View Directory" active={role.canViewUsers} onClick={() => handleTogglePermission(role.id, 'canViewUsers')} />
                    <PermissionToggle label="Register Member" active={role.canCreateUsers} onClick={() => handleTogglePermission(role.id, 'canCreateUsers')} />
                    <PermissionToggle label="Modify Data" active={role.canEditUsers} onClick={() => handleTogglePermission(role.id, 'canEditUsers')} />
                    <PermissionToggle label="Delete Accounts" active={role.canDeleteUsers} onClick={() => handleTogglePermission(role.id, 'canDeleteUsers')} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                    Module: Security Audit
                  </h5>
                  <PermissionToggle label="Access Auth Logs" active={role.canViewLogs} onClick={() => handleTogglePermission(role.id, 'canViewLogs')} />
                </div>

                <div className="space-y-4 lg:col-span-4 mt-4">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                    Module: Messaging System
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PermissionToggle label="Open Private Chat" active={role.canViewMessages} onClick={() => handleTogglePermission(role.id, 'canViewMessages')} />
                    <PermissionToggle label="Remove Conversations" active={role.canDeleteMessages} onClick={() => handleTogglePermission(role.id, 'canDeleteMessages')} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUCCESS MODAL (NEW) */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsSuccessModalOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={48} className="animate-in zoom-in duration-500 delay-100" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Success!</h3>
              <p className="text-gray-500 font-bold leading-relaxed">{successMessage}</p>
            </div>
            <div className="bg-gray-50 px-10 py-8 border-t border-gray-100">
              <button 
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && roleToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeDeleteModal}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8 shadow-inner">
                <Trash2 size={48} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Terminate?</h3>
              <p className="text-gray-500 font-bold leading-relaxed px-2">Are you sure you want to remove the role <span className="text-gray-900">"{roleToDelete.name}"</span>?</p>
            </div>
            <div className="bg-gray-50 px-10 py-8 flex flex-col sm:flex-row gap-4 border-t border-gray-100">
              <button onClick={handleDeleteRole} className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2">Confirm Delete</button>
              <button onClick={closeDeleteModal} className="w-full flex-1 bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 font-black text-sm hover:bg-gray-50 transition-all sm:order-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PermissionToggle = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-between p-6 rounded-[1.75rem] border-2 transition-all group ${
      active 
        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-100' 
        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
    }`}
  >
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    {active ? (
      <CheckCircle2 className="text-blue-600 animate-in zoom-in duration-300 flex-shrink-0" size={22} />
    ) : (
      <XCircle className="text-gray-200 group-hover:text-gray-300 flex-shrink-0" size={22} />
    )}
  </button>
);

export default Settings;
