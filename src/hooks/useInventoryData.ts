
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface InventoryItem {
  id: string;
  productName: string;
  productId: string;
  warehouseName: string;
  warehouseId: string;
  locationDetails: string;
  locationId: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  status: string;
  batchId: string | null;
  lastUpdated: string;
}

export const useInventoryData = (warehouseFilter: string = '', batchFilter: string = '', searchTerm: string = '') => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for inventory changes
  useEffect(() => {
    // Subscribe to both inventory and stock_in_details tables
    const inventoryChannel: RealtimeChannel = supabase
      .channel('inventory-and-stockin-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Inventory change detected:', payload);
          
          // Show toast notification for inventory changes
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Inventory Item',
              description: 'A new item has been added to inventory',
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Inventory Updated',
              description: 'An inventory item has been updated',
            });
          }
          
          // Invalidate the query to refresh inventory data
          queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stock_in_details' },
        (payload) => {
          console.log('Stock in details change detected:', payload);
          
          // Invalidate the query to refresh batch IDs
          queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stock_in' },
        (payload) => {
          console.log('Stock in status change detected:', payload);
          
          // If stock in is completed, refresh inventory
          if (payload.new && payload.new.status === 'completed') {
            toast({
              title: 'Stock In Completed',
              description: 'New inventory has been added from stock-in processing',
            });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
        })
      .subscribe();

    // Clean up channel subscription when component unmounts
    return () => {
      inventoryChannel.unsubscribe();
    };
  }, [queryClient]);

  // Fetch batch IDs for filter
  const batchIdsQuery = useQuery({
    queryKey: ['batch-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in_details')
        .select('id')
        .order('id');
        
      if (error) {
        console.error('Error fetching batch IDs:', error);
        return [];
      }
      
      return data.map(d => d.id);
    }
  });

  // Fetch warehouses for filter
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*');
        
      if (error) throw error;
      return data;
    }
  });
  
  // Fetch inventory data with consistent structure across roles
  const inventoryQuery = useQuery({
    queryKey: ['inventory-data', warehouseFilter, batchFilter],
    queryFn: async () => {
      console.log('Fetching inventory data with filters:', { warehouseFilter, batchFilter });
      
      try {
        // Build the base query
        let query = supabase
          .from('inventory')
          .select(`
            id,
            product_id,
            warehouse_id,
            location_id,
            barcode,
            quantity,
            color,
            size,
            created_at,
            updated_at,
            status,
            batch_id
          `);
          
        // Apply filters
        if (warehouseFilter) {
          query = query.eq('warehouse_id', warehouseFilter);
        }
        
        if (batchFilter) {
          query = query.eq('batch_id', batchFilter);
        }
        
        // Order by most recently updated first
        query = query.order('updated_at', { ascending: false });
          
        // Execute the query
        const { data: inventoryData, error: inventoryError } = await query;
          
        if (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
          throw inventoryError;
        }

        // Fetch related data in parallel for better performance
        const [productsResponse, warehousesResponse, locationsResponse] = await Promise.all([
          supabase.from('products').select('id, name, description'),
          supabase.from('warehouses').select('id, name, location'),
          supabase.from('warehouse_locations').select('id, floor, zone')
        ]);
        
        // Create lookup maps
        const productMap = productsResponse.data ? productsResponse.data.reduce((map, item) => {
          map[item.id] = item;
          return map;
        }, {} as Record<string, any>) : {};
        
        const warehouseMap = warehousesResponse.data ? warehousesResponse.data.reduce((map, item) => {
          map[item.id] = item;
          return map;
        }, {} as Record<string, any>) : {};
        
        const locationMap = locationsResponse.data ? locationsResponse.data.reduce((map, item) => {
          map[item.id] = item;
          return map;
        }, {} as Record<string, any>) : {};
        
        // Map the inventory data with the related entities
        return inventoryData?.map(item => ({
          id: item.id,
          productName: productMap[item.product_id]?.name || 'Unknown Product',
          productId: item.product_id,
          warehouseName: warehouseMap[item.warehouse_id]?.name || 'Unknown Warehouse',
          warehouseId: item.warehouse_id,
          warehouseLocation: warehouseMap[item.warehouse_id]?.location || '',
          locationId: item.location_id,
          locationDetails: locationMap[item.location_id] 
            ? `Floor ${locationMap[item.location_id].floor}, Zone ${locationMap[item.location_id].zone}`
            : 'Unknown Location',
          barcode: item.barcode,
          quantity: item.quantity,
          color: item.color || '-',
          size: item.size || '-',
          status: item.status || 'available',
          batchId: item.batch_id,
          lastUpdated: new Date(item.updated_at).toLocaleString(),
        })) as InventoryItem[];
      } catch (error) {
        console.error('Error in inventory query:', error);
        throw error;
      }
    }
  });

  // Apply search filter locally to reduce database load
  const filteredInventory = searchTerm && inventoryQuery.data
    ? inventoryQuery.data.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchId && item.batchId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : inventoryQuery.data || [];

  return {
    inventoryItems: filteredInventory,
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    batchIds: batchIdsQuery.data || [],
    warehouses: warehousesQuery.data || [],
  };
};
