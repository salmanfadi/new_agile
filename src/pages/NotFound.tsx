
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowLeft, Home, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Display a toast notification when a 404 error occurs
    toast({
      variant: "destructive",
      title: "Page Not Found",
      description: `The page ${location.pathname} does not exist.`
    });
  }, [location.pathname]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Redirect to the appropriate homepage based on user role
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'warehouse_manager') {
        navigate('/manager', { replace: true });
      } else if (user.role === 'field_operator') {
        navigate('/field', { replace: true });
      } else if (user.role === 'sales_operator') {
        navigate('/sales', { replace: true });
      } else if (user.role === 'customer') {
        navigate('/customer/portal', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  };

  // Extra function to determine the correct dashboard based on URL
  const getDashboardLink = () => {
    const path = location.pathname.toLowerCase();
    
    if (path.includes('/admin')) return '/admin';
    if (path.includes('/manager')) return '/manager';
    if (path.includes('/field')) return '/field';
    if (path.includes('/sales')) return '/sales';
    if (path.includes('/customer')) return '/customer/portal';
    
    return '/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-5xl font-bold mb-6 text-red-500">404</h1>
        <PageHeader 
          title="Page not found" 
          description={`The page "${location.pathname}" doesn't exist or has been moved`} 
        />
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 mb-6">
          <p>This could be due to:</p>
          <ul className="list-disc text-left pl-6 mt-2">
            <li>A typo in the URL</li>
            <li>The page has been moved or deleted</li>
            <li>You don't have permission to access this page</li>
          </ul>
        </div>
        
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
            Go to Dashboard
          </Button>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(getDashboardLink())}
          >
            Return to Main Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
