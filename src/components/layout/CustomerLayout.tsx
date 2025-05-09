
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Warehouse, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Warehouse className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl text-blue-600">Agile WMS</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/customer/products" 
              className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Package className="h-5 w-5 mr-1" />
              <span>Products</span>
            </Link>
            
            <Link 
              to="/customer/inquiry" 
              className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mr-1" />
              <span>Submit Inquiry</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <Link to="/customer/login">
                <Button variant="outline" size="sm" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-1" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link to="/customer/register">
                <Button variant="default" size="sm" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span>Register</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <Warehouse className="h-6 w-6" />
                <span className="font-bold text-xl text-white">Agile WMS</span>
              </div>
              <p className="mt-2 text-sm">Enterprise Warehouse Management System</p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <Link to="/customer/products" className="hover:text-white transition-colors">
                Products
              </Link>
              <Link to="/customer/inquiry" className="hover:text-white transition-colors">
                Submit Inquiry
              </Link>
              <Link to="/customer/login" className="hover:text-white transition-colors">
                Customer Portal
              </Link>
              <Link to="/customer/register" className="hover:text-white transition-colors">
                Register
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-center">
            &copy; {new Date().getFullYear()} Agile WMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
