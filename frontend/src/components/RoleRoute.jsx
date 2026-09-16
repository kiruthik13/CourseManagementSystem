import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROLE_REDIRECTS } from '../utils/constants';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their proper dashboard
    const fallbackPath = ROLE_REDIRECTS[user.role] || '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleRoute;
