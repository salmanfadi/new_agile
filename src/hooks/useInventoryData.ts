
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
  return useQuery({
    queryKey: ['inventory-data', warehouseFilter, batchFilter, statusFilter, searchTerm],
    queryFn: async (): Promise<InventoryItem[]> => {
      console.log('Fetching inventory data with filters:', {
        warehouseFilter,
        batchFilter,
        statusFilter,
        searchTerm
      });
      
      // Build query with proper joins to get related data
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
          status,
          batch_id,
          created_at,
          updated_at,
          products:product_id (id, name, sku),
          warehouses:warehouse_id (id, name),
          warehouse_locations:location_id (id, floor, zone)
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
      
      if (searchTerm) {
        // Search in barcode or product name
        query = query.or(`barcode.ilike.%${searchTerm}%,products.name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching inventory:', error);
        throw new Error(`Failed to fetch inventory: ${error.message}`);
      }
      
      // Transform the data into our expected format
      return (data || []).map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        productSku: item.products?.sku || undefined,
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouses?.name || 'Unknown Warehouse',
        locationId: item.location_id,
        locationDetails: item.warehouse_locations 
          ? `Floor ${item.warehouse_locations.floor}, Zone ${item.warehouse_locations.zone}`
          : 'Unknown Location',
        barcode: item.barcode,
        quantity: item.quantity,
        color: item.color || undefined,
        size: item.size || undefined,
        status: item.status,
        batchId: item.batch_id,
        source: item.source,
        lastUpdated: format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')
      }));
    },
  });
};
