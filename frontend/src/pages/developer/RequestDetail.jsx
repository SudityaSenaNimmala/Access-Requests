import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QueryEditor from '../../components/QueryEditor';
import ResultViewer from '../../components/ResultViewer';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Database,
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit3,
} from 'lucide-react';

const RequestDetail = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await requestApi.getById(id);
      setRequest(response.data);
      setEditedQuery(response.data.query);
    } catch (err) {
      console.error('Fetch request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!editedQuery.trim()) {
      setError('Query is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await requestApi.resubmit(id, editedQuery);
      setRequest(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resubmit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedQuery(request.query);
    setError('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!request) {
    return (
      <div className="card text-center py-16">
        <h2 className="text-xl font-medium text-slate-300 mb-2">Request not found</h2>
        <Link to="/developer/requests" className="text-primary-400 hover:text-primary-300">
          Back to requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/developer/requests"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-100">{request.dbInstanceName}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-slate-400">Request ID: {request._id}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Timeline */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Status</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Submitted</p>
                <p className="text-xs text-slate-500">{formatDate(request.createdAt)}</p>
              </div>
            </div>

            <div className="flex-1 h-0.5 bg-slate-700" />

            {request.reviewedAt && (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    request.status === 'rejected' ? 'bg-red-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {request.status === 'rejected' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      {request.status === 'rejected' ? 'Rejected' : 'Approved'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(request.reviewedAt)}</p>
                  </div>
                </div>

                {request.executedAt && (
                  <>
                    <div className="flex-1 h-0.5 bg-slate-700" />
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        request.status === 'failed' ? 'bg-orange-500/20' : 'bg-emerald-500/20'
                      }`}>
                        {request.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Database className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          {request.status === 'failed' ? 'Failed' : 'Executed'}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(request.executedAt)}</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Request Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Database</p>
                  <p className="text-slate-200">{request.dbInstanceName}</p>
                </div>
              </div>
              {request.collectionName && request.collectionName !== 'unknown' && (
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Collection</p>
                  <p className="text-slate-200">{request.collectionName}</p>
                </div>
              </div>
            )}
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Query Type</p>
                  <p className="text-slate-200 capitalize">{request.queryType}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Team Lead</p>
                  <p className="text-slate-200">{request.teamLeadName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Reason</p>
                  <p className="text-slate-200">{request.reason}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Query */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Query</h2>
            {request.status === 'failed' && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Query
              </button>
            )}
          </div>
          
          {isEditing ? (
            <>
              <QueryEditor 
                value={editedQuery} 
                onChange={setEditedQuery}
                readOnly={false} 
                height="200px" 
                language="javascript" 
              />
              
              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleResubmit}
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Resubmitting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resubmit Request
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <QueryEditor value={request.query} readOnly height="200px" language="javascript" />
          )}
        </div>

        {/* Review Comment */}
        {request.reviewComment && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Review Comment</h2>
            <p className="text-slate-300">{request.reviewComment}</p>
          </div>
        )}

        {/* Results */}
        {(request.result || request.error) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              {request.error ? 'Error' : 'Query Results'}
            </h2>
            <ResultViewer result={request.result} error={request.error} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;
