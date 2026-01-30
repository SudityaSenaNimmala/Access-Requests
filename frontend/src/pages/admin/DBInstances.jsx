import { useState, useEffect } from 'react';
import { dbInstanceApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  TestTube,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DBInstances = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    connectionString: '',
    database: '',
    description: '',
  });

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await dbInstanceApi.getAll();
      setInstances(response.data);
    } catch (error) {
      toast.error('Failed to load DB instances');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      connectionString: '',
      database: '',
      description: '',
    });
    setEditingInstance(null);
    setTestResult(null);
  };

  const handleOpenModal = (instance = null) => {
    if (instance) {
      setEditingInstance(instance);
      setFormData({
        name: instance.name,
        connectionString: '', // Don't show encrypted string
        database: instance.database,
        description: instance.description || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleTestConnection = async () => {
    if (!formData.connectionString || !formData.database) {
      toast.error('Please enter connection string and database name');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await dbInstanceApi.testConnection({
        connectionString: formData.connectionString,
        database: formData.database,
      });
      setTestResult(response.data);
      toast.success('Connection successful!');
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || 'Connection failed',
      });
      toast.error('Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.database) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For new instances, connection string is required
    if (!editingInstance && !formData.connectionString) {
      toast.error('Connection string is required');
      return;
    }

    try {
      if (editingInstance) {
        const updateData = { ...formData };
        if (!updateData.connectionString) {
          delete updateData.connectionString; // Don't update if not provided
        }
        await dbInstanceApi.update(editingInstance._id, updateData);
        toast.success('DB instance updated');
      } else {
        await dbInstanceApi.create(formData);
        toast.success('DB instance created');
      }
      handleCloseModal();
      fetchInstances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleActive = async (instance) => {
    try {
      await dbInstanceApi.update(instance._id, { isActive: !instance.isActive });
      toast.success(`DB instance ${instance.isActive ? 'deactivated' : 'activated'}`);
      fetchInstances();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (instance) => {
    if (!confirm(`Are you sure you want to delete "${instance.name}"?`)) {
      return;
    }

    try {
      await dbInstanceApi.delete(instance._id);
      toast.success('DB instance deleted');
      fetchInstances();
    } catch (error) {
      toast.error('Failed to delete instance');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">DB Instances</h1>
          <p className="text-slate-400 mt-1">Manage database connections</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus className="w-5 h-5" />
          Add Instance
        </button>
      </div>

      {/* Instances Grid */}
      {instances.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance, index) => (
            <div
              key={instance._id}
              className="card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    instance.isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{instance.name}</h3>
                    <p className="text-sm text-slate-500">{instance.database}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  instance.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {instance.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {instance.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {instance.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleOpenModal(instance)}
                  className="flex-1 py-2 text-sm text-slate-400 hover:text-primary-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(instance)}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    instance.isActive
                      ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {instance.isActive ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enable
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(instance)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">No DB instances</h3>
          <p className="text-slate-500 mb-6">Add your first database connection to get started</p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Instance
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200">
                {editingInstance ? 'Edit DB Instance' : 'Add DB Instance'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production DB"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Connection String {!editingInstance && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.connectionString}
                  onChange={(e) => setFormData(prev => ({ ...prev, connectionString: e.target.value }))}
                  placeholder={editingInstance ? 'Leave empty to keep current' : 'mongodb://...'}
                  className="input font-mono text-sm"
                  required={!editingInstance}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Connection string will be encrypted before storage
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Database Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.database}
                  onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value }))}
                  placeholder="e.g., myapp_production"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  className="textarea"
                  rows={3}
                />
              </div>

              {/* Test Connection */}
              <div className="pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.connectionString}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    testResult.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    {testResult.success ? (
                      <div>
                        <p className="text-emerald-400 font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Connection successful!
                        </p>
                        {testResult.collections && (
                          <p className="text-sm text-slate-400 mt-1">
                            Found {testResult.collections.length} collections
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {testResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingInstance ? 'Save Changes' : 'Create Instance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DBInstances;
