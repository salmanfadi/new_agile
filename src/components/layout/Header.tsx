
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Warehouse } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isCollapsed?: boolean;
  className?: string;
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isCollapsed = false, className, toggleSidebar }) => {
  const { user } = useAuth();
  
  return (
    <div className={cn('flex h-16 items-center justify-between border-b px-4', className)}>
      <div className="flex items-center gap-2">
        {!isCollapsed && (
          <>
            <Warehouse className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">SCA Warehouse Management</span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {!user ? (
          <Button asChild size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
        ) : null}
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
