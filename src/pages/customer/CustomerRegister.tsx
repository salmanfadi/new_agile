
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define business types
const businessTypes = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'other', label: 'Other' }
];

// GSTIN Validation regex
// Format: 2 digits state code + 10 digit PAN + 1 digit entity number + 1 digit Z + 1 digit checksum
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Phone number regex (simple version)
const phoneRegex = /^\+?[0-9]{10,15}$/;

// Define form schema with Zod
const registerSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required' }),
  gstin: z.string().regex(gstinRegex, { message: 'Invalid GSTIN format' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(phoneRegex, { message: 'Invalid phone number' }),
  fullName: z.string().min(2, { message: 'Full name is required' }),
  businessType: z.string().min(1, { message: 'Please select a business type' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string(),
  address: z.string().optional(),
  businessRegNumber: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const CustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      gstin: '',
      email: '',
      phone: '',
      fullName: '',
      businessType: '',
      password: '',
      confirmPassword: '',
      address: '',
      businessRegNumber: '',
    }
  });
  
  const onSubmit = async (values: RegisterFormValues) => {
    setIsRegistering(true);
    
    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', values.email.toLowerCase())
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (existingUser && existingUser.length > 0) {
        throw new Error('An account with this email already exists.');
      }
      
      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.email.toLowerCase(),
            name: values.fullName,
            role: 'customer',
            company_name: values.companyName,
            gstin: values.gstin,
            phone: values.phone,
            business_type: values.businessType,
            address: values.address || null,
            business_reg_number: values.businessRegNumber || null,
          },
          emailRedirectTo: `${window.location.origin}/customer/login`
        }
      });
      
      if (error) throw error;
      
      // Success
      setRegistrationSuccess(true);
      form.reset();
      
      toast({
        title: "Registration Successful",
        description: "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Customer Account</CardTitle>
              <CardDescription>
                Register for a customer account to access our portal and manage your inquiries.
              </CardDescription>
            </CardHeader>
            
            {registrationSuccess ? (
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    Registration Successful!
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Thank you for registering. Please check your email to verify your account before logging in.
                  </p>
                  <Button asChild>
                    <Link to="/customer/login">Go to Login</Link>
                  </Button>
                </div>
              </CardContent>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your Company Name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="gstin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GSTIN*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="15-character GSTIN" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address*</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} placeholder="company@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+91XXXXXXXXXX" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name*</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Representative's Full Name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password*</FormLabel>
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
                            <FormLabel>Confirm Password*</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} placeholder="••••••••" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-sm text-blue-800">
                        Password must be at least 8 characters and include uppercase, number, and special character.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="pt-2">
                      <p className="text-sm font-medium text-slate-700 mb-2">Optional Information</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Your business address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="businessRegNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Registration Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Registration number if available" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col sm:flex-row gap-4 pt-0">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link to="/customer/login">
                        Already have an account? Log in
                      </Link>
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

export default CustomerRegister;
