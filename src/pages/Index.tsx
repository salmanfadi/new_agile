
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();
  
  useEffect(() => {
    // Only redirect when we're sure about authentication state (not loading)
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect based on user role
        switch (user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'warehouse_manager':
            navigate('/manager');
            break;
          case 'field_operator':
            navigate('/operator');
            break;
          default:
            navigate('/login');
        }
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate, isLoading]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md w-full px-4">
        <h1 className="text-2xl font-bold mb-6">Agile Warehouse</h1>
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <Progress value={30} className="w-full h-2" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
