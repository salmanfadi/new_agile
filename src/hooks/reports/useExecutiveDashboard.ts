
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters } from '@/types/reports';
import { format, parseISO, subDays } from 'date-fns';

// Add the missing type
export interface ExecutiveSummaryData {
  inventoryValue: number;
  turnoverRate: number;
  stockMovements: {
    in: number;
    out: number;
    net: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  warehouseUtilization: Record<string, number>;
}

export const useExecutiveDashboard = (initialFilters: ReportFilters) => {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ExecutiveSummaryData>({
    inventoryValue: 0,
    turnoverRate: 0,
    stockMovements: { in: 0, out: 0, net: 0 },
    topProducts: [],
    warehouseUtilization: {},
  });
  const [timeSeriesData, setTimeSeriesData] = useState<Array<{ date: string; in: number; out: number; net: number }>>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Date range for filtering
      const fromDate = filters.dateRange?.from || subDays(new Date(), 30);
      const toDate = filters.dateRange?.to || new Date();

      // Format dates for Supabase query
      const fromDateString = format(fromDate, 'yyyy-MM-dd');
      const toDateString = format(toDate, 'yyyy-MM-dd');

      // 1. Get inventory value and count
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product_id,
          products:product_id (
            name, 
            sku
          )
        `)
        .gt('quantity', 0);

      if (inventoryError) throw inventoryError;

      // Calculate inventory value (using a dummy average value per item for simplicity)
      // In a real implementation, you would join with a price table or use product prices
      const averageItemValue = 100; // $100 per item
      const totalInventoryValue = inventoryData.reduce((sum, item) => {
        // Use optional chaining and type checking to safely access product name
        const productDetails = item.products as { name?: string; sku?: string } | null;
        return sum + (item.quantity * averageItemValue);
      }, 0);
      
      // 2. Get stock movements for turnover calculation
      const { data: movementsData, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('movement_type, quantity, created_at')
        .gte('created_at', fromDateString)
        .lte('created_at', toDateString)
        .order('created_at');

      if (movementsError) throw movementsError;

      // Calculate stock in/out
      const stockIn = movementsData
        .filter(m => m.movement_type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);
        
      const stockOut = movementsData
        .filter(m => m.movement_type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);

      // Simple turnover calculation
      const totalInventoryItems = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
      const turnoverRate = totalInventoryItems > 0 ? stockOut / totalInventoryItems * (365 / 30) : 0;

      // 3. Get top products by quantity
      const productSummary = inventoryData.reduce((acc, item) => {
        const productId = item.product_id;
        const productDetails = item.products as { name?: string; sku?: string } | null;
        const productName = productDetails?.name || 'Unknown Product';
        
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: productName,
            quantity: 0
          };
        }
        
        acc[productId].quantity += item.quantity;
        return acc;
      }, {} as Record<string, { id: string; name: string; quantity: number }>);

      const topProducts = Object.values(productSummary)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // 4. Get warehouse utilization
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id, name');

      if (warehouseError) throw warehouseError;

      // Calculate items per warehouse
      const warehouseUtilization: Record<string, number> = {};
      
      for (const warehouse of warehouseData) {
        const { data: warehouseItems, error: warehouseItemsError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('warehouse_id', warehouse.id);
          
        if (warehouseItemsError) throw warehouseItemsError;
        
        const warehouseTotal = warehouseItems.reduce((sum, item) => sum + item.quantity, 0);
        warehouseUtilization[warehouse.name] = warehouseTotal;
      }

      // 5. Generate time series data
      const timeSeriesMap = new Map<string, { in: number, out: number, net: number }>();
      
      // Initialize with dates in range
      const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24));
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(toDate, days - i), 'yyyy-MM-dd');
        timeSeriesMap.set(date, { in: 0, out: 0, net: 0 });
      }
      
      // Fill with actual data
      movementsData.forEach(movement => {
        const date = format(parseISO(movement.created_at), 'yyyy-MM-dd');
        const existing = timeSeriesMap.get(date) || { in: 0, out: 0, net: 0 };
        
        if (movement.movement_type === 'in') {
          existing.in += movement.quantity;
          existing.net += movement.quantity;
        } else if (movement.movement_type === 'out') {
          existing.out += movement.quantity;
          existing.net -= movement.quantity;
        }
        
        timeSeriesMap.set(date, existing);
      });
      
      // Convert Map to array for rendering
      const timeSeriesResult = Array.from(timeSeriesMap.entries())
        .map(([date, values]) => ({
          date,
          ...values
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData({
        inventoryValue: totalInventoryValue,
        turnoverRate: parseFloat(turnoverRate.toFixed(1)),
        stockMovements: {
          in: stockIn,
          out: stockOut,
          net: stockIn - stockOut
        },
        topProducts,
        warehouseUtilization
      });
      
      setTimeSeriesData(timeSeriesResult);

    } catch (err) {
      console.error('Error fetching executive dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  return {
    data,
    timeSeriesData,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchDashboardData
  };
};
