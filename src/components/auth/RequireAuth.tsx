import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth";

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, session } = useAuth();
  const location = useLocation();

  // Add debug logging
  useEffect(() => {
    console.log('RequireAuth state:', {
      isLoading,
      isAuthenticated,
      user,
      session,
      currentPath: location.pathname
    });
  }, [isLoading, isAuthenticated, user, session, location]);

  // Show loading state while checking auth

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect if we're sure the user is not authenticated
  if (!isLoading && (!isAuthenticated || !user)) {
    console.log('Redirecting to login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role access
  if (!isLoading && allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('Unauthorized access attempt:', {
      userRole: user.role,
      allowedRoles,
      path: location.pathname
    });

    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
