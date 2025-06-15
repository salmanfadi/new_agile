
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Password schema
const passwordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [hashPresent, setHashPresent] = useState(false);
  
  // Initialize form
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    // Check if we have a hash in the URL (from password reset email)
    const hash = window.location.hash;
    setHashPresent(!!hash && hash.includes('type=recovery'));
  }, []);
  
  const onSubmit = async (values: PasswordFormValues) => {
    setIsResetting(true);
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });
      
      if (error) throw error;
      
      setResetSuccess(true);
      form.reset();
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been successfully reset.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "An error occurred during password reset.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  if (!hashPresent) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  Invalid or expired reset link. Please request a new password reset from the login page.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                <Button asChild>
                  <Link to="/customer/login">Return to Login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </CustomerLayout>
    );
  }
  
  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <KeyRound className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            
            {resetSuccess ? (
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    Password Reset Successful!
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Your password has been successfully reset. You can now log in with your new password.
                  </p>
                  <Button asChild>
                    <Link to="/customer/login">Go to Login</Link>
                  </Button>
                </div>
              </CardContent>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <CardContent className="space-y-4">
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-sm text-blue-800">
                        Password must be at least 8 characters and include uppercase, number, and special character.
                      </AlertDescription>
                    </Alert>
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="••••••••" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="••••••••" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            )}
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ResetPassword;
