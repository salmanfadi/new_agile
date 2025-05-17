
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
      
      try {
        // First, build our query to select inventory and its relationships
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
            products:product_id(name, sku),
            warehouses:warehouse_id(name),
            warehouse_locations:location_id(floor, zone)
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
          // Search in barcode
          queryBuilder = queryBuilder.ilike('barcode', `%${searchTerm}%`);
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) {
          console.error('Error fetching inventory:', error);
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        console.log('Raw inventory data:', data);
        
        // Transform the data into our expected format
        return (data || []).map(item => {
          // Extract product info - Supabase returns this as an object with key-value pairs
          const productData = item.products || {};
          const productName = typeof productData.name === 'string' ? productData.name : 'Unknown Product';
          const productSku = typeof productData.sku === 'string' ? productData.sku : undefined;
          
          // Extract warehouse info
          const warehouseData = item.warehouses || {};
          const warehouseName = typeof warehouseData.name === 'string' ? warehouseData.name : 'Unknown Warehouse';
          
          // Extract location info
          const locationData = item.warehouse_locations || {};
          const floor = locationData.floor;
          const zone = locationData.zone;
          
          let locationDetails = 'Unknown Location';
          if (floor !== undefined && zone !== undefined) {
            locationDetails = `Floor ${floor}, Zone ${zone}`;
          }
          
          return {
            id: item.id,
            productId: item.product_id,
            productName,
            productSku,
            warehouseId: item.warehouse_id,
            warehouseName,
            locationId: item.location_id,
            locationDetails,
            barcode: item.barcode,
            quantity: item.quantity,
            color: item.color || undefined,
            size: item.size || undefined,
            status: item.status,
            batchId: item.batch_id,
            lastUpdated: format(new Date(item.updated_at), 'MMM d, yyyy h:mm a')
          };
        });
      } catch (err) {
        console.error('Error in useInventoryData:', err);
        throw err;
      }
    },
  });

  return {
    inventoryItems: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
