
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Warehouse, LogOut, User } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  isCollapsed?: boolean;
  className?: string;
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isCollapsed = false, className, toggleSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return user?.email?.substring(0, 2).toUpperCase() || 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again",
      });
    }
  };
  
  return (
    <div className={cn(
      'flex h-16 items-center justify-between border-b px-4 bg-background shadow-apple-sm', 
      className
    )}>
      <div className="flex items-center gap-2">
        {toggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="mr-2"
          >
            <Warehouse className="h-5 w-5 text-primary" />
          </Button>
        )}
        
        {!isCollapsed && (
          <span className="text-lg font-semibold text-foreground">Agile Warehouse</span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {!user ? (
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link to="/login">Sign In</Link>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full p-0 h-9 w-9">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground leading-none">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
