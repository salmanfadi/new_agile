import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Define the shape of the joined data from Supabase
interface InventoryItemWithRelations extends Omit<InventoryItem, 'productName' | 'productSku' | 'warehouseName' | 'locationDetails'> {
  products?: ProductData | null;
  warehouses?: WarehouseData | null;
  warehouse_locations?: LocationData | null;
}

// Define proper types for inventory items
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  productCategory?: string | null;
  productSpecifications?: string | null;
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
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['inventory-data', warehouseFilter, batchFilter, statusFilter, searchTerm, page, pageSize],
    queryFn: async () => {
      try {
        let queryBuilder = supabase
          .from('inventory')
          .select(`
            *,
            products!inventory_product_fkey (
              name,
              sku,
              category,
              specifications
            ),
            warehouses!inventory_warehouse_fkey (
              name,
              location
            ),
            warehouse_locations!inventory_location_fkey (
              floor,
              zone
            )
          `, { count: 'exact' });

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
          queryBuilder = queryBuilder.or(`products.name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        queryBuilder = queryBuilder.range(from, to);

        const { data, error, count } = await queryBuilder;
        
        if (error) {
          console.error('Error fetching inventory:', error);
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        // Transform the data
        const items = (data ?? []).map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.products?.name || 'Unknown Product',
          productSku: item.products?.sku,
          productCategory: item.products?.category,
          productSpecifications: item.products?.specifications,
          warehouseId: item.warehouse_id,
          warehouseName: item.warehouses?.name || 'Unknown Warehouse',
          locationId: item.location_id,
          locationDetails: item.warehouse_locations ? 
            `Floor ${item.warehouse_locations.floor}, Zone ${item.warehouse_locations.zone}` : 
            'Unknown Location',
          barcode: item.barcode,
          quantity: item.quantity,
          color: item.color || undefined,
          size: item.size || undefined,
          status: item.status,
          batchId: item.batch_id,
          lastUpdated: item.updated_at
        }));

        return { data: items, totalCount: count ?? 0 };
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        throw error;
      }
    },
  });
};
