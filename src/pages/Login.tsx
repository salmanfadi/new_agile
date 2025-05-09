
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Warehouse } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if we're already authenticated - redirect if so
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting");
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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
    
    try {
      console.log("Attempting login with:", username);
      await login(username, password);
      // Navigation handled in the login function and useEffect above
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
    try {
      console.log("Quick login with role:", role);
      await login(role, 'password');
      // Navigation handled in the login function and useEffect above
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
            <div className="text-sm text-amber-600">
              Auth state is loading, please wait...
            </div>
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
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
