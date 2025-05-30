import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth";

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { 
      isAuthenticated, 
      user: { 
        id: user?.id, 
        email: user?.email,
        role: user?.role,
        active: user?.active 
      },
      currentPath: location.pathname,
      search: location.search,
      allowedRoles,
      hasRequiredRole: user ? allowedRoles.includes(user.role) : false
    });
  }, [isAuthenticated, user, location, allowedRoles]);

  // Development bypass for barcodes route - remove in production
  if (process.env.NODE_ENV === 'development' && location.pathname.includes('barcodes')) {
    console.warn('Bypassing auth for barcodes route in development mode');
    return <>{children}</>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('User role not allowed:', user.role, 'Allowed roles:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
