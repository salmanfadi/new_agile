
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataSync } from '@/context/DataSyncContext';
import { Inventory, Product, Warehouse, WarehouseLocation } from '@/types/database';

export interface ExtendedInventory extends Inventory {
  product: Product;
  warehouse: Warehouse;
  warehouse_location: WarehouseLocation;
}

interface UseRealtimeInventoryOptions {
  warehouseId?: string;
  productId?: string;
  locationId?: string;
  searchTerm?: string;
  enabled?: boolean;
}

export const useRealtimeInventory = ({
  warehouseId,
  productId,
  locationId,
  searchTerm = '',
  enabled = true
}: UseRealtimeInventoryOptions = {}) => {
  const { subscribeToTable } = useDataSync();
  
  // Subscribe to real-time updates when the component mounts
  useEffect(() => {
    if (enabled) {
      subscribeToTable('inventory');
    }
  }, [enabled, subscribeToTable]);

  // Fetch inventory with product and location details
  const inventoryQuery = useQuery({
    queryKey: ['inventory', warehouseId, productId, locationId],
    queryFn: async () => {
      let query = supabase
        .from('inventory')
        .select(`
          *,
          product:product_id(*),
          warehouse:warehouse_id(*),
          warehouse_location:location_id(*)
        `);
        
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
      
      return data as unknown as ExtendedInventory[];
    },
    enabled
  });
  
  // Filter results based on search term
  const filteredInventory = inventoryQuery.data?.filter(item => {
    if (!searchTerm) return true;
    
    return (
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];
  
  // Calculate inventory statistics
  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = new Set(filteredInventory.map(item => item.product_id)).size;
  const lowStockItems = filteredInventory.filter(item => item.quantity < 5).length;
  
  return {
    inventory: filteredInventory,
    isLoading: inventoryQuery.isLoading,
    isError: inventoryQuery.isError,
    error: inventoryQuery.error,
    totalItems,
    uniqueProducts,
    lowStockItems,
    refresh: () => inventoryQuery.refetch()
  };
};
