
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Warehouse, 
  Package, 
  PackageCheck, 
  PackageX, 
  Users, 
  LogIn, 
  LogOut,
  Database,
  Barcode,
  ShoppingCart,
  Tag
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon: Icon, label, isActive, onClick }) => (
  <Link
    to={href}
    className={cn(
      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
      isActive 
        ? "bg-warehouse-blue text-white" 
        : "hover:bg-gray-100"
    )}
    onClick={onClick}
  >
    <Icon className="h-5 w-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Handle click on mobile - close sidebar after navigation
  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  
  // Render different navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];
    
    const isActive = (path: string) => location.pathname === path;
    
    // Common items for all roles
    const commonItems = [
      {
        href: '/',
        icon: LayoutDashboard,
        label: 'Dashboard',
        isActive: isActive('/')
      }
    ];
    
    // Role specific items
    switch (user.role) {
      case 'admin':
        return [
          ...commonItems,
          {
            href: '/admin/warehouses',
            icon: Warehouse,
            label: 'Warehouses',
            isActive: isActive('/admin/warehouses')
          },
          {
            href: '/admin/users',
            icon: Users,
            label: 'Users',
            isActive: isActive('/admin/users')
          },
          {
            href: '/admin/inventory',
            icon: Database,
            label: 'Inventory',
            isActive: isActive('/admin/inventory')
          },
          {
            href: '/admin/products',
            icon: Package,
            label: 'Products',
            isActive: isActive('/admin/products')
          },
          {
            href: '/admin/sales',
            icon: ShoppingCart,
            label: 'Sales Inquiries',
            isActive: isActive('/admin/sales')
          },
          {
            href: '/admin/stock-in',
            icon: LogIn,
            label: 'Stock In',
            isActive: isActive('/admin/stock-in')
          },
          {
            href: '/admin/stock-out',
            icon: LogOut,
            label: 'Stock Out',
            isActive: isActive('/admin/stock-out')
          }
        ];
      
      case 'warehouse_manager':
        return [
          ...commonItems,
          {
            href: '/manager/stock-in',
            icon: LogIn,
            label: 'Stock In Review',
            isActive: isActive('/manager/stock-in')
          },
          {
            href: '/manager/stock-out-approval',
            icon: LogOut,
            label: 'Stock Out Approvals',
            isActive: isActive('/manager/stock-out-approval')
          },
          {
            href: '/manager/inventory',
            icon: Database,
            label: 'Inventory',
            isActive: isActive('/manager/inventory')
          },
          {
            href: "/manager/barcode",
            icon: Barcode,
            label: "Barcode Lookup",
            isActive: isActive('/manager/barcode')
          },
          {
            href: '/admin/products',
            icon: Tag,
            label: 'Products',
            isActive: isActive('/admin/products')
          }
        ];
      
      case 'field_operator':
        return [
          ...commonItems,
          {
            href: '/operator/stock-in',
            icon: Package,
            label: 'Stock In',
            isActive: isActive('/operator/stock-in')
          },
          {
            href: '/operator/stock-out',
            icon: PackageX,
            label: 'Stock Out',
            isActive: isActive('/operator/stock-out')
          },
          {
            href: '/operator/submissions',
            icon: PackageCheck,
            label: 'My Submissions',
            isActive: isActive('/operator/submissions')
          },
          {
            href: "/operator/barcode",
            icon: Barcode,
            label: "Barcode Lookup",
            isActive: isActive('/operator/barcode')
          }
        ];
      
      default:
        return commonItems;
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-2xl font-bold text-warehouse-blue">Agile WMS</h1>
      </div>
      
      <div className="py-4 px-3 space-y-1">
        {getNavItems().map((item, index) => (
          <SidebarItem
            key={index}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive}
            onClick={handleItemClick}
          />
        ))}
      </div>
    </div>
  );
};
