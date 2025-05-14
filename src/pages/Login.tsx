
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Warehouse } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login, isAuthenticated, isLoading: authLoading, user, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Add effect to reset loading state if authLoading changes
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  // Debug information
  console.log("Login page state:", { 
    isAuthenticated, 
    authLoading, 
    user, 
    currentPath: location.pathname,
    loginAttempts,
    authError,
    isLoading // Add isLoading to debug output
  });
  
  // Check if we're already authenticated - redirect if so
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      console.log("User is authenticated, redirecting to appropriate dashboard");
      
      // Determine correct route based on user role
      let targetRoute = '/';
      if (user.role === 'admin') targetRoute = '/admin';
      else if (user.role === 'warehouse_manager') targetRoute = '/manager';
      else if (user.role === 'field_operator') targetRoute = '/field';
      else if (user.role === 'sales_operator') targetRoute = '/sales';
      else if (user.role === 'customer') targetRoute = '/customer/portal';
      
      console.log("Redirecting authenticated user to:", targetRoute);
      navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // Show auth errors
  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError instanceof Error ? authError.message : String(authError),
        variant: "destructive"
      });
    }
  }, [authError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);
    
    try {
      console.log("Attempting login with email:", email);
      await login(email, password);
      console.log("Login successful");
      
      // The navigation will be handled by the useEffect above
      // when isAuthenticated and user are updated
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceClearAuth = async () => {
    try {
      // Clear all auth-related data from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear from sessionStorage if in use
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Force reload the page
      window.location.reload();
    } catch (error) {
      console.error("Error clearing auth state:", error);
      toast({
        title: "Error",
        description: "Failed to clear auth state. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Warehouse className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Welcome to SCA Warehouse Management</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {loginAttempts > 2 && (
              <Alert variant="destructive">
                <AlertDescription>
                  Having trouble signing in? Try resetting your auth state.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={isLoading || authLoading}
                className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:placeholder:text-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                disabled={isLoading || authLoading}
                className="h-11 dark:bg-slate-700 dark:border-slate-600 dark:placeholder:text-slate-400"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-0">
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || authLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            {loginAttempts > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleForceClearAuth}
                className="mt-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Reset Auth State
              </Button>
            )}
          </CardFooter>
        </form>
        
        {authError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {authError instanceof Error ? authError.message : String(authError)}
            </AlertDescription>
          </Alert>
        )}
      </Card>
    </div>
  );
};

export default Login;
