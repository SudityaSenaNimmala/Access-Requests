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
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-red-400 font-medium">Error</h4>
          <button
            onClick={copyToClipboard}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap break-words">
          {error}
        </pre>
      </div>
    );
  }

  const isArray = Array.isArray(result);
  const itemCount = isArray ? result.length : 1;

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="font-medium">Results</span>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </button>
        <button
          onClick={copyToClipboard}
          className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-4 max-h-[500px] overflow-auto">
          <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ResultViewer;
