
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Types for our context
interface DataSyncContextType {
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  forceSync: () => void;
}

// Create the context with a default value
const DataSyncContext = createContext<DataSyncContextType>({
  syncStatus: 'idle',
  lastSyncTime: null,
  forceSync: () => {},
});

// Provider component that wraps your app and makes sync status available everywhere
export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { user } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Function to manually force a sync
  const forceSync = () => {
    setSyncStatus('syncing');
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus('idle');
      setLastSyncTime(new Date());
      toast({
        title: 'Data synchronized',
        description: 'Your data has been successfully synchronized with the server.',
      });
    }, 1500);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Clean up any existing subscription
    if (channel) {
      channel.unsubscribe();
    }

    // Set up new subscription for inventory changes
    const newChannel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
        },
        (payload) => {
          console.log('Inventory change detected:', payload);
          setLastSyncTime(new Date());
          toast({
            title: 'Inventory Updated',
            description: `Inventory has been updated ${payload.eventType === 'INSERT' ? 'with new items' : 'with changes'}`,
          });
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      newChannel.unsubscribe();
    };
  }, [user]);

  // Provide the context value to children
  return (
    <DataSyncContext.Provider value={{ syncStatus, lastSyncTime, forceSync }}>
      {children}
    </DataSyncContext.Provider>
  );
};

// Custom hook for using the context
export const useDataSync = () => useContext(DataSyncContext);
