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
    queryFn: async (): Promise<{ data: InventoryItem[]; totalCount: number }> => {
      console.log('Fetching inventory data with filters:', {
        warehouseFilter,
        batchFilter,
        statusFilter,
        searchTerm,
        page,
        pageSize
      });
      try {
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
            products!fk_inventory_product (
              name,
              sku
            ),
            warehouses!fk_inventory_warehouse (
              name
            ),
            warehouse_locations!fk_inventory_location (
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
          queryBuilder = queryBuilder.or(`barcode.ilike.%${searchTerm}%,products.name.ilike.%${searchTerm}%`);
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
        
        // Cast the data to our typed interface
        const typedData = data as unknown as InventoryItemWithRelations[];
        
        // Transform the data to InventoryItem[]
        const items: InventoryItem[] = (typedData ?? []).map((item: any) => {
          const productData = item.products || {};
          const productName = productData?.name || 'Unknown Product';
          const productSku = productData?.sku || undefined;
          const warehouseData = item.warehouses || {};
          const warehouseName = warehouseData?.name || 'Unknown Warehouse';
          const locationData = item.warehouse_locations || {};
          let locationDetails = 'Unknown Location';
          const floor = locationData?.floor;
          const zone = locationData?.zone;
          if (floor !== null && zone !== null) {
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
            batchId: item.batch_id || undefined,
            lastUpdated: item.updated_at,
            source: item.details?.source || null
          } as InventoryItem;
        });
        return { data: items, totalCount: count ?? 0 };
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        throw error;
      }
    },
  });
};
