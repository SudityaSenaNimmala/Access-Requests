import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await requestApi.getById(id);
      setRequest(response.data);
    } catch (error) {
      console.error('Fetch request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await requestApi.approve(id, comment);
      toast.success('Request approved and query executed!');
      fetchRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await requestApi.reject(id, comment);
      toast.success('Request rejected');
      setShowRejectModal(false);
      fetchRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
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

  const isWriteOperation = ['insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(request?.queryType);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!request) {
    return (
      <div className="card text-center py-16">
        <h2 className="text-xl font-medium text-slate-300 mb-2">Request not found</h2>
        <Link to="/lead/requests" className="text-primary-400 hover:text-primary-300">
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
          to="/lead/requests"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-100">Review Request</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-slate-400">From {request.developerName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Warning for write operations */}
        {isWriteOperation && request.status === 'pending' && (
          <div className="card bg-amber-500/10 border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-400 mb-1">Write Operation Warning</h3>
                <p className="text-sm text-amber-300/80">
                  This is a <strong>{request.queryType}</strong> operation that will modify data in the database.
                  Please review the query carefully before approving.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Developer Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Developer Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-400">Name</p>
                <p className="text-slate-200">{request.developerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-400">Submitted</p>
                <p className="text-slate-200">{formatDate(request.createdAt)}</p>
              </div>
            </div>
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
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Query Type</p>
                  <p className={`text-slate-200 capitalize ${isWriteOperation ? 'text-amber-400' : ''}`}>
                    {request.queryType}
                    {isWriteOperation && ' (Write)'}
                  </p>
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
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Query to Execute</h2>
          <QueryEditor value={request.query} readOnly height="250px" language="javascript" />
        </div>

        {/* Action Buttons for Pending Requests */}
        {request.status === 'pending' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Review Actions</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Comment (optional for approval, required for rejection)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="textarea"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn-success flex items-center justify-center gap-2 flex-1"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Approve & Execute
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="btn-danger flex items-center justify-center gap-2 flex-1"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Review Comment (if already reviewed) */}
        {request.reviewComment && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Review Comment</h2>
            <p className="text-slate-300">{request.reviewComment}</p>
          </div>
        )}

        {/* Results (if executed) */}
        {(request.result || request.error) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              {request.error ? 'Execution Error' : 'Query Results'}
            </h2>
            <ResultViewer result={request.result} error={request.error} />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-slide-up">
            <h3 className="text-xl font-semibold text-slate-200 mb-4">Reject Request</h3>
            <p className="text-slate-400 mb-4">
              Please provide a reason for rejecting this request. This will be shared with the developer.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reason for rejection..."
              className="textarea mb-4"
              rows={4}
              autoFocus
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !comment.trim()}
                className="btn-danger flex-1"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewRequest;
