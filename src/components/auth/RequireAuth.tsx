
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole, RequireAuthProps } from '@/types/auth';
import { Progress } from '@/components/ui/progress';

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  allowedRoles
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state but only briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md w-full px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <Progress value={45} className="w-full h-2" />
            <p className="mt-4 text-gray-600">Verifying access...</p>
          </div>
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
