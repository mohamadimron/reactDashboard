import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, ShieldCheck, LogOut, Info, Search, 
  Filter, Calendar, ChevronLeft, ChevronRight, Monitor, 
  Smartphone, Tablet, Cpu, AlertTriangle, Eye, X, Trash2, User as UserIcon
} from 'lucide-react';

const AuthLogs = () => {
  const { user: authUser } = useAuth();
  const perms = authUser?.permissions || {};

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [isSuspicious, setIsSuspicious] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        search,
        eventType,
        isSuspicious,
        startDate,
        endDate
      });
      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch auth logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventType, isSuspicious, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'LOGIN_SUCCESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 border border-green-200"><ShieldCheck size={12} className="mr-1" /> Success</span>;
      case 'LOGIN_FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200"><ShieldAlert size={12} className="mr-1" /> Failed</span>;
      case 'LOGOUT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200"><LogOut size={12} className="mr-1" /> Logout</span>;
      default:
        return type;
    }
  };

  const getDeviceIcon = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('mobile')) return <Smartphone size={14} />;
    if (t?.includes('tablet')) return <Tablet size={14} />;
    return <Monitor size={14} />;
  };

  const openDetail = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const openDeleteModal = (log) => {
    setLogToDelete(log);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setLogToDelete(null);
  };

  const handleDelete = async () => {
    if (!logToDelete) return;
    try {
      await api.delete(`/logs/${logToDelete.id}`);
      fetchLogs();
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete auth log', error);
      alert(error.response?.data?.message || 'Failed to delete log');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Security Audit Logs</h2>
          <p className="text-sm text-gray-500 font-medium">Monitor all authentication attempts and system access</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 text-gray-900 font-black text-sm mb-2">
          <Filter size={18} className="text-blue-600" />
          <span>Advanced Filters</span>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="User / IP Address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Events</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="LOGOUT">Logout</option>
          </select>

          <select
            value={isSuspicious}
            onChange={(e) => setIsSuspicious(e.target.value)}
            className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Suspicious: All</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Normal Only</option>
          </select>

          <div className="flex items-center space-x-2 lg:col-span-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-400 text-xs font-bold">TO</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Login Input</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Device & Browser</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Connection (IP/ISP)</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Risk Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-gray-400">Synchronizing security logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No activity logs found matching criteria</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={`group hover:bg-gray-50/80 transition-colors ${log.isSuspicious ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{log.usernameInput}</span>
                        {log.userId && <span className="text-[10px] font-bold text-blue-600">ID: {log.userId.substring(0,8)}...</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getEventBadge(log.eventType)}
                        {log.failureReason && (
                          <span className="text-[10px] font-bold text-red-500 uppercase">{log.failureReason.replace('_', ' ')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                          {getDeviceIcon(log.deviceType)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{log.browser}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase">{log.os} ({log.deviceType})</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono font-bold text-gray-700">{log.ipAddress}</span>
                          {log.country && log.country !== 'Local' && (
                            <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-gray-200">
                              {log.country}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-blue-600 uppercase truncate max-w-[150px]" title={`${log.isp} (${log.country})`}>
                          {log.isp || 'Internal Network'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {log.isSuspicious && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-red-600 text-white shadow-sm shadow-red-200 animate-pulse">
                            <AlertTriangle size={10} className="mr-1" /> Suspicious
                          </span>
                        )}
                        {log.isNewDevice && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-blue-600 text-white shadow-sm shadow-blue-200">
                            New Device
                          </span>
                        )}
                        {!log.isSuspicious && !log.isNewDevice && (
                          <span className="text-[10px] font-bold text-gray-300">SECURE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => openDetail(log)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-blue-100"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {perms.canViewLogs && (
                          <button 
                            onClick={() => openDeleteModal(log)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-red-100"
                            title="Delete Log"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {isDetailOpen && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <ShieldCheck className="text-blue-400" size={24} />
                    Audit Entry Details
                  </h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ref ID: {selectedLog.id.substring(0, 13)}...</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Event Summary Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Event Type</span>
                  <div className="mt-1">{getEventBadge(selectedLog.eventType)}</div>
                </div>
                <div className={`p-4 rounded-2xl border ${selectedLog.isSuspicious ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <span className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${selectedLog.isSuspicious ? 'text-red-400' : 'text-blue-400'}`}>Risk Analysis</span>
                  <p className={`text-sm font-black mt-1 ${selectedLog.isSuspicious ? 'text-red-600' : 'text-blue-600'}`}>
                    {selectedLog.isSuspicious ? 'SUSPICIOUS ACTIVITY' : 'SECURE SESSION'}
                  </p>
                </div>
              </div>

              {/* User & Network Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <UserIcon size={14} className="text-blue-600" /> Identity & Network
                </h4>
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm overflow-hidden">
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Username Input</span>
                    <span className="text-sm font-black text-gray-900">{selectedLog.usernameInput}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">IP Address</span>
                    <span className="text-sm font-mono font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">{selectedLog.ipAddress}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Service Provider (ISP)</span>
                    <span className="text-sm font-black text-blue-600 uppercase text-right max-w-[200px] break-words">{selectedLog.isp || 'Internal Network'}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Country of Origin</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-700 border border-gray-200">
                      {selectedLog.country || 'Local Network'}
                    </span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">Access Timestamp</span>
                    <span className="text-sm font-bold text-gray-900">
                      {new Date(selectedLog.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Device Analysis Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Monitor size={14} className="text-blue-600" /> Device Fingerprint
                </h4>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                      {getDeviceIcon(selectedLog.deviceType)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-tight">{selectedLog.browser} on {selectedLog.os}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{selectedLog.deviceType} Environment</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner">
                    <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Raw User Agent Header</span>
                    <p className="text-[10px] font-mono text-gray-500 leading-relaxed break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeDeleteModal}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Auth Log?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Are you sure you want to delete this log entry? This action is permanent and cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-2xl text-xs font-mono text-gray-400 border border-gray-100">
                Log ID: {logToDelete?.id}
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
              <button
                onClick={handleDelete}
                className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2"
              >
                Confirm Delete
              </button>
              <button
                onClick={closeDeleteModal}
                className="w-full flex-1 bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 font-black text-sm hover:bg-gray-50 transition-all sm:order-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthLogs;
