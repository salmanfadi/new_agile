
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex">
          <Button
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
          
          <div className="hidden md:flex items-center">
            <span className="text-xl font-semibold">SCA Warehouse Management</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle />
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm font-medium">
                {user.name || user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
