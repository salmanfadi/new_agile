
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole, RequireAuthProps } from '@/types/auth';

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  allowedRoles
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special case for admins - they always have access to all pages
  if (user?.role === 'admin') {
    // Handle function children (render prop pattern)
    if (typeof children === 'function') {
      return children({ user });
    }
    return <>{children}</>;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Handle function children (render prop pattern)
  if (typeof children === 'function' && user) {
    return children({ user });
  }

  // Handle regular ReactNode children
  return <>{children}</>;
};
