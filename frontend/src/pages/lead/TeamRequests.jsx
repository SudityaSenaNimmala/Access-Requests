import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, Filter, Clock, Database, User, ArrowRight } from 'lucide-react';

const TeamRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
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

      const response = await requestApi.getTeamRequests(params);
      setRequests(response.data.requests);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filters = [
    { value: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { value: 'all', label: 'All' },
    { value: 'executed', label: 'Executed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Team Requests</h1>
          <p className="text-slate-400 mt-1">Review and approve query requests from your team</p>
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
          <div className="space-y-4">
            {requests.map((request, index) => (
              <Link
                key={request._id}
                to={`/lead/requests/${request._id}`}
                className="card block hover:border-primary-500/50 transition-all duration-300 group animate-slide-up"
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
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse-soft">
                          Needs Review
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-200 mb-2 group-hover:text-primary-400 transition-colors">
                      {request.dbInstanceName} / {request.collectionName}
                    </h3>

                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
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

                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
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
            {filter === 'pending'
              ? 'No pending requests to review'
              : `No ${filter} requests found`}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamRequests;
