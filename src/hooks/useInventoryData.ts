import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

// Export the types so they can be used elsewhere
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  productCategory?: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationDetails: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  batchId?: string;
  lastUpdated: string;
}

export interface InventoryDataResponse {
  data: InventoryItem[];
  totalCount: number;
  isPartialData?: boolean;
}

// Types are now exported at the top of the file

// Define a more specific type for the query key to avoid deep instantiation issues
type InventoryQueryKey = readonly [string, string, string, string, string, number, number];

export const useInventoryData = (
  warehouseFilter: string = '',
  batchFilter: string = '',
  statusFilter: string = '',
  searchTerm: string = '',
  page: number = 1,
  pageSize: number = 20
) => {
  // Get the query client inside the hook
  const queryClient = useQueryClient();
  
  // Create a query key based on all parameters
  const queryKey: InventoryQueryKey = [
    'inventory-data',
    warehouseFilter,
    batchFilter,
    statusFilter,
    searchTerm,
    page,
    pageSize
  ];

  // Prefetch next page only if we have data on the current page
  useEffect(() => {
    const prefetchNextPage = async () => {
      // Get current data to check if we should prefetch next page
      const currentData = queryClient.getQueryData<InventoryDataResponse>(queryKey);
      
      // Only prefetch if we have data and it's a full page (indicating there might be more)
      if (currentData?.data && currentData.data.length >= pageSize) {
        const nextPage = page + 1;
        const nextQueryKey: InventoryQueryKey = [
          'inventory-data',
          warehouseFilter,
          batchFilter,
          statusFilter,
          searchTerm,
          nextPage,
          pageSize
        ];
        
        // Check if we already have this data cached
        const hasNextPage = queryClient.getQueryData(nextQueryKey);
        if (!hasNextPage) {
          await queryClient.prefetchQuery({
            queryKey: nextQueryKey,
            queryFn: () => fetchInventoryData(warehouseFilter, batchFilter, statusFilter, searchTerm, nextPage, pageSize, true, queryClient)
          });
        }
      }
    };

    // Don't prefetch on first render, wait for data
    const timer = setTimeout(() => {
      prefetchNextPage();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [queryClient, warehouseFilter, batchFilter, statusFilter, searchTerm, page, pageSize, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => fetchInventoryData(warehouseFilter, batchFilter, statusFilter, searchTerm, page, pageSize, false, queryClient),
    staleTime: 30000, // Keep data fresh for 30 seconds
    placeholderData: (previousData) => previousData, // Use previous data while loading
  });
};

// Separate function to fetch inventory data with optimizations
async function fetchInventoryData(
  warehouseFilter: string,
  batchFilter: string,
  statusFilter: string,
  searchTerm: string,
  page: number,
  pageSize: number,
  isPrefetch: boolean = false,
  _queryClient?: any // Optional parameter to pass the queryClient
): Promise<InventoryDataResponse> {
  try {
    // First fetch just the essential data quickly
    const essentialFields = `id, barcode, quantity, status, product_id, warehouse_id, location_id, updated_at`;

    // For prefetching, we only need the count
    const selectFields = isPrefetch ? 'id' : essentialFields;

    // Build the query for essential data
    let queryBuilder = supabase
      .from('inventory')
      .select(selectFields, { count: 'exact' });

    // Apply filters
    if (warehouseFilter) {
      queryBuilder = queryBuilder.eq('warehouse_id', warehouseFilter);
    }
    if (batchFilter) {
      // Check if the batch ID is valid before querying
      if (batchFilter.trim().length > 0) {
        queryBuilder = queryBuilder.eq('batch_id', batchFilter);
      }
    }
    if (statusFilter) {
      queryBuilder = queryBuilder.eq('status', statusFilter);
    }
    if (searchTerm) {
      // Optimize search by using more efficient query patterns
      if (searchTerm.length > 3) {
        queryBuilder = queryBuilder.ilike('barcode', `%${searchTerm}%`);
      } else {
        queryBuilder = queryBuilder.eq('barcode', searchTerm);
      }
    }

    // Pagination with safety checks
    const from = Math.max(0, (page - 1) * pageSize); // Ensure from is never negative
    const to = from + pageSize - 1;
    
    // For prefetching, first check if there's data in this range
    if (isPrefetch) {
      // First check the count to avoid range errors
      const { count: totalCount, error: countError } = await supabase
        .from('inventory')
        .select('id', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error checking count:', countError);
        return { data: [], totalCount: 0 };
      }
      
      // If requesting a range beyond available data, return empty result
      if (totalCount === null || from >= totalCount) {
        return { data: [], totalCount: totalCount ?? 0 };
      }
    }
    
    queryBuilder = queryBuilder.range(from, to);

    // Execute the query
    const { data: essentialData, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching inventory:', error);
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    // If this is just a prefetch, return minimal data
    if (isPrefetch) {
      return { data: [], totalCount: count ?? 0 };
    }

    // Create partial items with essential data
    const partialItems: InventoryItem[] = (essentialData ?? []).map((item: any) => {
      // Type guard function to safely access properties
      const safeGet = <T>(obj: any, key: string, defaultValue: T, converter: (val: any) => T): T => {
        if (typeof obj === 'object' && obj !== null && key in obj) {
          return converter(obj[key]);
        }
        return defaultValue;
      };
      
      // Safely access properties with type checking
      const id = safeGet<string>(item, 'id', '', String);
      const product_id = safeGet<string>(item, 'product_id', '', String);
      const warehouse_id = safeGet<string>(item, 'warehouse_id', '', String);
      const location_id = safeGet<string>(item, 'location_id', '', String);
      const barcode = safeGet<string>(item, 'barcode', '', String);
      const quantity = safeGet<number>(item, 'quantity', 0, Number);
      const status = safeGet<string>(item, 'status', '', String);
      const updated_at = safeGet<string>(item, 'updated_at', '', String);

      return {
        id,
        productId: product_id,
        productName: 'Loading...', // Placeholder
        warehouseId: warehouse_id,
        warehouseName: 'Loading...', // Placeholder
        locationId: location_id,
        locationDetails: 'Loading...', // Placeholder
        barcode,
        quantity,
        status,
        lastUpdated: updated_at
      };
    });

    // Return partial data immediately
    const partialResponse: InventoryDataResponse = {
      data: partialItems,
      totalCount: count ?? 0,
      isPartialData: true
    };

    // Fetch complete data in the background
    setTimeout(async () => {
      try {
        // We already have the queryClient from the hook scope
        // Get the IDs of the items we need to fetch details for
        const itemIds = (essentialData || []).filter((item: any) =>
          typeof item === 'object' && item !== null && 'id' in item
        ).map((item: any) => String(item.id));

        if (itemIds.length === 0) return;

        // Fetch detailed data for these specific items
        const { data: detailedData, error: detailError } = await supabase
          .from('inventory')
          .select(`
            id,
            product_id,
            products (name, sku, category),
            warehouse_id,
            warehouses (name, location),
            location_id,
            warehouse_locations (floor, zone),
            color,
            size,
            batch_id
          `)
          .in('id', itemIds);

        if (detailError) {
          console.error('Error fetching detailed inventory data:', detailError);
          return;
        }

        // Create a map for quick lookup
        const detailsMap = new Map<string, any>();
        (detailedData || []).forEach((item: any) => {
          if (typeof item === 'object' && item !== null && 'id' in item) {
            detailsMap.set(String(item.id), item);
          }
        });

        // Enhance the partial items with detailed data
        const completeItems = partialItems.map((item: InventoryItem) => {
          const details: any = detailsMap.get(item.id);
          if (!details) return item;

          // Safely extract nested properties
          const products = details && typeof details === 'object' && 'products' in details ? details.products : null;
          const warehouses = details && typeof details === 'object' && 'warehouses' in details ? details.warehouses : null;
          const warehouse_locations = details && typeof details === 'object' && 'warehouse_locations' in details ? details.warehouse_locations : null;
          
          // Create location details string if location data exists
          let locationDetailsText = 'Unknown Location';
          if (warehouse_locations && typeof warehouse_locations === 'object' && 
              'floor' in warehouse_locations && 'zone' in warehouse_locations) {
            locationDetailsText = `Floor ${warehouse_locations.floor}, Zone ${warehouse_locations.zone}`;
          }
          
          return {
            ...item,
            productName: products && typeof products === 'object' && 'name' in products ? String(products.name) : 'Unknown Product',
            productSku: products && typeof products === 'object' && 'sku' in products ? String(products.sku) : undefined,
            productCategory: products && typeof products === 'object' && 'category' in products ? String(products.category) : undefined,
            warehouseName: warehouses && typeof warehouses === 'object' && 'name' in warehouses ? String(warehouses.name) : 'Unknown Warehouse',
            locationDetails: locationDetailsText,
            color: details && typeof details === 'object' && 'color' in details ? String(details.color) : undefined,
            size: details && typeof details === 'object' && 'size' in details ? String(details.size) : undefined,
            batchId: details && typeof details === 'object' && 'batch_id' in details ? String(details.batch_id) : undefined
          };
        });
        
        // Update the query cache with complete data
        // Create a properly typed query key
        const updateQueryKey: InventoryQueryKey = [
          'inventory-data', 
          warehouseFilter, 
          batchFilter, 
          statusFilter, 
          searchTerm, 
          page, 
          pageSize
        ];
        
        if (_queryClient) {
          _queryClient.setQueryData(updateQueryKey, {
            data: completeItems,
            totalCount: count ?? 0,
            isPartialData: false
          });
        }
      } catch (err) {
        console.error('Error fetching detailed data:', err);
      }
    }, 0); // Start immediately but asynchronously
    
    return partialResponse;
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    throw error;
  }
}
