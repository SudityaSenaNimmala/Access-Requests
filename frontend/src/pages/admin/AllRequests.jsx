import { useState, useEffect } from 'react';
import { requestApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ResultViewer from '../../components/ResultViewer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, Filter, Clock, User, UserCheck, Eye, X, Database } from 'lucide-react';

const AllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchRequests();
  }, [filter, pagination.page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await requestApi.getAllRequests(params);
      setRequests(response.data.requests);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filters = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'executed', label: 'Executed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'failed', label: 'Failed' },
  ];

  const getStatusCount = (status) => {
    return requests.filter(r => r.status === status).length;
  };

  if (loading && requests.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">All Requests</h1>
          <p className="text-slate-400 mt-1">View all query requests across the system</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="select py-2 px-3 text-sm"
          >
            {filters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-amber-500/10 border-amber-500/30 py-4">
          <p className="text-2xl font-bold text-amber-400">{getStatusCount('pending')}</p>
          <p className="text-sm text-slate-400">Pending</p>
        </div>
        <div className="card bg-emerald-500/10 border-emerald-500/30 py-4">
          <p className="text-2xl font-bold text-emerald-400">{getStatusCount('executed')}</p>
          <p className="text-sm text-slate-400">Executed</p>
        </div>
        <div className="card bg-red-500/10 border-red-500/30 py-4">
          <p className="text-2xl font-bold text-red-400">{getStatusCount('rejected')}</p>
          <p className="text-sm text-slate-400">Rejected</p>
        </div>
        <div className="card bg-orange-500/10 border-orange-500/30 py-4">
          <p className="text-2xl font-bold text-orange-400">{getStatusCount('failed')}</p>
          <p className="text-sm text-slate-400">Failed</p>
        </div>
      </div>

      {/* Requests Table */}
      {requests.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Database</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Developer</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Team Lead</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Query Type</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Created</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-4 px-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-slate-200 text-sm">{request.dbInstanceName}</p>
                          {request.collectionName && request.collectionName !== 'unknown' && (
                            <p className="text-slate-500 text-xs">{request.collectionName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 text-sm">{request.developerName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 text-sm">{request.teamLeadName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-400 text-sm capitalize">{request.queryType}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400 text-sm">{formatDate(request.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn-secondary py-1.5 px-3 text-sm"
                >
                  Previous
                </button>
                <span className="text-slate-400 px-2">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary py-1.5 px-3 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No requests found</h3>
          <p className="text-slate-500">
            {filter === 'all'
              ? 'No requests have been submitted yet'
              : `No ${filter} requests found`}
          </p>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-slate-200">Request Details</h3>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Developer</p>
                  <p className="text-slate-200">{selectedRequest.developerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Team Lead</p>
                  <p className="text-slate-200">{selectedRequest.teamLeadName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
                  <p className="text-slate-200">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Database</p>
                  <p className="text-slate-200">{selectedRequest.dbInstanceName}</p>
                </div>
                {selectedRequest.collectionName && selectedRequest.collectionName !== 'unknown' && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Collection</p>
                  <p className="text-slate-200">{selectedRequest.collectionName}</p>
                </div>
              )}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Query Type</p>
                  <p className="text-slate-200 capitalize">{selectedRequest.queryType}</p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Reason</p>
              <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{selectedRequest.reason}</p>
            </div>

            {/* Query */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Query</p>
              <pre className="text-sm text-slate-300 bg-slate-800 p-4 rounded-lg overflow-x-auto font-mono">
                {selectedRequest.query}
              </pre>
            </div>

            {/* Review Comment */}
            {selectedRequest.reviewComment && (
              <div className="mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Review Comment</p>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{selectedRequest.reviewComment}</p>
              </div>
            )}

            {/* Result or Error */}
            {(selectedRequest.result || selectedRequest.error) && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  {selectedRequest.error ? 'Error' : 'Output'}
                </p>
                <ResultViewer result={selectedRequest.result} error={selectedRequest.error} />
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
              <button
                onClick={() => setSelectedRequest(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRequests;
