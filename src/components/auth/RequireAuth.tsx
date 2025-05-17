
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page or another appropriate route
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
