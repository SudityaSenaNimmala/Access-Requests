import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback = () => {
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      await checkAuth();
      navigate('/');
    };

    handleCallback();
  }, [checkAuth, navigate]);

  return <LoadingSpinner text="Completing sign in..." />;
};

export default AuthCallback;
