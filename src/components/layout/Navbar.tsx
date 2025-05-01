
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface NavbarProps {
  toggleSidebar: () => void;
}

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'warehouse_manager':
      return 'Warehouse Manager';
    case 'field_operator':
      return 'Field Operator';
    default:
      return role;
  }
};

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden mr-4"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-xl font-bold text-warehouse-blue">
          Agile Warehouse
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end">
          <span className="font-medium text-sm">{user.name}</span>
          <span className="text-xs text-gray-500">{getRoleLabel(user.role)}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={logout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
