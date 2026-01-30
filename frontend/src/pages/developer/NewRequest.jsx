import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestApi, userApi, dbInstanceApi } from '../../services/api';
import QueryEditor from '../../components/QueryEditor';
import { Send, Database, User, FileText, Code } from 'lucide-react';
import toast from 'react-hot-toast';

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dbInstances, setDbInstances] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);

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
    try {
      const response = await requestApi.create(formData);
      toast.success('Request submitted successfully!');
      navigate(`/developer/requests/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">New Query Request</h1>
        <p className="text-slate-400 mt-1">Submit a query for team lead approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Developer Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Developer Information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Name</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="input bg-slate-800/80 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="input bg-slate-800/80 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Database Selection */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Database Instance</h2>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Select Database <span className="text-red-400">*</span>
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
              <p className="text-xs text-amber-400 mt-2">
                No database instances available. Please contact an admin to add one.
              </p>
            )}
          </div>
        </div>

        {/* Query Details */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">MongoDB Query</h2>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Query <span className="text-red-400">*</span>
            </label>
            <QueryEditor
              value={formData.query}
              onChange={(value) => setFormData(prev => ({ ...prev, query: value }))}
              height="300px"
              language="javascript"
            />
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">
                <strong className="text-slate-300">Write your query as you would in MongoDB shell:</strong>
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• <code className="text-primary-400">db.users.find({'{ status: "active" }'})</code></li>
                <li>• <code className="text-primary-400">db.orders.aggregate([{'{ $match: {} }'}])</code></li>
                <li>• <code className="text-primary-400">db.products.countDocuments()</code></li>
                <li>• <code className="text-primary-400">db.logs.deleteMany({'{ createdAt: { $lt: new Date("2024-01-01") } }'})</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reason & Approval */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Request Details</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">
              Reason for Access <span className="text-red-400">*</span>
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
            <label className="block text-sm text-slate-400 mb-2">
              Team Lead <span className="text-red-400">*</span>
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
