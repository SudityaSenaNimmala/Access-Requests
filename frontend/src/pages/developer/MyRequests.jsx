import { useState, useEffect } from 'react';
import { requestApi, dbInstanceApi } from '../../services/api';
import RequestCard from '../../components/RequestCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, Filter, X } from 'lucide-react';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbInstances, setDbInstances] = useState([]);
  const [collections, setCollections] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    dbInstanceId: '',
    collectionName: '',
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
    requestApi.getDeveloperFilterOptions().then(res => {
      console.log('Filter options:', res.data);
      setCollections(res.data.collections || []);
    }).catch((err) => console.error('Filter options error:', err));
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
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await requestApi.getMyRequests(params);
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
    setFilters({ status: 'all', dbInstanceId: '', collectionName: '', dateFrom: '', dateTo: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.status !== 'all' || filters.dbInstanceId || filters.collectionName || filters.dateFrom || filters.dateTo;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'executed', label: 'Executed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Requests</h1>
          <p className="text-slate-500 mt-1">View and track your query requests</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard key={request._id} request={request} showCloneButton={true} />
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
            {hasActiveFilters ? 'No requests match your filters' : "You haven't submitted any requests yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
