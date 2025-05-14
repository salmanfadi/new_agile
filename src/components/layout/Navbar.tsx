
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDashboardLink = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'warehouse_manager':
        return '/manager';
      case 'field_operator':
        return '/field';
      case 'sales_operator':
        return '/sales';
      default:
        return '/';
    }
  };

  return (
    <header className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link 
          to={getDashboardLink(user?.role as UserRole)} 
          className="flex items-center space-x-2"
        >
          <span className="font-bold text-xl text-primary">Agile WMS</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
