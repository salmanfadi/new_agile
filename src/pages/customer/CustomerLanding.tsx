
import React from 'react';
import { Link } from 'react-router-dom';
import { Package, MessageCircle, UserCircle } from 'lucide-react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CustomerLanding: React.FC = () => {
  return (
    <CustomerLayout>
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Welcome to Agile WMS</h1>
            <p className="text-xl mb-8">Your Inventory Partner</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/customer/products">
                <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                  View Products
                </Button>
              </Link>
              <Link to="/customer/inquiry">
                <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                  Submit Inquiry
                </Button>
              </Link>
              <Link to="/customer/register">
                <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Package className="mr-2 h-5 w-5" />
                Product Catalogue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Browse our complete product catalogue to find what you need.</p>
              <Link to="/customer/products">
                <Button>View Products</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <MessageCircle className="mr-2 h-5 w-5" />
                Submit an Inquiry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Interested in pricing? Submit an inquiry for our products.</p>
              <Link to="/customer/inquiry">
                <Button>Submit Inquiry</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <UserCircle className="mr-2 h-5 w-5" />
                Customer Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Sign in or register to track your inquiries and view product availability.</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Link to="/customer/login">
                  <Button>Login</Button>
                </Link>
                <Link to="/customer/register">
                  <Button variant="outline">Register</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerLanding;
