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
  Info
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
        limit: 20,
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
      setTotalPages(1);
      setTotalLogs(0);
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
      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${style}`}>
        {value}
      </span>
    );
  };

  const getTypeBadge = (value) => {
    const style = value === 'ERROR'
      ? 'bg-red-600 text-white shadow-sm shadow-red-200'
      : 'bg-blue-600 text-white shadow-sm shadow-blue-200';

    return (
      <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${style}`}>
        {value}
      </span>
    );
  };

  const renderMetadata = (value) => {
    if (!value) return 'No metadata';
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">System Logs</h2>
          <p className="text-sm text-gray-500 font-medium">Monitor application events and errors across frontend and backend</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={loading || isDeleting || totalLogs === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600 border border-red-100 shadow-sm hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
          <div className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 border border-gray-200 shadow-sm w-fit">
            {loading ? 'Syncing...' : `${totalLogs} Logs`}
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-gray-900 font-black text-sm">
            <Filter size={18} className="text-blue-600" />
            <span>Advanced Filters</span>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-black text-gray-400 hover:text-gray-700 uppercase tracking-widest"
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Message, action, path, user, IP, metadata"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <select value={source} onChange={(e) => setSource(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Sources</option>
            {filters.sources.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Types</option>
            {filters.types.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Levels</option>
            {filters.levels.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Categories</option>
            {filters.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <div className="flex items-center space-x-2 md:col-span-2 xl:col-span-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-2 text-xs font-bold focus:ring-2 focus:ring-blue-500" />
            </div>
            <span className="text-gray-400 text-xs font-bold">TO</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-2 text-xs font-bold focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button type="submit" className="bg-blue-600 text-white rounded-xl py-2.5 px-5 text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Message</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Context</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-gray-400">Synchronizing system logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No system logs found matching criteria</p>
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className={`group hover:bg-gray-50/80 transition-colors ${log.type === 'ERROR' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{new Date(log.createdAt).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                        {log.source === 'BACKEND' ? <Server size={16} /> : <MonitorCog size={16} />}
                      </div>
                      <span className="text-xs font-black text-gray-700">{log.source}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {getTypeBadge(log.type)}
                      {getLevelBadge(log.level)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-black text-gray-900">{log.category}</span>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 max-w-[180px] truncate">{log.action}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[360px]">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2">{log.message}</p>
                      {log.stack && (
                        <span className="inline-flex items-center mt-2 rounded-lg bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase text-red-700">
                          <AlertTriangle size={10} className="mr-1" /> Stack Trace
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-xs font-bold text-gray-500">
                      <span>{log.method || '-'} {log.statusCode || ''}</span>
                      <span className="max-w-[220px] truncate" title={log.path || ''}>{log.path || '-'}</span>
                      <span className="font-mono text-[10px] text-gray-400">{log.ipAddress || 'unknown'}</span>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDetailOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">System Log Detail</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ref ID: {selectedLog.id.substring(0, 13)}...</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailItem label="Source" value={selectedLog.source} />
                <DetailItem label="Type" value={selectedLog.type} />
                <DetailItem label="Level" value={selectedLog.level} />
                <DetailItem label="Category" value={selectedLog.category} />
                <DetailItem label="Status Code" value={selectedLog.statusCode || 'N/A'} />
                <DetailItem label="Method" value={selectedLog.method || 'N/A'} />
              </div>

              <div className="space-y-4">
                <DetailItem label="Action" value={selectedLog.action} wide />
                <DetailItem label="Message" value={selectedLog.message} wide />
                <DetailItem label="Path" value={selectedLog.path || 'N/A'} wide />
                <DetailItem label="User Agent" value={selectedLog.userAgent || 'N/A'} wide />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="User ID" value={selectedLog.userId || 'System/Guest'} />
                <DetailItem label="User Role" value={selectedLog.userRole || 'N/A'} />
                <DetailItem label="IP Address" value={selectedLog.ipAddress || 'Unknown'} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Info size={12} className="text-blue-500" /> Metadata Analysis
                </label>
                <pre className="bg-gray-50 text-gray-700 rounded-2xl p-5 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-gray-100 shadow-inner">
                  {renderMetadata(selectedLog.metadata)}
                </pre>
              </div>

              {selectedLog.stack && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Execution Stack Trace
                  </label>
                  <pre className="bg-red-50 text-red-700 rounded-2xl p-5 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-red-100 shadow-inner leading-relaxed">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                Dismiss Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Theme matched with AuthLogs */}
      {isDeleteModalOpen && logToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={closeDeleteModal}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete System Log?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Are you sure you want to delete this log entry? This action is permanent and cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-2xl text-xs font-mono text-gray-400 border border-gray-100 overflow-hidden">
                <span className="block truncate">Log ID: {logToDelete.id}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
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
              <h3 className="text-2xl font-black text-gray-900 mb-2">Mass Purge Logs?</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                CRITICAL ACTION: This will permanently delete ALL system logs from the database. This operation is irreversible.
              </p>
              <div className="mt-4 p-3 bg-red-50 rounded-2xl text-xs font-black text-red-600 border border-red-100">
                Total Logs to Clear: {totalLogs}
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
              <button
                onClick={handleClearAll}
                disabled={isDeleting}
                className="w-full flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 sm:order-2 disabled:opacity-50"
              >
                {isDeleting ? 'Purging...' : 'Confirm Purge All'}
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

const DetailItem = ({ label, value, wide = false }) => (
  <div className={wide ? 'col-span-full' : ''}>
    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</span>
    <p className="text-sm font-bold text-gray-900 break-words leading-relaxed">{value}</p>
  </div>
);

export default SystemLogs;
