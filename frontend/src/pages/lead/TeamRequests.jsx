import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestApi, dbInstanceApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, Filter, Clock, Database, User, ArrowRight, X } from 'lucide-react';

const TeamRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbInstances, setDbInstances] = useState([]);
  const [collections, setCollections] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    dbInstanceId: '',
    collectionName: '',
    developerName: '',
    dateFrom: '',
    dateTo: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    dbInstanceApi.getAll({ activeOnly: 'true' }).then(res => setDbInstances(res.data)).catch(() => {});
    requestApi.getTeamLeadFilterOptions().then(res => {
      setCollections(res.data.collections || []);
      setDevelopers(res.data.developers || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [filters, pagination.page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.dbInstanceId) params.dbInstanceId = filters.dbInstanceId;
      if (filters.collectionName) params.collectionName = filters.collectionName;
      if (filters.developerName) params.developerName = filters.developerName;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await requestApi.getTeamRequests(params);
      setRequests(response.data.requests);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: 'pending', dbInstanceId: '', collectionName: '', developerName: '', dateFrom: '', dateTo: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.status !== 'pending' || filters.dbInstanceId || filters.collectionName || filters.developerName || filters.dateFrom || filters.dateTo;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'executed', label: 'Executed' },
    { value: 'failed', label: 'Failed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Team Requests</h1>
          <p className="text-slate-500 mt-1">Review and approve query requests from your team</p>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600">
            <X className="w-4 h-4" /> Clear Filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select text-sm py-2"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filters.dbInstanceId}
            onChange={(e) => handleFilterChange('dbInstanceId', e.target.value)}
            className="select text-sm py-2"
          >
            <option value="">All Databases</option>
            {dbInstances.map(db => (
              <option key={db._id} value={db._id}>{db.name}</option>
            ))}
          </select>

          <select
            value={filters.collectionName}
            onChange={(e) => handleFilterChange('collectionName', e.target.value)}
            className="select text-sm py-2"
          >
            <option value="">All Collections</option>
            {collections.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filters.developerName}
            onChange={(e) => handleFilterChange('developerName', e.target.value)}
            className="select text-sm py-2"
          >
            <option value="">All Developers</option>
            {developers.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="input text-sm py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="input text-sm py-2"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : requests.length > 0 ? (
        <>
          <div className="space-y-4">
            {requests.map((request, index) => (
              <Link
                key={request._id}
                to={`/lead/requests/${request._id}`}
                className="card block hover:border-primary-300 transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-slate-500 uppercase tracking-wide">
                        {request.queryType}
                      </span>
                      {request.status === 'pending' && (
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse-soft">
                          Needs Review
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-primary-500 transition-colors">
                      {request.dbInstanceName} / {request.collectionName}
                    </h3>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                      {request.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{request.developerName}</span>
                      </div>
                      {request.collectionName && request.collectionName !== 'unknown' && (
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" />
                          <span>{request.collectionName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Previous
              </button>
              <span className="text-slate-500 px-4">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700 mb-2">No requests found</h3>
          <p className="text-slate-500">
            {hasActiveFilters ? 'No requests match your filters' : filters.status === 'pending' ? 'No pending requests to review' : `No ${filters.status} requests found`}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamRequests;
