import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Warehouse, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showLastEmail, setShowLastEmail] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, user, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      let targetRoute = '/';
      if (user.role === 'admin') targetRoute = '/admin';
      else if (user.role === 'warehouse_manager') targetRoute = '/manager';
      else if (user.role === 'field_operator') targetRoute = '/field';
      else if (user.role === 'sales_operator') targetRoute = '/sales';
      
      navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError instanceof Error ? authError.message : String(authError),
        variant: "destructive"
      });
    }
  }, [authError, toast]);

  useEffect(() => {
    const lastEmail = localStorage.getItem('lastUsedEmail');
    if (lastEmail && !email) {
      setShowLastEmail(true);
    }
  }, [email]);

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
      await login(email, password);
      localStorage.setItem('lastUsedEmail', email);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Warehouse className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Staff Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailInputRef}
                  required
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
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {loginAttempts > 2 && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Having trouble logging in? Contact your system administrator.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
