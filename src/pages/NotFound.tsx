
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Redirect to the appropriate homepage based on user role
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'warehouse_manager') {
        navigate('/manager');
      } else if (user.role === 'field_operator') {
        navigate('/field');
      } else if (user.role === 'sales_operator') {
        navigate('/sales');
      } else if (user.role === 'customer') {
        navigate('/customer/portal');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
        <h1 className="text-5xl font-bold mb-6 text-red-500">404</h1>
        <PageHeader 
          title="Page not found" 
          description="The page you're looking for doesn't exist or has been moved" 
        />
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            variant="outline" 
            className="flex-1 gap-2" 
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={handleGoHome}
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
