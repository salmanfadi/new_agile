
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, Clock, Filter } from 'lucide-react';
import { Notification } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface NotificationFilter {
  actionType?: string;
  isRead?: boolean;
}

export const NotificationsList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async (): Promise<Notification[]> => {
      let query = supabase.from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters if they exist
      if (filter.isRead !== undefined) {
        query = query.eq('read', filter.isRead);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    }
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    }
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications'
        }, 
        (payload) => {
          // Check if the notification is meant for this user (admin sees all, others see their own)
          if (user?.role === 'admin' || payload.new.user_id === user?.id) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            
            toast({
              title: "New Notification",
              description: `New notification received`
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification History
            </CardTitle>
            <CardDescription>
              View system notifications and activity events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" /> 
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> 
                Mark All as Read
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map(notification => (
                  <TableRow 
                    key={notification.id}
                    className={!notification.read ? 'bg-blue-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell>
                      {notification.message || 'No message'}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {!notification.read ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      ) : (
                        <Badge variant="outline">Read</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-md">
              <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>No notifications found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
