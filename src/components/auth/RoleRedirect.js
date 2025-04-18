import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Component that redirects users based on their role
 * Used for paths like / or /login after authentication
 */
const RoleRedirect = () => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && userRole) {
      // Redirect based on role
      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'driver':
          navigate('/driver/dashboard');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    } else if (!loading && !currentUser) {
      // If not authenticated, go to homepage
      navigate('/');
    }
  }, [currentUser, userRole, loading, navigate]);

  // Show loading while determining where to redirect
  return <LoadingSpinner text="Redirecting..." />;
};

export default RoleRedirect;
