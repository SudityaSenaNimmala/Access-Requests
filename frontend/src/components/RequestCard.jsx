import { Link } from 'react-router-dom';
import { Clock, Database, User, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

const RequestCard = ({ request, showDeveloper = false, linkTo }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link
      to={linkTo || `/developer/requests/${request._id}`}
      className="block bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-primary-500/50 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={request.status} />
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {request.queryType}
            </span>
          </div>

          <h3 className="font-semibold text-slate-200 mb-2 truncate group-hover:text-primary-400 transition-colors">
            {request.dbInstanceName}
          </h3>

          <p className="text-sm text-slate-400 line-clamp-2 mb-4">
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

        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
};

export default RequestCard;
