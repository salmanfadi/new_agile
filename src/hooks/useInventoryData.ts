
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  source?: string;
}

// Define interfaces for real-time payload types
interface StockInPayload extends RealtimePostgresChangesPayload<{
  [key: string]: any;
}> {
  new?: {
    status: string;
    [key: string]: any;
  };
}

interface StockOutPayload extends RealtimePostgresChangesPayload<{
  [key: string]: any;
}> {
  new?: {
    status: string;
    [key: string]: any;
  };
}

export const useInventoryData = (
  warehouseFilter: string = '', 
  batchFilter: string = '', 
  statusFilter: string = '',
  searchTerm: string = ''
) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for inventory changes
  useEffect(() => {
    console.log('Setting up realtime inventory channels');
    
    // Subscribe to inventory table for any changes
    const inventoryChannel: RealtimeChannel = supabase
      .channel('inventory-changes')
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
        })
      .subscribe();
      
    // Subscribe to stock_in table for status changes
    const stockInChannel: RealtimeChannel = supabase
      .channel('stock-in-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stock_in' },
        (payload: StockInPayload) => {
          console.log('Stock in change detected:', payload);
          
          // If stock in is completed or processing, refresh inventory data
          if (payload.new && ['completed', 'processing'].includes(payload.new.status)) {
            console.log(`Stock in status changed to ${payload.new.status}, refreshing inventory`);
            toast({
              title: `Stock In ${payload.new.status}`,
              description: payload.new.status === 'completed' 
                ? 'New inventory has been added from stock-in processing' 
                : 'Stock-in items are being processed',
            });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
        })
      .subscribe();
      
    // Subscribe to stock_out table for status changes
    const stockOutChannel: RealtimeChannel = supabase
      .channel('stock-out-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stock_out' },
        (payload: StockOutPayload) => {
          console.log('Stock out change detected:', payload);
          
          // If stock out status changes, refresh inventory
          if (payload.new && ['approved', 'completed'].includes(payload.new.status)) {
            toast({
              title: `Stock Out ${payload.new.status}`,
              description: `Stock out request has been ${payload.new.status}`,
            });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
        })
      .subscribe();

    // Clean up channel subscriptions when component unmounts
    return () => {
      console.log('Cleaning up realtime inventory channels');
      inventoryChannel.unsubscribe();
      stockInChannel.unsubscribe();
      stockOutChannel.unsubscribe();
    };
  }, [queryClient]);
  
  // Fetch inventory data with consistent structure across roles
  const inventoryQuery = useQuery({
    queryKey: ['inventory-data', warehouseFilter, batchFilter, statusFilter],
    queryFn: async () => {
      console.log('Fetching inventory data with filters:', { warehouseFilter, batchFilter, statusFilter });
      
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
        
        if (statusFilter) {
          query = query.eq('status', statusFilter);
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
        const [productsResponse, warehousesResponse, locationsResponse, stockInResponse] = await Promise.all([
          supabase.from('products').select('id, name, description'),
          supabase.from('warehouses').select('id, name, location'),
          supabase.from('warehouse_locations').select('id, floor, zone'),
          supabase.from('stock_in').select('id, source')
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
        
        const batchSourceMap = stockInResponse.data ? stockInResponse.data.reduce((map, item) => {
          map[item.id] = item.source;
          return map;
        }, {} as Record<string, string>) : {};
        
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
          source: item.batch_id ? batchSourceMap[item.batch_id] : undefined,
          lastUpdated: new Date(item.updated_at).toLocaleString(),
        })) as InventoryItem[];
      } catch (error) {
        console.error('Error in inventory query:', error);
        throw error;
      }
    },
    staleTime: 10000, // Consider data fresh for 10 seconds to reduce API calls
  });

  // Apply search filter locally to reduce database load
  const filteredInventory = searchTerm && inventoryQuery.data
    ? inventoryQuery.data.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchId && item.batchId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.source && item.source.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : inventoryQuery.data || [];

  return {
    inventoryItems: filteredInventory,
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    refetch: inventoryQuery.refetch,
  };
};
