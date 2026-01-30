import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Database, Shield, Zap, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      navigate('/');
    }

    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      toast.error('Authentication failed. Please try again.');
    }
  }, [user, navigate, searchParams]);

  const features = [
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Microsoft SSO ensures only authorized users can access the system',
    },
    {
      icon: Database,
      title: 'Query Execution',
      description: 'Run MongoDB queries without direct database access',
    },
    {
      icon: Users,
      title: 'Approval Workflow',
      description: 'Team leads review and approve queries before execution',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant notifications when your requests are processed',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">DB Access Tool</h1>
              <p className="text-slate-400">Secure Query Management</p>
            </div>
          </div>

          <p className="text-xl text-slate-300 mb-12 leading-relaxed">
            Request, approve, and execute database queries with a streamlined approval workflow.
            No more waiting for direct database access.
          </p>

          <div className="grid gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="card animate-fade-in">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">DB Access Tool</h1>
                <p className="text-xs text-slate-400">Secure Query Management</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome back</h2>
            <p className="text-slate-400 mb-8">Sign in with your Microsoft account to continue</p>

            <button
              onClick={login}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#2f2f2f] hover:bg-[#3b3b3b] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 border border-slate-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Sign in with Microsoft
            </button>

            <p className="text-xs text-slate-500 text-center mt-6">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
