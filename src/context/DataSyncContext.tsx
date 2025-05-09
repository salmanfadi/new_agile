
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Define types for our context
type DataSyncContextType = {
  subscribeToTable: (tableName: string, event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*') => void;
  unsubscribeFromTable: (tableName: string) => void;
  invalidateQueries: (queryKeys: string[]) => void;
  subscribedTables: Record<string, boolean>;
};

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

// Define the query key relationships for automatic invalidation
const tableQueryRelationships: Record<string, string[]> = {
  'inventory': ['inventory', 'stock-in', 'stock-out'],
  'stock_in': ['stock-in', 'inventory', 'stock-in-requests'],
  'stock_out': ['stock-out', 'inventory'],
  'stock_in_details': ['stock-in', 'inventory'],
  'stock_out_details': ['stock-out', 'inventory'],
  'notifications': ['notifications'],
  'barcode_logs': ['barcode-logs'],
  'products': ['products', 'inventory'],
  'warehouses': ['warehouses', 'inventory'],
  'warehouse_locations': ['warehouse-locations', 'inventory'],
  'profiles': ['profiles', 'users'],
};

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});
  const [subscribedTables, setSubscribedTables] = useState<Record<string, boolean>>({});

  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(channels).forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [channels]);

  // Automatically subscribe to notifications for all users
  useEffect(() => {
    if (user) {
      subscribeToTable('notifications');
    }
  }, [user]);

  const subscribeToTable = (tableName: string, event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*') => {
    if (!user) return;
    if (channels[tableName]) return; // Already subscribed

    console.log(`Subscribing to table: ${tableName} for events: ${event}`);

    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes', 
        {
          event: event,
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`Received ${payload.eventType} event on ${tableName}:`, payload);
          
          // Invalidate related queries
          const relatedQueries = tableQueryRelationships[tableName] || [tableName];
          invalidateQueries(relatedQueries);
          
          // Show toast notification for important events
          if (tableName === 'notifications' && payload.eventType === 'INSERT') {
            toast({
              title: 'New Notification',
              description: 'You have a new notification',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${tableName}: ${status}`);
        if (status === 'SUBSCRIBED') {
          setSubscribedTables(prev => ({ ...prev, [tableName]: true }));
        } else if (status === 'CHANNEL_ERROR') {
          setSubscribedTables(prev => ({ ...prev, [tableName]: false }));
        }
      });

    setChannels(prev => ({ ...prev, [tableName]: channel }));
  };

  const unsubscribeFromTable = (tableName: string) => {
    const channel = channels[tableName];
    if (channel) {
      supabase.removeChannel(channel);
      setChannels(prev => {
        const newChannels = { ...prev };
        delete newChannels[tableName];
        return newChannels;
      });
      setSubscribedTables(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const invalidateQueries = (queryKeys: string[]) => {
    queryKeys.forEach(key => {
      console.log(`Invalidating query: ${key}`);
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  return (
    <DataSyncContext.Provider
      value={{
        subscribeToTable,
        unsubscribeFromTable,
        invalidateQueries,
        subscribedTables
      }}
    >
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};
