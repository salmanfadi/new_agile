
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

interface RequireAuthProps {
  allowedRoles?: UserRole[];
  children: ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // If we're still loading, show nothing or a loading spinner
  if (isLoading) {
    return <div>Loading authentication status...</div>;
  }

  // If there is no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is provided, check if the user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // User is authenticated and authorized, render the children
  return <>{children}</>;
};
