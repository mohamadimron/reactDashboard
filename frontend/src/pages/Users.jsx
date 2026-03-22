import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_URL } from '../services/api';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight, Eye, X, Loader2, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  roleId: z.string().min(1, 'Role is required'),
  statusId: z.string().min(1, 'Status is required'),
});

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Filter States
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSchema),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search,
        roleId: roleFilter,
        statusId: statusFilter,
        activity: activityFilter
      });
      const response = await api.get(`/users?${params.toString()}`);
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    setIsOptionsLoading(true);
    try {
      const [rolesRes, statusesRes] = await Promise.all([
        api.get('/users/roles'),
        api.get('/users/statuses')
      ]);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : []);
    } catch (error) {
      console.error('Failed to fetch options', error);
    } finally {
      setIsOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, search, roleFilter, statusFilter, activityFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setActivityFilter('');
    setSearch('');
    setPage(1);
  };

  const openModal = (user = null) => {
    if (isOptionsLoading) {
      alert('System is still synchronizing data. Please wait...');
      return;
    }

    setEditingUser(user);
    if (user) {
      const currentRoleName = user.role || '';
      const currentStatusName = user.status || '';
      const rId = roles.find(r => r.name?.toUpperCase() === currentRoleName.toUpperCase())?.id || '';
      const sId = statuses.find(s => s.name?.toUpperCase() === currentStatusName.toUpperCase())?.id || '';
      
      reset({ 
        name: user.name || '', 
        email: user.email || '', 
        roleId: rId, 
        statusId: sId,
        password: '' 
      });
    } else {
      reset({ name: '', email: '', roleId: '', statusId: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        const updateData = { ...data };
        if (!updateData.password) delete updateData.password;
        await api.put(`/users/${editingUser.id}`, updateData);
      } else {
        if (!data.password) {
          alert('Password is required for new users');
          return;
        }
        await api.post('/users', data);
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.message || 'Failed to process request');
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      fetchData();
      closeDeleteModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const getStatusStyle = (statusName = '') => {
    const name = (statusName || '').toUpperCase();
    switch (name) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'SUSPEND': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'NOT_ACTIVE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUserOnlineStatus = (lastActivity) => {
    if (!lastActivity) return { text: 'Offline', color: 'bg-gray-400' };
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffInMinutes = Math.floor((now - activityDate) / 60000);
    if (diffInMinutes < 5) return { text: 'Active Now', color: 'bg-green-500' };
    if (diffInMinutes < 60) return { text: `Active ${diffInMinutes}m ago`, color: 'bg-amber-400' };
    return { text: 'Offline', color: 'bg-gray-400' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">System Directory</h3>
          <p className="text-sm text-gray-500 font-medium">Manage user accounts, roles, and access levels</p>
        </div>
        <button
          onClick={() => openModal()}
          disabled={isOptionsLoading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold text-sm disabled:opacity-50"
        >
          {isOptionsLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
          <span>{isOptionsLoading ? 'Loading Options...' : 'Register Member'}</span>
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-900 font-black text-sm">
            <Filter size={18} className="text-blue-600" />
            <span>Directory Filters</span>
          </div>
          <button 
            onClick={resetFilters}
            className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
          >
            Reset All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search Identity..."
              value={search}
              onChange={handleSearch}
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Privileges</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.name.replace('_', ' ')}</option>)}
          </select>

          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Activity</option>
            <option value="today">Active Today</option>
            <option value="week">Active This Week</option>
            <option value="month">Active This Month</option>
            <option value="never">Never Logged In</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-[2.5rem] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Privilege</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Activity</th>
                <th className="px-6 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Management</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Syncing directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">No matching users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100 group-hover:border-blue-200 transition-colors shadow-sm">
                          {user.avatar ? (
                            <img src={`${API_URL}${user.avatar}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-base">
                              {(user.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none mb-1">{user.name}</p>
                          <p className="text-[11px] text-gray-500 font-bold">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'OPERATOR' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
                        {(user.status || 'UNKNOWN').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = getUserOnlineStatus(user.lastActivity);
                        return (
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${status.text === 'Active Now' ? 'text-green-600' : 'text-gray-700'}`}>
                              {status.text}
                            </span>
                            {user.lastLogin && (
                              <span className="text-[10px] text-gray-400 font-black uppercase">
                                Last: {new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center space-x-3">
                        <Link 
                          to={`/dashboard/users/${user.id}`}
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-blue-100"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => openModal(user)} 
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-blue-100"
                          title="Modify Account"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(user)} 
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-red-100"
                          title="Terminate Account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Page {page} / {totalPages}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                    {editingUser ? 'Account Update' : 'New Member'}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configure access & identity</p>
                </div>
                <button onClick={closeModal} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Full Identity Name</label>
                  <input
                    {...register('name')}
                    className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="mt-1.5 text-[10px] text-red-600 font-black ml-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
                  <input
                    {...register('email')}
                    className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="mt-1.5 text-[10px] text-red-600 font-black ml-1">{errors.email.message}</p>}
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                    Security Key {editingUser && <span className="lowercase font-medium italic opacity-50">(optional)</span>}
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">System Role</label>
                    <select
                      {...register('roleId')}
                      className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-inner appearance-none"
                    >
                      <option value="">-- Choose --</option>
                      {Array.isArray(roles) && roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {errors.roleId && <p className="mt-1.5 text-[10px] text-red-600 font-black ml-1">{errors.roleId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Account Status</label>
                    <select
                      {...register('statusId')}
                      className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-inner appearance-none"
                    >
                      <option value="">-- Choose --</option>
                      {Array.isArray(statuses) && statuses.map(s => <option key={s.id} value={s.id}>{(s.name || '').replace('_', ' ')}</option>)}
                    </select>
                    {errors.statusId && <p className="mt-1.5 text-[10px] text-red-600 font-black ml-1">{errors.statusId.message}</p>}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-gray-50 px-10 py-8 flex flex-col sm:flex-row-reverse gap-4 border-t border-gray-100">
              <button
                type="submit"
                form="user-form"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl py-4 px-10 font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : editingUser ? 'Update Securely' : 'Finalize Registry'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-full sm:w-auto bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 px-10 font-black text-sm hover:bg-gray-50 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeDeleteModal}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8 shadow-inner">
                <Trash2 size={48} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Terminate?</h3>
              <p className="text-gray-500 font-bold leading-relaxed px-2">
                Are you sure you want to delete <span className="text-gray-900">"{userToDelete?.name}"</span>? This operation is IRREVERSIBLE.
              </p>
            </div>
            <div className="bg-gray-50 px-10 py-8 flex flex-col sm:flex-row gap-4 border-t border-gray-100">
              <button onClick={handleDelete} className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2 text-center">Confirm Deletion</button>
              <button onClick={closeDeleteModal} className="w-full flex-1 bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 font-black text-sm hover:bg-gray-50 transition-all sm:order-1 text-center">Keep User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
