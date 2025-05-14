
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Package, Boxes, LogOut, User, Menu, X } from 'lucide-react';

export interface MainLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children,
  className 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  const navigation = getNavigationForRole(user?.role);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-30">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg hidden sm:inline">Agile Warehouse</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Button 
                key={item.path} 
                variant={location.pathname.startsWith(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className="text-sm"
              >
                {item.label}
              </Button>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center mr-4">
              <div className="text-right mr-2">
                <div className="text-sm font-medium">{user?.email}</div>
                <div className="text-xs text-muted-foreground">{formatRole(user?.role)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t bg-white dark:bg-slate-900">
            <div className="space-y-1 px-4 py-3">
              {navigation.map((item) => (
                <Button 
                  key={item.path} 
                  variant={location.pathname.startsWith(item.path) ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className="w-full justify-start text-sm"
                >
                  {item.label}
                </Button>
              ))}
              <Button 
                variant="destructive" 
                className="w-full justify-start text-sm mt-4"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            {/* Mobile user info */}
            <div className="border-t p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{user?.email}</div>
                  <div className="text-xs text-muted-foreground">{formatRole(user?.role)}</div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>
      
      {/* Main content */}
      <main className={cn("flex-1 bg-slate-50 dark:bg-slate-900", className)}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

function formatRole(role?: string): string {
  if (!role) return 'User';
  
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getNavigationForRole(role?: string) {
  const baseRoutes = [
    { path: '/', label: 'Dashboard' },
  ];
  
  switch (role) {
    case 'admin':
      return [
        ...baseRoutes,
        { path: '/admin/inventory', label: 'Inventory' },
        { path: '/admin/stock-in', label: 'Stock In' },
        { path: '/admin/stock-out', label: 'Stock Out' },
        { path: '/admin/profiles', label: 'User Profiles' },
        { path: '/admin/sales-inquiries', label: 'Sales Inquiries' },
      ];
    case 'warehouse_manager':
      return [
        ...baseRoutes,
        { path: '/manager/inventory', label: 'Inventory' },
        { path: '/manager/stock-in', label: 'Stock In' },
        { path: '/manager/stock-out', label: 'Stock Out' },
      ];
    case 'field_operator':
      return [
        ...baseRoutes,
        { path: '/field/inventory', label: 'Inventory' },
        { path: '/field/stock-in', label: 'Submit Stock' },
      ];
    case 'sales_operator':
      return [
        ...baseRoutes,
        { path: '/sales/inventory', label: 'Products' },
        { path: '/sales/inquiries', label: 'Customer Inquiries' },
      ];
    case 'customer':
      return [
        ...baseRoutes,
        { path: '/customer/products', label: 'Products' },
        { path: '/customer/inquiries', label: 'My Inquiries' },
      ];
    default:
      return baseRoutes;
  }
}
