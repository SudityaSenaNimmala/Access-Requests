import { useState, useEffect } from 'react';
import { requestApi } from '../../services/api';
import RequestCard from '../../components/RequestCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, Filter } from 'lucide-react';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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

      const response = await requestApi.getMyRequests(params);
      setRequests(response.data.requests);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'executed', label: 'Executed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">My Requests</h1>
          <p className="text-slate-400 mt-1">View and track your query requests</p>
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

      {loading ? (
        <LoadingSpinner />
      ) : requests.length > 0 ? (
        <>
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Previous
              </button>
              <span className="text-slate-400 px-4">
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
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No requests found</h3>
          <p className="text-slate-500">
            {filter === 'all'
              ? "You haven't submitted any requests yet"
              : `No ${filter} requests found`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
