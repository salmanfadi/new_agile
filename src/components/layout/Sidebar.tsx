
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Warehouse, 
  ClipboardList, 
  ScanLine, 
  UploadCloud, 
  Download, 
  AlignJustify,
  ShoppingCart,
  BarChart4
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface SidebarLink {
  href: string;
  icon: React.ReactNode;
  text: string;
  roles?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Links based on user role
  const adminLinks: SidebarLink[] = [
    { href: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, text: 'Dashboard' },
    { href: '/admin/users', icon: <Users className="h-5 w-5" />, text: 'Users' },
    { href: '/admin/products', icon: <Package className="h-5 w-5" />, text: 'Products' },
    { href: '/admin/warehouses', icon: <Warehouse className="h-5 w-5" />, text: 'Warehouses' },
    { href: '/admin/inventory', icon: <ClipboardList className="h-5 w-5" />, text: 'Inventory' },
    { href: '/admin/stock-in', icon: <UploadCloud className="h-5 w-5" />, text: 'Stock In' },
    { href: '/admin/stock-out', icon: <Download className="h-5 w-5" />, text: 'Stock Out' },
    { href: '/admin/sales', icon: <ShoppingCart className="h-5 w-5" />, text: 'Sales Inquiries' },
    { href: '/barcode-scanner', icon: <ScanLine className="h-5 w-5" />, text: 'Scan Barcode' },
  ];
  
  const managerLinks: SidebarLink[] = [
    { href: '/manager', icon: <LayoutDashboard className="h-5 w-5" />, text: 'Dashboard' },
    { href: '/manager/stock-in', icon: <UploadCloud className="h-5 w-5" />, text: 'Stock In' },
    { href: '/manager/stock-out-approval', icon: <Download className="h-5 w-5" />, text: 'Stock Out Approval' },
    { href: '/manager/inventory', icon: <ClipboardList className="h-5 w-5" />, text: 'Inventory' },
    { href: '/manager/barcode', icon: <ScanLine className="h-5 w-5" />, text: 'Barcode Lookup' },
  ];
  
  const operatorLinks: SidebarLink[] = [
    { href: '/operator', icon: <LayoutDashboard className="h-5 w-5" />, text: 'Dashboard' },
    { href: '/operator/stock-out', icon: <Download className="h-5 w-5" />, text: 'Request Stock Out' },
    { href: '/operator/submissions', icon: <ClipboardList className="h-5 w-5" />, text: 'My Submissions' },
    { href: '/operator/barcode', icon: <ScanLine className="h-5 w-5" />, text: 'Scan Barcode' },
  ];
  
  const salesOperatorLinks: SidebarLink[] = [
    { href: '/sales', icon: <LayoutDashboard className="h-5 w-5" />, text: 'Dashboard' },
    { href: '/sales/inquiries', icon: <ShoppingCart className="h-5 w-5" />, text: 'Customer Inquiries' },
    { href: '/products', icon: <Package className="h-5 w-5" />, text: 'Product Catalogue' },
  ];
  
  const getLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return adminLinks;
      case 'warehouse_manager':
        return managerLinks;
      case 'field_operator':
        return operatorLinks;
      case 'sales_operator':
        return salesOperatorLinks;
      default:
        return [];
    }
  };
  
  const links = getLinks();
  
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <h1 className="text-xl font-bold text-warehouse-blue">Agile Warehouse</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <AlignJustify className="h-5 w-5" />
        </Button>
      </div>
      <nav className="p-4 space-y-2">
        {links.map((link, index) => (
          <Link to={link.href} key={index}>
            <Button
              variant={isActive(link.href) ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive(link.href) ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" : ""
              )}
            >
              {link.icon}
              <span className="ml-3">{link.text}</span>
            </Button>
          </Link>
        ))}
        
        {user?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 uppercase font-semibold px-3 mb-2">Public Pages</div>
            <Link to="/products">
              <Button
                variant={isActive("/products") ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive("/products") ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" : ""
                )}
              >
                <Package className="h-5 w-5" />
                <span className="ml-3">Product Catalogue</span>
              </Button>
            </Link>
            <Link to="/cart">
              <Button
                variant={isActive("/cart") ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive("/cart") ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" : ""
                )}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="ml-3">Cart</span>
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};
