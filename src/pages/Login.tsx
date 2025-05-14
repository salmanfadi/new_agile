
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
import { supabase } from '@/integrations/supabase/client';

// Import mockUsers from the AuthContext
import { mockUsers } from '@/context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Debug information
  console.log("Login page state:", { 
    isAuthenticated, 
    authLoading, 
    user, 
    currentPath: location.pathname,
    loginAttempts
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
      // Force a full page reload to ensure clean state
      window.location.href = targetRoute;
    }
  }, [isAuthenticated, user, authLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        variant: 'destructive',
        title: 'Login error',
        description: 'Please enter both username and password',
      });
      return;
    }
    
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);
    
    try {
      console.log("Attempting login with:", username);
      
      // Clean up any existing auth state first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Sign out before login failed:", err);
      }
      
      // Handle mock users (development mode)
      if (mockUsers.some(u => u.username === username || u.username === username.toLowerCase())) {
        await login(username, password);
      } else {
        // Real Supabase auth login - determine if it's an email or username
        const isEmail = username.includes('@');
        
        if (isEmail) {
          await login(username, password);
        } else {
          // If it's not an email, try as mock user first, then fail
          await login(username, password);
        }
      }
    } catch (error) {
      console.error("Login submission error:", error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      setIsLoading(false);
    }
  };

  // For demo purposes, quick login buttons
  const handleQuickLogin = async (role: string) => {
    setIsLoading(true);
    setLoginAttempts(prev => prev + 1);
    try {
      console.log("Quick login with role:", role);
      await login(role, 'password');
      // Navigation handled by the useEffect hook above
    } catch (error) {
      console.error("Quick login error:", error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      setIsLoading(false);
    }
  };

  // Force a clean state and reload if we've tried multiple times
  const handleForceClearAuth = () => {
    // Clear any auth tokens in storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key === 'user') {
        localStorage.removeItem(key);
      }
    });
    
    // Force a full page reload
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 dark:bg-slate-800">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Warehouse className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Agile Warehouse</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Sign in to your account to continue
          </CardDescription>
          
          {authLoading && (
            <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 mt-2">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Auth state is loading, please wait...
            </div>
          )}
          
          {loginAttempts > 1 && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                Having trouble logging in? Try clicking the "Reset Auth State" button below.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username or email"
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
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quick login for demo:</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading || authLoading}
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('warehouse')}
                  disabled={isLoading || authLoading}
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  Warehouse
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('field')}
                  disabled={isLoading || authLoading}
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  Field
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('sales')}
                  disabled={isLoading || authLoading}
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  Sales
                </Button>
              </div>
              
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
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
