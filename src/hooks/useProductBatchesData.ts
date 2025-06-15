
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface BatchDetail {
  batchId: string;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  zone: string;
  floor: string;
  createdAt: string;
}

export interface ProductWithBatches {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  hsnCode: string;
  gstRate: number;
  totalQuantity: number;
  batches?: BatchDetail[];
}

export interface ProductBatchesResponse {
  data: ProductWithBatches[];
  totalCount: number;
}

export function useProductBatchesData(
  page: number = 1,
  pageSize: number = 20,
  searchQuery: string = ''
) {
  return useQuery<ProductBatchesResponse, Error>({
    queryKey: ['productBatches', page, pageSize, searchQuery],
    queryFn: () => fetchProductBatchesData(page, pageSize, searchQuery),
    staleTime: 30000
  });
}

async function fetchProductBatchesData(
  page: number,
  pageSize: number,
  searchQuery: string
): Promise<ProductBatchesResponse> {
  try {
    // Step 1: Fetch all products with pagination including HSN and GST data
    let productsQuery = supabase
      .from('products')
      .select('id, name, sku, category, hsn_code, gst_rate', { count: 'exact' });
    
    // Apply search filter if provided
    if (searchQuery) {
      productsQuery = productsQuery.or(
        `name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,hsn_code.ilike.%${searchQuery}%`
      );
    }
    
    // Apply pagination
    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + pageSize - 1;
    productsQuery = productsQuery.range(from, to);
    
    const { data: productsData, error: productsError, count: totalProductCount } = await productsQuery;
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }
    
    if (!productsData || productsData.length === 0) {
      return {
        data: [],
        totalCount: totalProductCount || 0
      };
    }
    
    // Step 2: Get all product IDs
    const productIds = productsData.map((product: any) => product.id);
    
    // Step 3: Fetch all batches for these products from processed_batches table
    const { data: batchesData, error: batchesError } = await supabase
      .from('processed_batches')
      .select('id, created_at, product_id, warehouse_id, location_id, total_quantity')
      .in('product_id', productIds);
    
    if (batchesError) {
      console.error('Error fetching batches:', batchesError);
      throw new Error(`Failed to fetch batches: ${batchesError.message}`);
    }
    
    // Step 4: Fetch warehouse details for these batches
    const warehouseIds = [...new Set(batchesData.map((batch: any) => batch.warehouse_id).filter(Boolean))];
    let warehousesData: any[] = [];
    
    if (warehouseIds.length > 0) {
      const { data: warehouses, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id, name')
        .in('id', warehouseIds);
      
      if (warehousesError) {
        console.error('Error fetching warehouses:', warehousesError);
        throw new Error(`Failed to fetch warehouses: ${warehousesError.message}`);
      }
      
      warehousesData = warehouses || [];
    }
    
    // Step 5: Fetch location details for these batches
    const locationIds = [...new Set(batchesData.map((batch: any) => batch.location_id).filter(Boolean))];
    let locationsData: any[] = [];
    
    if (locationIds.length > 0) {
      const { data: locations, error: locationsError } = await supabase
        .from('warehouse_locations')
        .select('id, floor, zone')
        .in('id', locationIds);
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        throw new Error(`Failed to fetch locations: ${locationsError.message}`);
      }
      
      locationsData = locations || [];
    }
    
    // Create lookup maps
    const warehouseMap: Record<string, any> = {};
    warehousesData.forEach((warehouse: any) => {
      if (warehouse && warehouse.id) {
        warehouseMap[warehouse.id] = warehouse;
      }
    });
    
    const locationMap: Record<string, any> = {};
    locationsData.forEach((location: any) => {
      if (location && location.id) {
        locationMap[location.id] = location;
      }
    });
    
    // Process the data to build the product batches response
    const productBatches: ProductWithBatches[] = productsData.map((product: any) => {
      // Find all batches for this product
      const productBatchesData = (batchesData || []).filter((batch: any) => batch.product_id === product.id);
      
      // Calculate total quantity across all batches
      const totalQuantity = productBatchesData.reduce((sum: number, batch: any) => sum + (batch.total_quantity || 0), 0);
      
      // Format batch details
      const batches: BatchDetail[] = productBatchesData.map((batch: any) => {
        const warehouseId = batch.warehouse_id || '';
        const warehouse = warehouseMap[warehouseId] || {};
        const warehouseName = warehouse.name || `Warehouse ${warehouseId.substring(0, 8)}`;
        
        const locationId = batch.location_id || '';
        const location = locationMap[locationId] || {};
        const locationName = `Location ${locationId.substring(0, 8)}`;
        const zone = location.zone || 'N/A';
        const floor = location.floor || 'N/A';
        
        return {
          batchId: batch.id,
          quantity: batch.total_quantity || 0,
          warehouseId,
          warehouseName,
          locationId,
          locationName,
          zone,
          floor,
          createdAt: batch.created_at
        };
      });
      
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        hsnCode: product.hsn_code || 'Not Set',
        gstRate: product.gst_rate || 0,
        totalQuantity,
        batches
      };
    });
    
    return {
      data: productBatches,
      totalCount: totalProductCount || 0
    };
  } catch (error) {
    console.error('Failed to fetch product batches:', error);
    throw error;
  }
}
