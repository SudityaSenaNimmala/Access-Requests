import { Link, useNavigate } from 'react-router-dom';
import { Clock, Database, User, ArrowRight, Copy } from 'lucide-react';
import StatusBadge from './StatusBadge';

const RequestCard = ({ request, showDeveloper = false, linkTo, showCloneButton = false }) => {
  const navigate = useNavigate();
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClone = (e) => {
    e.preventDefault(); // Prevent card click navigation
    e.stopPropagation(); // Prevent event bubbling
    // Convert ObjectIds to strings
    const cloneData = {
      dbInstanceId: typeof request.dbInstanceId === 'string' ? request.dbInstanceId : request.dbInstanceId?._id || String(request.dbInstanceId),
      query: request.query,
      reason: request.reason,
      teamLeadId: typeof request.teamLeadId === 'string' ? request.teamLeadId : request.teamLeadId?._id || String(request.teamLeadId),
    };
    console.log('Clone data being sent:', cloneData);
    navigate('/developer/new-request', { state: { cloneData } });
  };

  return (
    <Link
      to={linkTo || `/developer/requests/${request._id}`}
      className="block bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-primary-300 hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={request.status} />
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {request.queryType}
            </span>
          </div>

          <h3 className="font-semibold text-slate-800 mb-2 truncate group-hover:text-primary-500 transition-colors">
            {request.dbInstanceName}
          </h3>

          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {request.reason}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {request.collectionName && request.collectionName !== 'unknown' && (
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>{request.collectionName}</span>
              </div>
            )}
            {showDeveloper && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{request.developerName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(request.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showCloneButton && (
            <button
              onClick={handleClone}
              className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
              title="Clone this request"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
};

export default RequestCard;
