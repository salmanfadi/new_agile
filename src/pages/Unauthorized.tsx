
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PublicLayout } from '@/layouts/PublicLayout';

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
    <PublicLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-100 dark:border-slate-700 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Button onClick={() => navigate(getDashboardRoute())} className="w-full h-11">
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Unauthorized;
