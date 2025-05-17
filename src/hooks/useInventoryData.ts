
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationDetails: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  batchId?: string | null;
  source?: string;
  lastUpdated: string;
}

export const useInventoryData = (
  warehouseFilter: string = '',
  batchFilter: string = '',
  statusFilter: string = '',
  searchTerm: string = '',
) => {
  const query = useQuery({
    queryKey: ['inventory-data', warehouseFilter, batchFilter, statusFilter, searchTerm],
    queryFn: async (): Promise<InventoryItem[]> => {
      console.log('Fetching inventory data with filters:', {
        warehouseFilter,
        batchFilter,
        statusFilter,
        searchTerm
      });
      
      // Build query with proper column hints for relationships
      let queryBuilder = supabase
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
          status,
          batch_id,
          created_at,
          updated_at,
          products(id, name, sku),
          warehouses(id, name),
          warehouse_locations(id, floor, zone)
        `);
      
      // Apply filters
      if (warehouseFilter) {
        queryBuilder = queryBuilder.eq('warehouse_id', warehouseFilter);
      }
      
      if (batchFilter) {
        queryBuilder = queryBuilder.eq('batch_id', batchFilter);
      }
      
      if (statusFilter) {
        queryBuilder = queryBuilder.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        // Search in barcode or related product name
        queryBuilder = queryBuilder.or(`barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.error('Error fetching inventory:', error);
        throw new Error(`Failed to fetch inventory: ${error.message}`);
      }
      
      // Transform the data into our expected format
      return (data || []).map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.[0]?.name || 'Unknown Product',
        productSku: item.products?.[0]?.sku || undefined,
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouses?.[0]?.name || 'Unknown Warehouse',
        locationId: item.location_id,
        locationDetails: item.warehouse_locations?.[0] 
          ? `Floor ${item.warehouse_locations[0].floor}, Zone ${item.warehouse_locations[0].zone}`
          : 'Unknown Location',
        barcode: item.barcode,
        quantity: item.quantity,
        color: item.color || undefined,
        size: item.size || undefined,
        status: item.status,
        batchId: item.batch_id,
        source: undefined, // Changed from item.source since it doesn't exist in the schema
        lastUpdated: format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')
      }));
    },
  });

  return {
    inventoryItems: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
