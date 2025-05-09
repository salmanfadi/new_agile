
import React from 'react';
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
  
  console.log("RequireAuth state:", { 
    isLoading, 
    isAuthenticated, 
    user, 
    allowedRoles,
    currentPath: location.pathname 
  });

  // Show loading state but make it more informative
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center gap-6">
            <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <Progress value={45} className="w-full h-2" />
            <div className="space-y-2">
              <p className="text-gray-600">Verifying access...</p>
              <p className="text-sm text-gray-400">This will only take a moment</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special case for admins - they always have access to all pages
  if (user?.role === 'admin') {
    console.log("Admin user, granting access");
    // Handle function children (render prop pattern)
    if (typeof children === 'function') {
      return children({ user });
    }
    return <>{children}</>;
  }
  
  // Special access rule for barcode management
  // Allow warehouse_manager to access barcode management
  if (location.pathname === '/admin/barcodes' && user?.role === 'warehouse_manager') {
    console.log("Warehouse manager accessing barcode management, granting access");
    if (typeof children === 'function') {
      return children({ user });
    }
    return <>{children}</>;
  }
  
  // Special access rule for product management
  // Allow warehouse_manager to access product management
  if (location.pathname === '/admin/products' && user?.role === 'warehouse_manager') {
    console.log("Warehouse manager accessing product management, granting access");
    if (typeof children === 'function') {
      return children({ user });
    }
    return <>{children}</>;
  }

  // Check if the user has the required role for the page
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("User role not in allowed roles, redirecting to unauthorized", {
      userRole: user.role,
      allowedRoles
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("Access granted to user", user);
  
  // Handle function children (render prop pattern)
  if (typeof children === 'function' && user) {
    return children({ user });
  }

  // Handle regular ReactNode children
  return <>{children}</>;
};
