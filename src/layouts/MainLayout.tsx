import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Package, Boxes, LogOut, User, Menu, X, Home, PackageSearch, PackagePlus, PackageMinus, Users, MessageSquare, ListChecks, ScanLine } from 'lucide-react';

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
    try {
      await signOut();
      // The navigation will be handled by the signOut function
    } catch (error) {
      console.error('Error signing out:', error);
      // If there's an error, force a page reload to ensure clean state
      window.location.href = '/login';
    }
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
                {item.icon && <item.icon className="h-4 w-4 mr-2" />}
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
                  {item.icon && <item.icon className="h-4 w-4 mr-2" />}
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

interface NavigationItem {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function getNavigationForRole(role?: string): NavigationItem[] {
  const baseRoutes: NavigationItem[] = [
    { path: '/', label: 'Dashboard', icon: Home },
  ];
  
  switch (role) {
    case 'admin':
      return [
        { path: '/admin', label: 'Dashboard', icon: Home },
        { path: '/admin/inventory', label: 'Inventory', icon: PackageSearch },
        { path: '/admin/stock-in', label: 'Stock In', icon: PackagePlus },
        { path: '/admin/stock-out', label: 'Stock Out', icon: PackageMinus },
        { path: '/admin/profiles', label: 'User Profiles', icon: Users },
        { path: '/admin/sales-inquiries', label: 'Sales Inquiries', icon: MessageSquare },
      ];
    case 'warehouse_manager':
      return [
        { path: '/manager', label: 'Dashboard', icon: Home },
        { path: '/manager/inventory', label: 'Inventory', icon: PackageSearch },
        { path: '/manager/stock-in', label: 'Stock In', icon: PackagePlus },
        { path: '/manager/stock-out', label: 'Stock Out', icon: PackageMinus },
      ];
    case 'field_operator':
      return [
        { path: '/field', label: 'Dashboard', icon: Home },
        { path: '/field/stock-in', label: 'Submit Stock', icon: PackagePlus },
        { path: '/field/stock-out', label: 'Stock Out', icon: PackageMinus },
        { path: '/field/submissions', label: 'My Submissions', icon: ListChecks },
        { path: '/field/barcode-lookup', label: 'Barcode Lookup', icon: ScanLine },
      ];
    case 'sales_operator':
      return [
        { path: '/sales', label: 'Dashboard', icon: Home },
        { path: '/sales/inventory', label: 'Products', icon: PackageSearch },
        { path: '/sales/inquiries', label: 'Customer Inquiries', icon: MessageSquare },
      ];
    case 'customer':
      return [
        { path: '/customer/portal', label: 'Dashboard', icon: Home },
        { path: '/customer/products', label: 'Products', icon: PackageSearch },
        { path: '/customer/inquiries', label: 'My Inquiries', icon: MessageSquare },
      ];
    default:
      return baseRoutes;
  }
}
