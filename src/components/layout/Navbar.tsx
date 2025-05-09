
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, PanelLeft, PanelRight, LogOut, Bell, Search, User } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  toggleSidebar: () => void;
  sidebarCollapsed?: boolean;
}

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'warehouse_manager':
      return 'Warehouse Manager';
    case 'field_operator':
      return 'Field Operator';
    case 'sales_operator':
      return 'Sales Operator';
    default:
      return role;
  }
};

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, sidebarCollapsed = false }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Only show notifications for admin and warehouse_manager roles
  const canViewNotifications = user?.role === 'admin' || user?.role === 'warehouse_manager';

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      if (!user || !canViewNotifications) return 0;
      
      let query = supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true })
        .eq('is_read', false);
      
      // Warehouse managers only see their own notifications
      if (user.role === 'warehouse_manager') {
        query = query.eq('user_id', user.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('Error fetching notifications count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && canViewNotifications,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch recent notifications for popover
  const { data: recentNotifications = [] } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: async () => {
      if (!user || !canViewNotifications) return [];
      
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Warehouse managers only see their own notifications
      if (user.role === 'warehouse_manager') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching recent notifications:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!user && canViewNotifications && notificationsOpen
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user || !canViewNotifications) return;

    const channel = supabase
      .channel('navbar-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications'
        }, 
        (payload) => {
          // Check if the notification is meant for this user
          if (user.role === 'admin' || (user.role === 'warehouse_manager' && payload.new.user_id === user.id)) {
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
            
            // Show toast for new notification
            toast({
              title: "New Notification",
              description: `New action: ${payload.new.action_type.replace('_', ' ')}`,
              variant: "default"
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user, canViewNotifications, toast]);

  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging you out",
        variant: "destructive"
      });
    }
  };
  
  const handleViewAllNotifications = () => {
    setNotificationsOpen(false);
    // Navigate to notifications tab in barcode management
    navigate('/admin/barcodes');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4"
          aria-label={isMobile ? "Toggle sidebar" : (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
          title={isMobile ? "Toggle sidebar" : (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
        >
          {isMobile ? (
            <Menu className="h-5 w-5" />
          ) : (
            sidebarCollapsed ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />
          )}
        </Button>
        
        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {isMobile || sidebarCollapsed ? "AW" : "Agile Warehouse"}
        </div>
      </div>
      
      <div className="flex-1 mx-4 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full rounded-full bg-gray-100 dark:bg-slate-800 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {canViewNotifications && (
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-medium">Notifications</h4>
                <Badge variant="outline">{unreadCount} unread</Badge>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {recentNotifications.length > 0 ? (
                  <div className="divide-y">
                    {recentNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 ${!notification.is_read ? 'bg-muted/20' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant="outline">{notification.action_type.replace('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">
                          {notification.metadata.category && `Category: ${notification.metadata.category}`}
                          {notification.metadata.count && `, ${notification.metadata.count} items`}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          by {notification.role}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No recent notifications
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm h-9" 
                  onClick={handleViewAllNotifications}
                >
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(user.role)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
