
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

// Define TypeScript interface for Supabase response
interface InventoryResponse {
  id: string;
  product_id: string;
  products: { 
    id: string; 
    name: string; 
    description: string | null 
  }[] | null;
  warehouses: { 
    id: string; 
    name: string; 
    location: string | null 
  }[] | null;
  warehouse_locations: { 
    id: string; 
    floor: number; 
    zone: string 
  }[] | null;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  batch_id: string | null;
}

export const useInventoryData = (warehouseFilter: string = '', batchFilter: string = '', searchTerm: string = '') => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for inventory changes
  useEffect(() => {
    const channel: RealtimeChannel = supabase
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
          queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
        })
      .subscribe();

    // Clean up channel subscription when component unmounts
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  // Fetch batch IDs for filter
  const batchIdsQuery = useQuery({
    queryKey: ['batch-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in_details')
        .select('id')  // Select the id column which is referenced by batch_id
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
          
        if (warehouseFilter) {
          query = query.eq('warehouse_id', warehouseFilter);
        }
        
        if (batchFilter) {
          query = query.eq('batch_id', batchFilter);
        }
        
        query = query.order('updated_at', { ascending: false });
          
        const { data: inventoryData, error: inventoryError } = await query;
          
        if (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
          throw inventoryError;
        }

        // Fetch products, warehouses, and locations data separately
        const { data: products } = await supabase
          .from('products')
          .select('id, name, description');
        
        const { data: warehouses } = await supabase
          .from('warehouses')
          .select('id, name, location');
        
        const { data: locations } = await supabase
          .from('warehouse_locations')
          .select('id, floor, zone');
        
        // Create lookup maps
        const productMap = products ? products.reduce((map, item) => {
          map[item.id] = item;
          return map;
        }, {} as Record<string, any>) : {};
        
        const warehouseMap = warehouses ? warehouses.reduce((map, item) => {
          map[item.id] = item;
          return map;
        }, {} as Record<string, any>) : {};
        
        const locationMap = locations ? locations.reduce((map, item) => {
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
