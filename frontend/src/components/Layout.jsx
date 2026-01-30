import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Database,
  FileText,
  Users,
  Settings,
  LogOut,
  Home,
  CheckSquare,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isTeamLead } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, show: true },
    { name: 'New Request', href: '/developer/new-request', icon: FileText, show: !isAdmin() },
    { name: 'My Requests', href: '/developer/requests', icon: Database, show: !isAdmin() },
    { name: 'Team Requests', href: '/lead/requests', icon: CheckSquare, show: isTeamLead() && !isAdmin() },
    { name: 'All Requests', href: '/admin/requests', icon: FileText, show: isAdmin() },
    { name: 'Users', href: '/admin/users', icon: Users, show: isAdmin() },
    { name: 'DB Instances', href: '/admin/db-instances', icon: Settings, show: isAdmin() },
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow glass border-r border-slate-700/50">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">DB Access</h1>
              <p className="text-xs text-slate-400">Query Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-primary-500/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-2 px-4 mt-3 text-xs">
              {connected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">DB Access</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="px-4 py-4 border-t border-slate-700/50 animate-slide-down">
            <nav className="space-y-2">
              {navigation.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 mt-4 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-72">
        <div className="min-h-screen pt-16 lg:pt-0 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
