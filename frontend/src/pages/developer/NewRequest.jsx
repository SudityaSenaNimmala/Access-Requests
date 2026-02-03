import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestApi, userApi, dbInstanceApi } from '../../services/api';
import QueryEditor from '../../components/QueryEditor';
import ResultViewer from '../../components/ResultViewer';
import { Send, Database, User, FileText, Code, Zap, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dbInstances, setDbInstances] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [autoExecuteResult, setAutoExecuteResult] = useState(null);

  const [formData, setFormData] = useState({
    dbInstanceId: '',
    query: '// Write your MongoDB query here\n// Examples:\n// db.users.find({ status: "active" }).limit(10)\n// db.orders.aggregate([{ $match: { status: "pending" } }])\n// db.products.countDocuments({ category: "electronics" })\n',
    reason: '',
    teamLeadId: '',
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [dbRes, leadsRes] = await Promise.all([
        dbInstanceApi.getAll({ activeOnly: 'true' }),
        userApi.getTeamLeads(),
      ]);
      console.log('DB Instances loaded:', dbRes.data);
      setDbInstances(dbRes.data);
      setTeamLeads(leadsRes.data);

      // Set default team lead if user has one assigned
      if (user?.teamLeadId) {
        setFormData(prev => ({ ...prev, teamLeadId: user.teamLeadId._id || user.teamLeadId }));
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    if (!formData.dbInstanceId || !formData.reason || !formData.teamLeadId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setAutoExecuteResult(null);
    try {
      const response = await requestApi.create(formData);
      
      // Check if this was an auto-executed read query
      if (response.data.autoExecuted) {
        const result = response.data;
        setAutoExecuteResult({
          requestId: result._id,
          status: result.status,
          result: result.result,
          error: result.error,
          executionResult: result.executionResult,
        });
        
        if (result.status === 'executed') {
          toast.success('Read query executed automatically!');
        } else {
          toast.error('Query execution failed');
        }
      } else {
        toast.success('Request submitted for approval!');
        navigate(`/developer/requests/${response.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Reset auto-execute result when starting a new query
  const handleNewQuery = () => {
    setAutoExecuteResult(null);
    setFormData(prev => ({
      ...prev,
      query: '// Write your MongoDB query here\n// Examples:\n// db.users.find({ status: "active" }).limit(10)\n// db.orders.aggregate([{ $match: { status: "pending" } }])\n// db.products.countDocuments({ category: "electronics" })\n',
    }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">New Query Request</h1>
        <p className="text-slate-500 mt-1">
          Submit a query for team lead approval
          <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" />
            Read queries execute instantly
          </span>
        </p>
      </div>

      {/* Auto-Execute Result Display */}
      {autoExecuteResult && (
        <div className="mb-6 card border-2 border-primary-200 bg-primary-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {autoExecuteResult.status === 'executed' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h3 className="font-semibold text-slate-800">
                  {autoExecuteResult.status === 'executed' 
                    ? 'Query Executed Successfully' 
                    : 'Query Execution Failed'}
                </h3>
                <p className="text-sm text-slate-500">
                  Read query was auto-executed without approval
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/developer/requests/${autoExecuteResult.requestId}`)}
                className="btn-secondary text-sm"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={handleNewQuery}
                className="btn-primary text-sm"
              >
                New Query
              </button>
            </div>
          </div>
          
          {autoExecuteResult.status === 'executed' && autoExecuteResult.result && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Query Results:</h4>
              <ResultViewer result={autoExecuteResult.result} />
            </div>
          )}
          
          {autoExecuteResult.status === 'failed' && autoExecuteResult.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-700 mb-1">Error:</h4>
              <p className="text-sm text-red-600 font-mono">{autoExecuteResult.error}</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Developer Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-slate-800">Developer Information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">Name</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="input bg-slate-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="input bg-slate-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Database Selection */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-slate-800">Database Instance</h2>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-2">
              Select Database <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.dbInstanceId}
              onChange={(e) => setFormData(prev => ({ ...prev, dbInstanceId: e.target.value }))}
              className="select"
              required
            >
              <option value="">Select database...</option>
              {dbInstances.map((db) => (
                <option key={db._id} value={db._id}>
                  {db.name} ({db.database})
                </option>
              ))}
            </select>
            {dbInstances.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                No database instances available. Please contact an admin to add one.
              </p>
            )}
          </div>
        </div>

        {/* Query Details */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-slate-800">MongoDB Query</h2>
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-2">
              Query <span className="text-red-500">*</span>
            </label>
            <QueryEditor
              value={formData.query}
              onChange={(value) => setFormData(prev => ({ ...prev, query: value }))}
              height="300px"
              language="javascript"
            />
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-2">
                <strong className="text-slate-700">Write your query as you would in MongoDB shell:</strong>
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• <code className="text-primary-500">db.users.find({'{ status: "active" }'})</code></li>
                <li>• <code className="text-primary-500">db.orders.aggregate([{'{ $match: {} }'}])</code></li>
                <li>• <code className="text-primary-500">db.products.countDocuments()</code></li>
                <li>• <code className="text-primary-500">db.logs.deleteMany({'{ createdAt: { $lt: new Date("2024-01-01") } }'})</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reason & Approval */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-slate-800">Request Details</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-500 mb-2">
              Reason for Access <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Explain why you need to run this query..."
              className="textarea"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-2">
              Team Lead <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.teamLeadId}
              onChange={(e) => setFormData(prev => ({ ...prev, teamLeadId: e.target.value }))}
              className="select"
              required
            >
              <option value="">Select team lead...</option>
              {teamLeads.map((lead) => (
                <option key={lead._id} value={lead._id}>
                  {lead.name} ({lead.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
