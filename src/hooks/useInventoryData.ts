
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Define interface for related data returned from Supabase
interface ProductData {
  name?: string | null;
  sku?: string | null;
}

interface WarehouseData {
  name?: string | null;
}

interface LocationData {
  floor?: number | null;
  zone?: string | null;
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
  source?: string | null;
}

// Interface for raw inventory data from Supabase
interface RawInventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  status: string;
  batch_id?: string | null;
  created_at: string;
  updated_at: string;
  products?: ProductData | null;
  warehouses?: WarehouseData | null;
  warehouse_locations?: LocationData | null;
  details?: {
    source?: string | null;
  } | null;
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
              name,
              sku
            ),
            warehouses:warehouse_id (
              name
            ),
            warehouse_locations:location_id (
              floor,
              zone
            )
          `);
        
        // Note: We removed 'details' from the select query as it doesn't exist in the inventory table
        
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
        
        // Use type assertion with safeguards
        if (!data) return [];
        
        // Transform the data with proper type handling
        return (data as unknown as RawInventoryItem[]).map((item) => {
          // Extract product info with safe type handling
          const productData = item.products || {};
          const productName = productData?.name || 'Unknown Product';
          const productSku = productData?.sku || undefined;
          
          // Extract warehouse info
          const warehouseData = item.warehouses || {};
          const warehouseName = warehouseData?.name || 'Unknown Warehouse';
          
          // Extract location info
          const locationData = item.warehouse_locations || {};
          let locationDetails = 'Unknown Location';
          
          // Safe access to potentially undefined properties
          const floor = locationData?.floor;
          const zone = locationData?.zone;
          
          if (floor !== undefined && zone !== undefined) {
            locationDetails = `Floor ${floor}, Zone ${zone}`;
          }

          // Instead of accessing details, we'll check if we have batch information
          // to potentially get source info from a separate query in the future
          // For now, we'll set source to null
          const source = null; // We've removed the details field that doesn't exist
          
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
            lastUpdated: format(new Date(item.updated_at), 'MMM d, yyyy h:mm a'),
            source
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
