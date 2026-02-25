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
  Bell,
  BellOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { requestApi } from '../services/api';
import notificationService from '../services/notificationService';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isTeamLead } = useAuth();
  const { connected, socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unseenCounts, setUnseenCounts] = useState({ executed: 0, rejected: 0, failed: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationService.isEnabled());

  // Request notification permission on mount if not already granted
  useEffect(() => {
    if (notificationService.permission === 'default' && notificationService.enabled) {
      // Auto-request permission after a short delay
      const timer = setTimeout(() => {
        notificationService.requestPermission().then(granted => {
          setNotificationsEnabled(notificationService.isEnabled());
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch pending count for team leads
  useEffect(() => {
    if (isTeamLead() && !isAdmin()) {
      fetchPendingCount();
    }
  }, [location.pathname]);

  // Fetch unseen counts for developers on every route change
  useEffect(() => {
    fetchUnseenCounts();
  }, [location.pathname]);

  // Update counts via socket and trigger notifications
  useEffect(() => {
    if (!socket) return;
    
    socket.on('new_request', (data) => {
      if (isTeamLead() && !isAdmin()) {
        fetchPendingCount();
        // Notify team lead of new request
        if (data?.request && notificationsEnabled) {
          notificationService.notifyNewRequest(data.request);
        }
      }
    });
    
    socket.on('request_updated', (data) => {
      if (isTeamLead() && !isAdmin()) fetchPendingCount();
      fetchUnseenCounts();
      
      // Notify developer of status change
      if (data?.request && data.request.developerId === user?._id && notificationsEnabled) {
        const status = data.request.status;
        if (status === 'executed' || status === 'approved') {
          notificationService.notifyRequestApproved(data.request);
        } else if (status === 'rejected') {
          notificationService.notifyRequestRejected(data.request);
        } else if (status === 'failed') {
          notificationService.notifyRequestFailed(data.request);
        }
      }
    });
    
    return () => {
      socket.off('new_request');
      socket.off('request_updated');
    };
  }, [socket, notificationsEnabled, user]);

  const fetchPendingCount = async () => {
    try {
      const res = await requestApi.getTeamRequests({ status: 'pending', limit: 1 });
      setPendingCount(res.data.pagination?.total || 0);
    } catch (e) {}
  };

  const fetchUnseenCounts = async () => {
    try {
      const res = await requestApi.getUnseenCounts();
      setUnseenCounts(res.data);
    } catch (e) {}
  };

  // Update browser tab title with total notification count
  useEffect(() => {
    const unseenTotal = (unseenCounts.executed || 0) + (unseenCounts.rejected || 0) + (unseenCounts.failed || 0);
    const total = unseenTotal + (pendingCount || 0);
    document.title = total > 0 ? `(${total > 99 ? '99+' : total}) DB Access` : 'DB Access';
  }, [unseenCounts, pendingCount]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, show: true },
    { name: 'New Request', href: '/developer/new-request', icon: FileText, show: !isAdmin() },
    {
      name: 'My Requests',
      href: '/developer/requests',
      icon: Database,
      show: !isAdmin(),
      unseenBadges: unseenCounts,
    },
    { name: 'Team Requests', href: '/lead/requests', icon: CheckSquare, show: isTeamLead() && !isAdmin(), badge: pendingCount },
    { name: 'All Requests', href: '/admin/requests', icon: FileText, show: isAdmin() },
    { name: 'Users', href: '/admin/users', icon: Users, show: isAdmin() },
    { name: 'DB Instances', href: '/admin/db-instances', icon: Settings, show: isAdmin() },
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-primary-500">DB Access</h1>
              <p className="text-xs text-slate-500">Query Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const ub = item.unseenBadges;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-500 border border-primary-200'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{item.name}</span>
                  {ub && (
                    <span className="flex items-center gap-1">
                      {ub.executed > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {ub.executed > 99 ? '99+' : ub.executed}
                        </span>
                      )}
                      {ub.rejected > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {ub.rejected > 99 ? '99+' : ub.rejected}
                        </span>
                      )}
                      {ub.failed > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {ub.failed > 99 ? '99+' : ub.failed}
                        </span>
                      )}
                    </span>
                  )}
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-primary-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            {/* Connection and Notifications status */}
            <div className="flex items-center justify-between px-4 mt-3 text-xs relative">
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400">Disconnected</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // If permission not granted yet, request it
                  if (notificationService.permission !== 'granted') {
                    const granted = await notificationService.requestPermission();
                    if (granted) {
                      notificationService.enabled = true;
                      localStorage.setItem('notificationsEnabled', 'true');
                    }
                    setNotificationsEnabled(notificationService.isEnabled());
                  } else {
                    // Toggle on/off
                    const newState = notificationService.toggle();
                    setNotificationsEnabled(newState);
                  }
                }}
                className="relative p-1.5 cursor-pointer bg-transparent border-0"
                title={
                  notificationService.permission !== 'granted' 
                    ? 'Click to enable notifications' 
                    : notificationsEnabled 
                      ? 'Click to disable notifications' 
                      : 'Click to enable notifications'
                }
              >
                {notificationsEnabled ? (
                  <Bell 
                    className="w-4 h-4 text-emerald-500 transition-all duration-300" 
                    style={{ filter: 'none' }}
                    onMouseEnter={(e) => {
                      // Show red glow when enabled (will disable on click)
                      e.currentTarget.style.filter = 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 12px rgba(239, 68, 68, 0.3)) drop-shadow(0 0 18px rgba(239, 68, 68, 0.15))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none';
                    }}
                  />
                ) : (
                  <BellOff 
                    className="w-4 h-4 text-slate-400 transition-all duration-300" 
                    style={{ filter: 'none' }}
                    onMouseEnter={(e) => {
                      // Show green glow when disabled (will enable on click)
                      e.currentTarget.style.filter = 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.6)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.3)) drop-shadow(0 0 18px rgba(16, 185, 129, 0.15))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none';
                    }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-primary-500">DB Access</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="px-4 py-4 border-t border-slate-200 animate-slide-down bg-white">
            <nav className="space-y-2">
              {navigation.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                const ub = item.unseenBadges;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-500'
                        : 'text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {ub && (
                      <span className="flex items-center gap-1">
                        {ub.executed > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {ub.executed > 99 ? '99+' : ub.executed}
                          </span>
                        )}
                        {ub.rejected > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {ub.rejected > 99 ? '99+' : ub.rejected}
                          </span>
                        )}
                        {ub.failed > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {ub.failed > 99 ? '99+' : ub.failed}
                          </span>
                        )}
                      </span>
                    )}
                    {item.badge > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 mt-4 w-full text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 bg-slate-50">
        <div className="min-h-screen pt-16 lg:pt-0 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
