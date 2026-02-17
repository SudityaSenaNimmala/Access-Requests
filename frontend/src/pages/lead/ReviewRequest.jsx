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
  const [showApproveModal, setShowApproveModal] = useState(false);

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
      const response = await requestApi.approve(id, comment);
      // Update state immediately with the response (includes execution results)
      setRequest(response.data);
      if (response.data.status === 'executed') {
        toast.success('Request approved and query executed successfully!');
      } else if (response.data.status === 'failed') {
        toast.error('Request approved but query execution failed');
      }
      setShowApproveModal(false);
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
        <h2 className="text-xl font-medium text-slate-700 mb-2">Request not found</h2>
        <Link to="/lead/requests" className="text-primary-500 hover:text-primary-600">
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
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">Review Request</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-slate-500">From {request.developerName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Warning for write operations */}
        {isWriteOperation && request.status === 'pending' && (
          <div className="card bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Write Operation Warning</h3>
                <p className="text-sm text-amber-600">
                  This is a <strong>{request.queryType}</strong> operation that will modify data in the database.
                  Please review the query carefully before approving.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Developer Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Developer Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="text-slate-800">{request.developerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="text-slate-800">{formatDate(request.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Request Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Database</p>
                  <p className="text-slate-800">{request.dbInstanceName}</p>
                </div>
              </div>
              {request.collectionName && request.collectionName !== 'unknown' && (
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Collection</p>
                  <p className="text-slate-800">{request.collectionName}</p>
                </div>
              </div>
            )}
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Query Type</p>
                  <p className={`text-slate-800 capitalize ${isWriteOperation ? 'text-amber-600' : ''}`}>
                    {request.queryType}
                    {isWriteOperation && ' (Write)'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Reason</p>
                  <p className="text-slate-800">{request.reason}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Query */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Query to Execute</h2>
          <QueryEditor value={request.query} readOnly height="250px" language="javascript" />
        </div>

        {/* Action Buttons for Pending Requests */}
        {request.status === 'pending' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Review Actions</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-slate-500 mb-2">
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
                onClick={() => setShowApproveModal(true)}
                disabled={actionLoading}
                className="btn-success flex items-center justify-center gap-2 flex-1"
              >
                <CheckCircle className="w-5 h-5" />
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
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Review Comment</h2>
            <p className="text-slate-600">{request.reviewComment}</p>
          </div>
        )}

        {/* Results (if executed) */}
        {((request.result !== undefined && request.result !== null) || request.error) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {request.error ? 'Execution Error' : 'Query Results'}
            </h2>
            <ResultViewer result={request.result} error={request.error} />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-slide-up p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Reject Request</h3>
            <p className="text-slate-500 mb-4">
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

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full animate-slide-up p-6">
            {/* Header with Warning Icon */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl ${isWriteOperation ? 'bg-amber-100' : 'bg-blue-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${isWriteOperation ? 'text-amber-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800 mb-1">
                  Confirm Query Execution
                </h3>
                <p className="text-sm text-slate-500">
                  Please review the details before approving
                </p>
              </div>
            </div>

            {/* Request Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500">Developer:</span>
                <span className="text-sm font-medium text-slate-800">{request.developerName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500">Database:</span>
                <span className="text-sm font-medium text-slate-800">{request.dbInstanceName}</span>
              </div>
              {request.collectionName && request.collectionName !== 'unknown' && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-slate-500">Collection:</span>
                  <span className="text-sm font-medium text-slate-800">{request.collectionName}</span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500">Query Type:</span>
                <span className={`text-sm font-medium ${isWriteOperation ? 'text-amber-600' : 'text-slate-800'}`}>
                  {request.queryType} {isWriteOperation && '(Write)'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-500 block mb-1">Reason:</span>
                <span className="text-sm text-slate-800">{request.reason}</span>
              </div>
            </div>

            {/* Warning Message */}
            <div className={`rounded-xl p-4 mb-6 ${isWriteOperation ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isWriteOperation ? 'text-amber-600' : 'text-blue-600'}`} />
                <div>
                  <p className={`text-sm font-medium mb-1 ${isWriteOperation ? 'text-amber-800' : 'text-blue-800'}`}>
                    {isWriteOperation ? 'This will modify data in the database!' : 'This will execute a query on the database'}
                  </p>
                  <p className={`text-sm ${isWriteOperation ? 'text-amber-700' : 'text-blue-700'}`}>
                    {isWriteOperation 
                      ? 'The query will immediately execute and change database records. This action cannot be undone.'
                      : 'The query will be executed and results will be shown to the developer.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Query Preview */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Query:</label>
              <div className="bg-slate-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
                  {request.query}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
                className="btn-secondary flex-1"
              >
                Check Request Again
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isWriteOperation 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {actionLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Approve & Execute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewRequest;
