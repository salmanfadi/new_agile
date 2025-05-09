
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
      else if (user.role === 'field_operator') targetRoute = '/operator';
      
      // Use navigate for smoother transition
      navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, navigate, location, user, authLoading]);

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
      await login(username, password);
      // Navigation handled by login function directly
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
      // Navigation handled by login function directly
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Warehouse className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Agile Warehouse</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
          
          {authLoading && (
            <div className="text-sm text-amber-600 flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                disabled={isLoading || authLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                disabled={isLoading || authLoading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || authLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Quick login for demo:</p>
              <div className="flex gap-2 justify-center mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading || authLoading}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('warehouse')}
                  disabled={isLoading || authLoading}
                >
                  Warehouse
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('field')}
                  disabled={isLoading || authLoading}
                >
                  Field
                </Button>
              </div>
              
              {loginAttempts > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleForceClearAuth}
                  className="mt-6 text-red-500 hover:text-red-600 hover:bg-red-50"
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
