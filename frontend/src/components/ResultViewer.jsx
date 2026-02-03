import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ResultViewer = ({ result, error }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const copyToClipboard = () => {
    const text = error || JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-red-600 font-medium">Error</h4>
          <button
            onClick={copyToClipboard}
            className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <pre className="text-red-700 text-sm font-mono whitespace-pre-wrap break-words">
          {error}
        </pre>
      </div>
    );
  }

  const isArray = Array.isArray(result);
  const isPrimitive = typeof result === 'number' || typeof result === 'string' || typeof result === 'boolean';
  const itemCount = isArray ? result.length : 1;

  // For primitive values (like count results), show a simpler display
  if (isPrimitive) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700">Result:</span>
            <span className="text-2xl font-bold text-primary-600">{String(result)}</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="font-medium">Results</span>
          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </button>
        <button
          onClick={copyToClipboard}
          className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-4 max-h-[500px] overflow-auto">
          <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ResultViewer;
