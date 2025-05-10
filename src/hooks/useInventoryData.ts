
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define proper types for the payload objects
type StockInPayload = {
  eventType: string;
  schema: string;
  table: string;
  new: {
    id: string;
    status: string;
    [key: string]: any;
  };
  old?: {
    status?: string;
    [key: string]: any;
  } | null;
};

type StockOutPayload = {
  eventType: string;
  schema: string;
  table: string;
  new: {
    id: string;
    status: string;
    [key: string]: any;
  };
  old?: {
    status?: string;
    [key: string]: any;
  } | null;
};

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
  productDescription?: string;
  productSku?: string;
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
    console.log('Current filters:', { warehouseFilter, batchFilter, statusFilter, searchTerm });
    
    // Subscribe to inventory table for any changes
    const inventoryChannel: RealtimeChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes', 
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
        }
      )
      .subscribe();
      
    // Subscribe to stock_in table for status changes
    const stockInChannel: RealtimeChannel = supabase
      .channel('stock-in-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_in' },
        (payload: any) => {
          const typedPayload = payload as StockInPayload;
          console.log('Stock in change detected:', typedPayload);
          
          // If stock in is completed or processing, refresh inventory data
          if (typedPayload.new && ['completed', 'processing'].includes(typedPayload.new.status)) {
            console.log(`Stock in status changed to ${typedPayload.new.status}, refreshing inventory`);
            toast({
              title: `Stock In ${typedPayload.new.status}`,
              description: typedPayload.new.status === 'completed' 
                ? 'New inventory has been added from stock-in processing' 
                : 'Stock-in items are being processed',
            });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
        }
      )
      .subscribe();
      
    // Subscribe to stock_out table for status changes
    const stockOutChannel: RealtimeChannel = supabase
      .channel('stock-out-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_out' },
        (payload: any) => {
          const typedPayload = payload as StockOutPayload;
          console.log('Stock out change detected:', typedPayload);
          
          // If stock out status changes, refresh inventory
          if (typedPayload.new && ['approved', 'completed'].includes(typedPayload.new.status)) {
            toast({
              title: `Stock Out ${typedPayload.new.status}`,
              description: `Stock out request has been ${typedPayload.new.status}`,
            });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
        }
      )
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
    queryKey: ['inventory-data', warehouseFilter, batchFilter, statusFilter, searchTerm],
    queryFn: async () => {
      console.log('Fetching inventory data with filters:', { warehouseFilter, batchFilter, statusFilter, searchTerm });
      
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
          
        // Apply filters only if they have valid values
        if (warehouseFilter && warehouseFilter.trim() !== '') {
          console.log(`Applying warehouse filter: ${warehouseFilter}`);
          query = query.eq('warehouse_id', warehouseFilter);
        }
        
        if (batchFilter && batchFilter.trim() !== '') {
          console.log(`Applying batch filter: ${batchFilter}`);
          query = query.eq('batch_id', batchFilter);
        }
        
        if (statusFilter && statusFilter.trim() !== '') {
          console.log(`Applying status filter: ${statusFilter}`);
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

        console.log(`Found ${inventoryData?.length || 0} inventory items before fetching related data`);
        
        if (!inventoryData || inventoryData.length === 0) {
          console.log('No inventory data found with current filters');
          return [];
        }

        // Extract unique IDs for batch querying
        const productIds = [...new Set(inventoryData.map(item => item.product_id))];
        const warehouseIds = [...new Set(inventoryData.map(item => item.warehouse_id))];
        const locationIds = [...new Set(inventoryData.map(item => item.location_id))];
        const batchIds = [...new Set(inventoryData.filter(item => item.batch_id).map(item => item.batch_id))];
        
        console.log(`Fetching related data for ${productIds.length} products, ${warehouseIds.length} warehouses, ${locationIds.length} locations, and ${batchIds.length} batches`);

        // Fetch related data in parallel for better performance
        const [productsResponse, warehousesResponse, locationsResponse, stockInResponse] = await Promise.all([
          supabase.from('products').select('id, name, description, sku').in('id', productIds),
          supabase.from('warehouses').select('id, name, location').in('id', warehouseIds),
          supabase.from('warehouse_locations').select('id, floor, zone').in('id', locationIds),
          batchIds.length > 0 ? supabase.from('stock_in').select('id, source').in('id', batchIds) : { data: [] }
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
          map[item.id] = item.source || '';
          return map;
        }, {} as Record<string, string>) : {};
        
        // Map the inventory data with the related entities
        const mappedInventory = inventoryData.map(item => {
          const product = productMap[item.product_id] || { name: 'Unknown Product', description: '', sku: '' };
          const warehouse = warehouseMap[item.warehouse_id] || { name: 'Unknown Warehouse', location: '' };
          const location = locationMap[item.location_id];
          
          return {
            id: item.id,
            productName: product.name,
            productId: item.product_id,
            productDescription: product.description,
            productSku: product.sku,
            warehouseName: warehouse.name,
            warehouseId: item.warehouse_id,
            warehouseLocation: warehouse.location || '',
            locationId: item.location_id,
            locationDetails: location 
              ? `Floor ${location.floor}, Zone ${location.zone}`
              : 'Unknown Location',
            barcode: item.barcode,
            quantity: item.quantity,
            color: item.color || '-',
            size: item.size || '-',
            status: item.status || 'available',
            batchId: item.batch_id,
            source: item.batch_id ? batchSourceMap[item.batch_id] : undefined,
            lastUpdated: new Date(item.updated_at).toLocaleString(),
          };
        }) as InventoryItem[];

        console.log(`Mapped ${mappedInventory.length || 0} inventory items with relationship data`);
        
        return mappedInventory;
      } catch (error) {
        console.error('Error in inventory query:', error);
        throw error;
      }
    }
  });

  // Apply search filter locally if there's a search term
  let filteredResults = inventoryQuery.data || [];
  
  if (searchTerm && searchTerm.trim() !== '') {
    console.log(`Applying client-side search filter: ${searchTerm}`);
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    filteredResults = filteredResults.filter(item => 
      (item.productName && item.productName.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.warehouseName && item.warehouseName.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.barcode && item.barcode.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.productSku && item.productSku.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.batchId && item.batchId.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.source && item.source.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.color && item.color.toLowerCase() !== '-' && item.color.toLowerCase().includes(normalizedSearchTerm)) ||
      (item.size && item.size.toLowerCase() !== '-' && item.size.toLowerCase().includes(normalizedSearchTerm))
    );
    
    console.log(`Found ${filteredResults.length} items after search filtering`);
  }

  return {
    inventoryItems: filteredResults,
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    refetch: inventoryQuery.refetch,
  };
};
