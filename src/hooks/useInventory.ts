import React from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QueryKeys } from '@/constants/queryKeys';

type InventoryItem = {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number;
  barcode: string | null;
  status: string;
  color: string | null;
  size: string | null;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
};

type InventoryFilters = {
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  status?: string;
  searchTerm?: string;
};

type UseInventoryOptions = {
  enabled?: boolean;
};

export const useInventory = (
  filters: InventoryFilters = {},
  options: UseInventoryOptions = {}
) => {
  const queryClient = useQueryClient();
  const queryKey = [QueryKeys.INVENTORY_ITEMS, filters];

  const fetchInventory = async (): Promise<InventoryItem[]> => {
    try {
      let query = supabase
        .from('inventory')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.searchTerm) {
        query = query.ilike('barcode', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Return the data as is, since we've updated the type to match the database
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }
  };

  // Subscribe to real-time updates
  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'inventory' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const { data, isLoading, error, refetch } = useQuery<InventoryItem[], Error>({
    queryKey,
    queryFn: fetchInventory,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options.enabled !== false, // Default to true if not specified
  });

  // Set up real-time subscription after initial data load
  React.useEffect(() => {
    if (data) {
      const channel = supabase
        .channel('inventory-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'inventory' 
          },
          () => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [data, queryClient]);

  // Mutation for updating inventory
  const updateInventory = useMutation({
    mutationFn: async (updates: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updates.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RECENT_ACTIVITY] });
      
      // Force refetch to ensure UI is up to date
      queryClient.refetchQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] });
    },
  });

  // Mutation for deleting inventory
  const deleteInventory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RECENT_ACTIVITY] });
      
      // Force refetch to ensure UI is up to date
      queryClient.refetchQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] });
    },
  });

  return {
    inventory: data || [],
    isLoading,
    error,
    refetch: async () => {
      await refetch();
      // Force refetch related queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [QueryKeys.INVENTORY_ITEMS] }),
        queryClient.refetchQueries({ queryKey: [QueryKeys.RECENT_ACTIVITY] }),
      ]);
    },
    updateInventory,
    deleteInventory,
  };
};
