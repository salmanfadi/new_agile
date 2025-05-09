
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Password login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // OTP states
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Check if user is a customer
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profile.role === 'customer') {
          toast({
            title: "Login successful",
            description: "Welcome to your customer portal",
          });
          navigate('/customer/portal');
        } else {
          // Not a customer, sign out and show error
          await supabase.auth.signOut();
          throw new Error("Access restricted to customers only.");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSendingOtp(true);
    
    try {
      // First, check if email has any inquiries
      const { data: inquiries, error: inquiryError } = await supabase
        .from('sales_inquiries')
        .select('id')
        .eq('customer_email', otpEmail)
        .limit(1);
        
      if (inquiryError) throw inquiryError;
      
      if (!inquiries || inquiries.length === 0) {
        throw new Error("No inquiries found for this email address.");
      }
      
      // Generate OTP code (6 digits)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
      
      // Store OTP in database
      const { error: otpError } = await supabase
        .from('otp_tokens')
        .insert({
          email: otpEmail,
          token: otpCode,
          expires_at: expiresAt.toISOString(),
          used: false
        });
        
      if (otpError) throw otpError;
      
      // In a real app, we would send this via email service
      // For demo purposes, we'll show it in console and UI
      console.log(`OTP for ${otpEmail}: ${otpCode}`);
      
      toast({
        title: "OTP Sent",
        description: `For demo purposes, your OTP is: ${otpCode}`,
      });
      
      setOtpStep('verify');
    } catch (error: any) {
      console.error("OTP request error:", error);
      toast({
        title: "OTP Request Failed",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingOtp(false);
    }
  };
  
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode) {
      toast({
        title: "OTP Required",
        description: "Please enter the OTP sent to your email.",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifyingOtp(true);
    
    try {
      // Verify OTP from database
      const { data: tokens, error: tokenError } = await supabase
        .from('otp_tokens')
        .select('*')
        .eq('email', otpEmail)
        .eq('token', otpCode)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .limit(1);
        
      if (tokenError) throw tokenError;
      
      if (!tokens || tokens.length === 0) {
        throw new Error("Invalid or expired OTP. Please try again.");
      }
      
      // Mark OTP as used
      await supabase
        .from('otp_tokens')
        .update({ used: true })
        .eq('id', tokens[0].id);
      
      // Create magic link session without password
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: otpEmail,
      });
      
      if (signInError) throw signInError;
      
      toast({
        title: "OTP Verified",
        description: "You are now logged in as a guest user.",
      });
      
      // Navigate to customer portal
      navigate('/customer/portal');
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  
  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Customer Portal</CardTitle>
              <CardDescription>
                Login to track your inquiries and view product availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="password" className="flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Password Login
                  </TabsTrigger>
                  <TabsTrigger value="otp" className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    OTP Access
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="password">
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="otp">
                  {otpStep === 'request' ? (
                    <form onSubmit={handleOtpRequest} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otpEmail">Email</Label>
                        <Input
                          id="otpEmail"
                          type="email"
                          placeholder="your.email@example.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-slate-500">
                          Enter the email you used to submit an inquiry.
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSendingOtp}
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP'
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleOtpVerify} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          maxLength={6}
                          required
                        />
                        <p className="text-xs text-slate-500">
                          Enter the verification code sent to your email.
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setOtpStep('request')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1" 
                          disabled={isVerifyingOtp}
                        >
                          {isVerifyingOtp ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify OTP'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerLogin;
