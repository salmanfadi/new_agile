
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ReportFilters, InventoryItem } from '@/types/reports';

export function useInventoryStatusReport() {
  const [data, setData] = useState<{
    items: InventoryItem[];
    totalItems: number;
    totalQuantity: number;
    byStatus: Record<string, number>;
    byWarehouse: Record<string, number>;
  }>({
    items: [],
    totalItems: 0,
    totalQuantity: 0,
    byStatus: {},
    byWarehouse: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    warehouse: 'all',
    product: 'all',
    status: 'all'
  });

  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      warehouse: 'all',
      product: 'all',
      status: 'all'
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real application, we would fetch data from Supabase
      // This is mock data for demonstration purposes
      const response = await Promise.resolve({
        data: Array(50).fill(null).map((_, i) => ({
          id: `inv-${i + 1}`,
          product_id: `prod-${(i % 5) + 1}`,
          warehouse_id: `wh-${(i % 3) + 1}`,
          location_id: `loc-${(i % 10) + 1}`,
          quantity: Math.floor(Math.random() * 100) + 1,
          barcode: `BC-${100000 + i}`,
          color: ['Red', 'Blue', 'Green', 'Black', 'White'][i % 5],
          size: ['S', 'M', 'L', 'XL', 'XXL'][i % 5],
          status: ['active', 'reserved', 'damaged', 'active', 'active'][i % 5],
          created_at: new Date(2025, 0, i + 1).toISOString(),
          updated_at: new Date(2025, 3, i + 1).toISOString(),
          product_name: `Product ${String.fromCharCode(65 + (i % 5))}`,
          product_sku: `P${String.fromCharCode(65 + (i % 5))}-${1000 + i}`,
          warehouse_name: `Warehouse ${String.fromCharCode(65 + (i % 3))}`,
          location_name: `Zone ${Math.floor(i / 10) + 1} - Rack ${(i % 10) + 1}`
        })),
        error: null
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Convert to the correct InventoryItem type
      const inventoryItems: InventoryItem[] = response.data.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productSku: item.product_sku,
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouse_name,
        locationId: item.location_id,
        locationName: item.location_name,
        quantity: item.quantity,
        barcode: item.barcode,
        color: item.color,
        size: item.size,
        status: item.status
      }));

      // Apply filters
      const filteredItems = inventoryItems.filter(item => {
        const passesWarehouseFilter = 
          filters.warehouse === 'all' || 
          item.warehouseId === filters.warehouse;
          
        const passesProductFilter = 
          filters.product === 'all' || 
          item.productId === filters.product;
          
        const passesStatusFilter = 
          filters.status === 'all' || 
          item.status === filters.status;
          
        return passesWarehouseFilter && 
               passesProductFilter && 
               passesStatusFilter;
      });

      // Calculate aggregations
      const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
      
      const byStatus: Record<string, number> = {};
      const byWarehouse: Record<string, number> = {};
      
      filteredItems.forEach(item => {
        // Status aggregation
        byStatus[item.status] = (byStatus[item.status] || 0) + item.quantity;
        
        // Warehouse aggregation
        byWarehouse[item.warehouseId] = (byWarehouse[item.warehouseId] || 0) + item.quantity;
      });

      setData({
        items: filteredItems,
        totalItems: filteredItems.length,
        totalQuantity,
        byStatus,
        byWarehouse
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory status data'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh function to manually trigger data fetch
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial data fetch and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh
  };
}
