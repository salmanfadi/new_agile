
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [progressValue, setProgressValue] = useState(30);
  
  // Simulate progress while loading to improve UX
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgressValue((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);
  
  useEffect(() => {
    // Only redirect when we're sure about authentication state (not loading)
    if (!isLoading) {
      console.log("Auth state loaded:", { isAuthenticated, user });
      
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
        console.log("User not authenticated, redirecting to login");
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate, isLoading]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Agile Warehouse</h1>
        <div className="flex flex-col items-center gap-6">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <Progress value={progressValue} className="w-full h-2" />
          <div className="space-y-2">
            <p className="text-gray-600">Loading application...</p>
            <p className="text-sm text-gray-400">Verifying access credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
