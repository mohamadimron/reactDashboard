import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Filter,
  MonitorCog,
  Search,
  Server,
  Trash2,
  X,
  ShieldAlert,
  Info,
  Activity,
  Globe,
  Terminal,
  User
} from 'lucide-react';
import { logFrontendError } from '../utils/frontendLogger';

const DEFAULT_FILTERS = {
  sources: ['BACKEND', 'FRONTEND'],
  types: ['EVENT', 'ERROR'],
  levels: ['INFO', 'WARN', 'ERROR'],
  categories: []
};

const SystemLogs = () => {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'ADMIN';

  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [type, setType] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        search,
        source,
        type,
        level,
        category,
        startDate,
        endDate
      });

      const response = await api.get(`/system-logs?${params.toString()}`);
      setLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
      setTotalPages(response.data.totalPages || 1);
      setTotalLogs(response.data.totalLogs || 0);
      setFilters(response.data.filters || DEFAULT_FILTERS);
    } catch (error) {
      logFrontendError('fetch_system_logs_failed', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [category, endDate, level, page, search, source, startDate, type]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const resetFilters = () => {
    setSearch('');
    setSource('');
    setType('');
    setLevel('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setPage(1);
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
    setIsDeleting(true);
    try {
      await api.delete(`/system-logs/${logToDelete.id}`);
      fetchLogs();
      closeDeleteModal();
    } catch (error) {
      logFrontendError('delete_system_log_failed', error);
      alert(error.response?.data?.message || 'Failed to delete log');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/system-logs');
      setPage(1);
      fetchLogs();
      setIsClearModalOpen(false);
    } catch (error) {
      logFrontendError('clear_system_logs_failed', error);
      alert(error.response?.data?.message || 'Failed to clear logs');
    } finally {
      setIsDeleting(false);
    }
  };

  const getLevelBadge = (value) => {
    const style = value === 'ERROR'
      ? 'bg-red-100 text-red-700 border-red-200'
      : value === 'WARN'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${style}`}>
        {value}
      </span>
    );
  };

  const getTypeBadge = (value) => {
    const style = value === 'ERROR'
      ? 'bg-red-600 text-white shadow-sm'
      : 'bg-blue-600 text-white shadow-sm';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${style}`}>
        {value}
      </span>
    );
  };

  const renderMetadata = (value) => {
    if (!value) return 'No metadata analysis available';
    if (typeof value !== 'object') return String(value);
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return 'Error parsing metadata';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">System Event Logs</h2>
          <p className="text-sm text-gray-500 font-medium">Monitor application infrastructure, events, and error diagnostics</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={loading || isDeleting || totalLogs === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 border border-red-100 shadow-sm hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 border border-gray-200 shadow-sm w-fit">
            <Database size={14} className="text-blue-600" />
            {loading ? 'Syncing...' : `${totalLogs} Entries`}
          </div>
        </div>
      </div>

      {/* Filters Card - Styled like AuthLogs */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 text-gray-900 font-black text-sm mb-2">
          <Filter size={18} className="text-blue-600" />
          <span>Advanced Filters</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search message, action, user, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <select value={source} onChange={(e) => setSource(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="">All Sources</option>
            {filters.sources.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="">All Types</option>
            {filters.types.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="">All Levels</option>
            {filters.levels.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <button type="submit" className="bg-blue-600 text-white rounded-xl py-2.5 px-5 text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <Search size={16} />
            Apply
          </button>
          
          <div className="xl:hidden"></div> {/* Spacer for alignment if needed */}

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer xl:col-span-1">
            <option value="">All Categories</option>
            {filters.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <div className="flex items-center space-x-2 md:col-span-2 xl:col-span-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-2 text-xs font-bold focus:ring-2 focus:ring-blue-500" />
            </div>
            <span className="text-gray-400 text-xs font-bold uppercase">To</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-2 text-xs font-bold focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <button type="button" onClick={resetFilters} className="text-xs font-black text-gray-400 hover:text-gray-700 uppercase tracking-widest xl:col-span-1 text-center">
            Reset All
          </button>
        </form>
      </div>

      {/* Table Card - Styled like AuthLogs */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Source & Category</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Event Type</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">User & Role</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Action & Message</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Connection</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-gray-400">Syncing system audit...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching system events found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={`group hover:bg-gray-50/80 transition-colors ${log.type === 'ERROR' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <div className={`p-1.5 rounded-lg text-gray-500 ${log.source === 'BACKEND' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                          {log.source === 'BACKEND' ? <Server size={14} /> : <MonitorCog size={14} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">{log.source}</span>
                          <span className="text-[10px] font-bold text-blue-600 uppercase">{log.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getTypeBadge(log.type)}
                        {getLevelBadge(log.level)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 truncate max-w-[120px]" title={log.userName || log.userId || 'System'}>
                            {log.userName || (log.userId ? `ID: ${log.userId.split('-')[0]}` : 'System')}
                          </span>
                          <span className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            log.userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {log.userRole || 'ANONYMOUS'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col min-w-[200px] max-w-lg">
                        <span className="text-[10px] font-black text-gray-400 uppercase truncate" title={log.action}>{log.action}</span>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1" title={log.message}>{log.message}</p>
                        {log.stack && (
                          <span className="inline-flex items-center mt-1 text-[9px] font-black text-red-500 uppercase">
                            <AlertTriangle size={10} className="mr-1" /> Stack Trace Available
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-gray-700">{log.ipAddress || '0.0.0.0'}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase border ${log.statusCode >= 400 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                            {log.method || 'GET'} {log.statusCode || '200'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 truncate max-w-[180px]" title={log.path}>{log.path || '/'}</span>
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
                        {isAdmin && (
                          <button 
                            onClick={() => openDeleteModal(log)}
                            disabled={isDeleting}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-red-100 disabled:opacity-30"
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

      {/* Log Detail Modal - EXACT AuthLogs Style */}
      {isDetailOpen && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDetailOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">System Audit Detail</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ref ID: {selectedLog.id.substring(0, 13)}...</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Infrastructure Source</span>
                  <div className="mt-1 flex gap-2">{getTypeBadge(selectedLog.type)} {getLevelBadge(selectedLog.level)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Component Category</span>
                  <p className="text-sm font-black text-blue-600 mt-1 uppercase">{selectedLog.category}</p>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Terminal size={14} className="text-blue-600" /> Event Diagnostics
                </h4>
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm overflow-hidden">
                  <DetailRow label="System Action" value={selectedLog.action} />
                  <DetailRow label="Message" value={selectedLog.message} />
                  <DetailRow label="Resource Path" value={selectedLog.path || '/'} isMono />
                  <DetailRow label="Network Origin" value={selectedLog.ipAddress || 'Internal'} isMono />
                <DetailRow label="Executor ID" value={selectedLog.userId || 'Anonymous'} />
                <DetailRow label="Executor Name" value={selectedLog.userName || 'System/Guest'} />
                <DetailRow label="Event Timestamp" value={new Date(selectedLog.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })} />
                </div>
              </div>

              {/* Payloads */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe size={14} className="text-blue-600" /> Technical Context
                </h4>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner">
                    <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Metadata Analysis</span>
                    <pre className="text-[10px] font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {renderMetadata(selectedLog.metadata)}
                    </pre>
                  </div>
                  {selectedLog.stack && (
                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                      <span className="block text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Stack Diagnosis</span>
                      <pre className="text-[10px] font-mono text-red-600 leading-relaxed whitespace-pre-wrap">
                        {selectedLog.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                Dismiss Audit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - EXACT AuthLogs Style */}
      {isDeleteModalOpen && logToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeDeleteModal}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Event Entry?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                This will permanently erase this infrastructure log from the audit vault. This action is irreversible.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-2xl text-xs font-mono text-gray-400 border border-gray-100 overflow-hidden">
                <span className="block truncate">Ref: {logToDelete.id}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Erase'}
              </button>
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="w-full flex-1 bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 font-black text-sm hover:bg-gray-50 transition-all sm:order-1 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal - Theme matched with AuthLogs */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsClearModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-red-100">
                <ShieldAlert size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Purge Entire Vault?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                CRITICAL: This will wipe ALL system events from the database. Infrastructure history will be lost.
              </p>
              <div className="mt-4 p-3 bg-red-50 rounded-2xl text-xs font-black text-red-600 border border-red-100">
                Total Logs Affected: {totalLogs}
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
              <button
                onClick={handleClearAll}
                disabled={isDeleting}
                className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2 disabled:opacity-50"
              >
                {isDeleting ? 'Purging...' : 'Confirm Purge'}
              </button>
              <button
                onClick={() => setIsClearModalOpen(false)}
                disabled={isDeleting}
                className="w-full flex-1 bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 font-black text-sm hover:bg-gray-50 transition-all sm:order-1 disabled:opacity-50"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value, isMono = false }) => (
  <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-1">
    <span className="text-xs font-bold text-gray-500">{label}</span>
    <span className={`text-sm font-black text-gray-900 text-left md:text-right max-w-md break-words ${isMono ? 'font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100' : ''}`}>
      {value || 'N/A'}
    </span>
  </div>
);

export default SystemLogs;
