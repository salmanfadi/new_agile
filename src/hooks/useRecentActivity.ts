import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QueryKeys } from '@/constants/queryKeys';

type NotificationItem = {
  id: string;
  created_at: string;
  updated_at?: string;
  action_type: string;
  is_read: boolean;
  metadata: any;
  role: string;
  user_id: string;
  [key: string]: any; // Allow additional properties
};

type StockMovementItem = {
  id: string;
  created_at: string;
  updated_at?: string;
  // Add other stock movement properties as needed
};

type ActivityItem = ({
  __type: 'notification';
} & NotificationItem) | ({
  __type: 'stock_movement';
} & StockMovementItem);

type ActivityType = 'audit' | 'stock_movement' | 'notification';

type ActivityFilters = {
  userId?: string;
  type?: ActivityType | ActivityType[];
  limit?: number;
  startDate?: Date;
  endDate?: Date;
};

type UseRecentActivityOptions = {
  enabled?: boolean;
};

export const useRecentActivity = (
  filters: ActivityFilters = {},
  options: UseRecentActivityOptions = {}
) => {
  const queryClient = useQueryClient();
  const queryKey = [QueryKeys.RECENT_ACTIVITY, filters];

  const fetchRecentActivity = async (): Promise<ActivityItem[]> => {
    try {
      // Only fetch from tables that exist in our schema
      const [stockMovements, notifications] = await Promise.all([
        // Stock movements
        supabase
          .from('stock_in_details')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(filters.limit || 50),
        
        // Notifications
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(filters.limit || 50),
      ]);

      // Combine and sort all activities by date
      const allActivities: ActivityItem[] = [
        ...(stockMovements.data || []).map(item => ({
          ...item,
          __type: 'stock_movement' as const,
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
        })),
        ...(notifications.data || []).map(notification => {
          const notificationItem: NotificationItem = {
            ...notification,
            updated_at: (notification as any).updated_at || notification.created_at || new Date().toISOString(),
          };
          return {
            ...notificationItem,
            __type: 'notification' as const,
          };
        }),
      ];

      // Sort by date (newest first)
      return allActivities
        .sort((a, b) => {
          const dateA = new Date(a.updated_at).getTime();
          const dateB = new Date(b.updated_at).getTime();
          return dateB - dateA;
        })
        .slice(0, filters.limit || 50);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw new Error('Failed to fetch recent activity');
    }
  };

  // Set up real-time updates
  React.useEffect(() => {
    const tables = ['stock_in_details', 'notifications'];
    const channels = tables.map(table => 
      supabase.channel(`${table}-changes`)
    );

    // Subscribe to stock_in_details changes
    channels[0]
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'stock_in_details' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: [QueryKeys.RECENT_ACTIVITY] });
        }
      )
      .subscribe();

    // Subscribe to notifications changes
    channels[1]
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: [QueryKeys.RECENT_ACTIVITY] });
        }
      )
      .subscribe();

    return () => {
      channels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      });
    };
  }, [queryClient]);

  const { data, isLoading, error, refetch } = useQuery<ActivityItem[]>({
    queryKey,
    queryFn: fetchRecentActivity,
    staleTime: 1000 * 30, // 30 seconds
    enabled: options.enabled !== false, // Default to true if not specified
  });

  return {
    activities: data || [],
    isLoading,
    error,
    refetch: async () => {
      const result = await refetch();
      // Force refetch related queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [QueryKeys.RECENT_ACTIVITY] }),
        queryClient.refetchQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] }),
      ]);
      return result;
    },
  };
};
