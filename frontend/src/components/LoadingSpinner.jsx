const LoadingSpinner = ({ size = 'lg', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
      </div>
      {text && <p className="text-slate-400 animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
