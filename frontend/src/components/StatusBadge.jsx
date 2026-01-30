const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      className: 'badge-pending',
      label: 'Pending',
    },
    approved: {
      className: 'badge-approved',
      label: 'Approved',
    },
    executed: {
      className: 'badge-executed',
      label: 'Executed',
    },
    rejected: {
      className: 'badge-rejected',
      label: 'Rejected',
    },
    failed: {
      className: 'badge-failed',
      label: 'Failed',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
