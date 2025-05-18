
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Add a small timeout to ensure smooth transition
    const redirectTimer = setTimeout(() => {
      if (isAuthenticated && user && !isLoading) {
        // Redirect to appropriate dashboard based on user role
        let targetRoute = '/';
        if (user.role === 'admin') targetRoute = '/admin';
        else if (user.role === 'warehouse_manager') targetRoute = '/manager';
        else if (user.role === 'field_operator') targetRoute = '/field';
        else if (user.role === 'sales_operator') targetRoute = '/sales';
        else if (user.role === 'customer') targetRoute = '/customer/portal';
        
        navigate(targetRoute, { replace: true });
      } else if (!isLoading && !isAuthenticated) {
        // If not authenticated and not loading, redirect to login
        navigate('/login', { replace: true });
      }
    }, 100); // Short timeout for smoother experience
    
    return () => clearTimeout(redirectTimer);
  }, [isAuthenticated, user, isLoading, navigate]);
  
  // Show simple loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="h-12 w-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Redirecting...</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we navigate you to the right page</p>
      </div>
    </div>
  );
};

export default Index;
