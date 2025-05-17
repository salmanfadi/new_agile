
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Define interface for related data returned from Supabase
interface ProductData {
  name: string;
  sku?: string;
}

interface WarehouseData {
  name: string;
}

interface LocationData {
  floor: number;
  zone: string;
}

// Define proper types for inventory items
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
  lastUpdated: string;
}

// Interface for raw inventory data from Supabase
interface RawInventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  batch_id?: string | null;
  created_at: string;
  updated_at: string;
  products: ProductData | null;
  warehouses: WarehouseData | null;
  warehouse_locations: LocationData | null;
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
        // Build query with explicit column selection to avoid type issues
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
            products:product_id (
              name:name,
              sku:sku
            ),
            warehouses:warehouse_id (
              name:name
            ),
            warehouse_locations:location_id (
              floor:floor,
              zone:zone
            )
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
          // Use more advanced search logic
          queryBuilder = queryBuilder.or(`barcode.ilike.%${searchTerm}%,products.name.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) {
          console.error('Error fetching inventory:', error);
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        console.log('Raw inventory data:', data);
        
        // Transform the data with proper type handling
        return (data || []).map((item: RawInventoryItem) => {
          // Extract product info with safe type handling
          const productData = item.products || {};
          const productName = typeof productData.name === 'string' ? productData.name : 'Unknown Product';
          const productSku = typeof productData.sku === 'string' ? productData.sku : undefined;
          
          // Extract warehouse info
          const warehouseData = item.warehouses || {};
          const warehouseName = typeof warehouseData.name === 'string' ? warehouseData.name : 'Unknown Warehouse';
          
          // Extract location info
          const locationData = item.warehouse_locations || {};
          let locationDetails = 'Unknown Location';
          
          // Safe access to potentially undefined properties
          const floor = locationData && 'floor' in locationData ? locationData.floor : undefined;
          const zone = locationData && 'zone' in locationData ? locationData.zone : undefined;
          
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
    // Optimize with stale time and cache time
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    inventoryItems: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
