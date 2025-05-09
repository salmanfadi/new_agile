
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Warehouse } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { cartItems } = useCart();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Warehouse className="h-6 w-6 text-warehouse-blue" />
            <span className="font-bold text-xl text-warehouse-blue">Agile WMS</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/products" 
              className="flex items-center text-gray-700 hover:text-warehouse-blue transition-colors"
            >
              <Package className="h-5 w-5 mr-1" />
              <span>Products</span>
            </Link>
            
            <Link 
              to="/cart" 
              className="flex items-center text-gray-700 hover:text-warehouse-blue transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 mr-1" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-warehouse-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link>
            
            <Link to="/login">
              <Button variant="outline" size="sm">
                Staff Login
              </Button>
            </Link>
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
              <Link to="/products" className="hover:text-white transition-colors">
                Products
              </Link>
              <Link to="/cart" className="hover:text-white transition-colors">
                Request Pricing
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Staff Portal
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
