
import React from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, LogIn, UserPlus } from 'lucide-react';

const CustomerInquirySuccess: React.FC = () => {
  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto">
          <Card className="border-green-100 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                  Inquiry Submitted Successfully!
                </h1>
                <p className="text-slate-600 mb-4">
                  Thank you for your inquiry. Our sales team will review your request and get back to you soon with pricing and availability information.
                </p>
                <div className="bg-white p-4 rounded-md border border-slate-200 w-full mb-4">
                  <h2 className="font-medium text-slate-700 mb-2">What happens next?</h2>
                  <ol className="list-decimal list-inside text-left text-slate-600 space-y-2">
                    <li>Our team will review your inquiry</li>
                    <li>We'll prepare pricing and availability information</li>
                    <li>You'll receive a response via email within 1-2 business days</li>
                  </ol>
                </div>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 w-full">
                  <div className="flex items-start">
                    <LogIn className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      <strong>Create an account or log in</strong> to track the status of your inquiry and view detailed product availability.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="default">
                <Link to="/customer/products">Browse More Products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/customer/login" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/customer/register" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerInquirySuccess;
