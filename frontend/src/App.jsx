import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/developer/NewRequest';
import MyRequests from './pages/developer/MyRequests';
import RequestDetail from './pages/developer/RequestDetail';
import TeamRequests from './pages/lead/TeamRequests';
import ReviewRequest from './pages/lead/ReviewRequest';
import Users from './pages/admin/Users';
import DBInstances from './pages/admin/DBInstances';
import AllRequests from './pages/admin/AllRequests';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Developer routes */}
      <Route
        path="/developer/new-request"
        element={
          <ProtectedRoute>
            <Layout>
              <NewRequest />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/requests"
        element={
          <ProtectedRoute>
            <Layout>
              <MyRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/requests/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Team Lead routes */}
      <Route
        path="/lead/requests"
        element={
          <ProtectedRoute roles={['team_lead', 'admin']}>
            <Layout>
              <TeamRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lead/requests/:id"
        element={
          <ProtectedRoute roles={['team_lead', 'admin']}>
            <Layout>
              <ReviewRequest />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AllRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/db-instances"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <DBInstances />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
