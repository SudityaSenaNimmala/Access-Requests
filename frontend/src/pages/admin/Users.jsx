import { useState, useEffect } from 'react';
import { userApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users as UsersIcon, Shield, UserCheck, UserX, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', teamLeadId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, leadsRes] = await Promise.all([
        userApi.getAll(),
        userApi.getTeamLeads(),
      ]);
      setUsers(usersRes.data.users);
      setTeamLeads(leadsRes.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      teamLeadId: user.teamLeadId?._id || '',
    });
  };

  const handleSaveRole = async () => {
    try {
      await userApi.updateRole(editingUser._id, editForm);
      toast.success('User role updated');
      setEditingUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userApi.toggleStatus(userId);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      team_lead: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      developer: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
    };
    const c = config[role] || config.developer;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">User Management</h1>
        <p className="text-slate-400 mt-1">Manage user roles and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card bg-purple-500/10 border-purple-500/30">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-slate-400">Admins</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {users.filter(u => u.role === 'team_lead').length}
              </p>
              <p className="text-sm text-slate-400">Team Leads</p>
            </div>
          </div>
        </div>
        <div className="card bg-slate-500/10 border-slate-500/30">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-2xl font-bold text-slate-300">
                {users.filter(u => u.role === 'developer').length}
              </p>
              <p className="text-sm text-slate-400">Developers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">User</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Role</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Team Lead</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-200">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-4 px-4 text-slate-400">
                    {user.teamLeadId?.name || '-'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isActive
                            ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200">Edit User Role</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-800/50 rounded-xl">
              {editingUser.avatar ? (
                <img
                  src={editingUser.avatar}
                  alt={editingUser.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {editingUser.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-slate-200">{editingUser.name}</p>
                <p className="text-sm text-slate-500">{editingUser.email}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="select"
                >
                  <option value="developer">Developer</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {editForm.role === 'developer' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Assign Team Lead</label>
                  <select
                    value={editForm.teamLeadId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, teamLeadId: e.target.value }))}
                    className="select"
                  >
                    <option value="">No team lead assigned</option>
                    {teamLeads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="btn-primary flex-1"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
