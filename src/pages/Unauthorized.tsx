
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Auto-redirect admins to their dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);
  
  // Determine correct dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'warehouse_manager':
        return '/manager';
      case 'field_operator':
        return '/field';
      case 'sales_operator':
        return '/sales';
      default:
        return '/';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full dark:bg-red-900/20 mb-4">
            <Shield className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => navigate(getDashboardRoute())}
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
