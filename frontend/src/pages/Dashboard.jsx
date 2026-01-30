import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestApi } from '../services/api';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Users,
  Database,
  Settings,
} from 'lucide-react';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, isTeamLead, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    executed: 0,
    rejected: 0,
    failed: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (isAdmin()) {
        // Admin sees all requests stats
        const allRequestsRes = await requestApi.getAllRequests({ limit: 1000 });
        const allRequests = allRequestsRes.data.requests;
        
        setStats({
          pending: allRequests.filter(r => r.status === 'pending').length,
          executed: allRequests.filter(r => r.status === 'executed').length,
          rejected: allRequests.filter(r => r.status === 'rejected').length,
          failed: allRequests.filter(r => r.status === 'failed').length,
        });
        setRecentRequests(allRequests.slice(0, 5));
      } else {
        // Developers see their own requests
        const myRequestsRes = await requestApi.getMyRequests({ limit: 5 });
        setRecentRequests(myRequestsRes.data.requests);

        const allRequestsRes = await requestApi.getMyRequests({ limit: 1000 });
        const allRequests = allRequestsRes.data.requests;
        
        setStats({
          pending: allRequests.filter(r => r.status === 'pending').length,
          executed: allRequests.filter(r => r.status === 'executed').length,
          rejected: allRequests.filter(r => r.status === 'rejected').length,
          failed: allRequests.filter(r => r.status === 'failed').length,
        });

        // Fetch pending approvals for team leads
        if (isTeamLead()) {
          const teamRequestsRes = await requestApi.getTeamRequests({ status: 'pending', limit: 5 });
          setPendingApprovals(teamRequestsRes.data.requests);
        }
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Executed',
      value: stats.executed,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
  ];

  const adminQuickLinks = [
    { name: 'All Requests', href: '/admin/requests', icon: FileText, description: 'View all query requests' },
    { name: 'Manage Users', href: '/admin/users', icon: Users, description: 'Manage user roles' },
    { name: 'DB Instances', href: '/admin/db-instances', icon: Database, description: 'Configure databases' },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  // Admin Dashboard
  if (isAdmin()) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1">System overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`card ${stat.bgColor} border ${stat.borderColor} animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <Icon className={`w-10 h-10 ${stat.color} opacity-50`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="animate-slide-up delay-200">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {adminQuickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className="card hover:border-primary-500/50 transition-all group"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                      <Icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 group-hover:text-primary-400 transition-colors">
                        {link.name}
                      </h3>
                      <p className="text-sm text-slate-500">{link.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="animate-slide-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-200">Recent Requests</h2>
            <Link
              to="/admin/requests"
              className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentRequests.length > 0 ? (
            <div className="grid gap-4">
              {recentRequests.map((request) => (
                <RequestCard 
                  key={request._id} 
                  request={request} 
                  showDeveloper 
                  linkTo={`/admin/requests`}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No requests yet</h3>
              <p className="text-slate-500">No query requests have been submitted</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Developer/Team Lead Dashboard
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 mt-1">Here's an overview of your query requests</p>
        </div>
        <Link to="/developer/new-request" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`card ${stat.bgColor} border ${stat.borderColor} animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`w-10 h-10 ${stat.color} opacity-50`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Approvals for Team Leads */}
      {isTeamLead() && pendingApprovals.length > 0 && (
        <div className="animate-slide-up delay-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-200">Pending Approvals</h2>
            <Link
              to="/lead/requests"
              className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-4">
            {pendingApprovals.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                showDeveloper
                linkTo={`/lead/requests/${request._id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Requests */}
      <div className="animate-slide-up delay-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-200">Recent Requests</h2>
          <Link
            to="/developer/requests"
            className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentRequests.length > 0 ? (
          <div className="grid gap-4">
            {recentRequests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No requests yet</h3>
            <p className="text-slate-500 mb-6">Create your first query request to get started</p>
            <Link to="/developer/new-request" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Request
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
