import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Protected route component that handles authentication and role-based access
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Child components to render if authorized
 * @param {Array} props.allowedRoles - Array of roles that can access this route
 * @returns {JSX.Element} Rendered component or redirect
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }
  
  // If user is not logged in, redirect to login with return path
  if (!currentUser) {
    // For admin routes, redirect to admin login specifically
    if (allowedRoles.includes('admin') && location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    
    // For driver routes, redirect to driver login specifically
    if (allowedRoles.includes('driver') && location.pathname.startsWith('/driver')) {
      return <Navigate to="/driver/login" replace />;
    }
    
    // For regular user routes, redirect to standard login
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // If roles are specified but user doesn't have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // For admin routes, non-admin users should be redirected to their appropriate dashboard
    if (allowedRoles.includes('admin')) {
      return <Navigate to={`/${userRole}/dashboard`} replace />;
    }
    
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;
