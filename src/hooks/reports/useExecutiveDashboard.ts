
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters, ExecutiveSummaryData } from '@/types/reports';
import { format, parseISO, subDays } from 'date-fns';

export const useExecutiveDashboard = (initialFilters: ReportFilters) => {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  
  // Fetch inventory movements
  const movementsQuery = useQuery({
    queryKey: ['executive-movements', filters],
    queryFn: async () => {
      try {
        let queryBuilder = supabase
          .from('inventory_movements')
          .select(`
            id,
            product_id,
            movement_type,
            quantity,
            status,
            created_at,
            products:product_id (name, sku)
          `)
          .eq('status', 'approved');
        
        if (filters.dateRange.from) {
          queryBuilder = queryBuilder.gte('created_at', filters.dateRange.from.toISOString());
        }
        
        if (filters.dateRange.to) {
          queryBuilder = queryBuilder.lte('created_at', filters.dateRange.to.toISOString());
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching movements for executive dashboard:', err);
        throw err;
      }
    }
  });
  
  // Fetch inventory levels
  const inventoryQuery = useQuery({
    queryKey: ['executive-inventory', filters],
    queryFn: async () => {
      try {
        // Using the get_inventory_levels function
        const { data, error } = await supabase.rpc('get_inventory_levels');
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching inventory levels for executive dashboard:', err);
        throw err;
      }
    }
  });

  // Process and memoize the data
  const executiveSummary: ExecutiveSummaryData = useMemo(() => {
    const movements = movementsQuery.data || [];
    const inventory = inventoryQuery.data || [];
    
    // Calculate total inventory value (assuming average item value of $10 for demo)
    const avgItemValue = 10; // In a real scenario, this would come from product pricing data
    const inventoryValue = inventory.reduce(
      (total, item) => total + (item.stock_level * avgItemValue), 
      0
    );
    
    // Calculate movement totals
    const inMovements = movements.filter(m => 
      ['in', 'release'].includes(m.movement_type)
    ).reduce((sum, m) => sum + (m.quantity || 0), 0);
    
    const outMovements = movements.filter(m => 
      ['out', 'reserve'].includes(m.movement_type)
    ).reduce((sum, m) => sum + (m.quantity || 0), 0);
    
    // Calculate inventory turnover rate (simplified)
    // In a real scenario: Cost of Goods Sold / Average Inventory Value
    const totalStock = inventory.reduce((sum, item) => sum + item.stock_level, 0);
    const turnoverRate = totalStock > 0 ? outMovements / totalStock : 0;
    
    // Find top products by quantity
    const productQuantities: Record<string, { id: string, name: string, quantity: number }> = {};
    
    inventory.forEach(item => {
      const productId = item.product_id;
      const productName = item.product_name;
      
      if (!productQuantities[productId]) {
        productQuantities[productId] = {
          id: productId,
          name: productName,
          quantity: 0
        };
      }
      
      productQuantities[productId].quantity += item.stock_level;
    });
    
    const topProducts = Object.values(productQuantities)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // Calculate warehouse utilization
    const warehouseUtilization: Record<string, number> = {};
    const warehouseTotals: Record<string, number> = {};
    
    inventory.forEach(item => {
      const warehouseName = item.warehouse_name;
      
      if (!warehouseUtilization[warehouseName]) {
        warehouseUtilization[warehouseName] = 0;
      }
      
      warehouseUtilization[warehouseName] += item.stock_level;
      warehouseTotals[warehouseName] = (warehouseTotals[warehouseName] || 0) + 1;
    });
    
    // Convert to utilization percentages (simplified for demo)
    Object.keys(warehouseUtilization).forEach(warehouse => {
      const total = warehouseTotals[warehouse];
      // Assuming each location has capacity of 100 units for demo purposes
      warehouseUtilization[warehouse] = warehouseUtilization[warehouse] / (total * 100);
    });
    
    return {
      inventoryValue,
      turnoverRate,
      stockMovements: {
        in: inMovements,
        out: outMovements,
        net: inMovements - outMovements
      },
      topProducts,
      warehouseUtilization
    };
  }, [movementsQuery.data, inventoryQuery.data]);

  // Generate daily movement data for time series charts
  const timeSeriesData = useMemo(() => {
    const movements = movementsQuery.data || [];
    const dateMap: Record<string, { in: number; out: number; net: number }> = {};
    
    // Create a map of dates with default values
    if (filters.dateRange.from && filters.dateRange.to) {
      let currentDate = subDays(filters.dateRange.to, 30); // Default to 30 days if date range is bigger
      if (filters.dateRange.from > currentDate) {
        currentDate = filters.dateRange.from;
      }
      
      while (currentDate <= filters.dateRange.to) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        dateMap[dateKey] = { in: 0, out: 0, net: 0 };
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
    } else {
      // If no date range specified, use the last 30 days
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = subDays(now, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        dateMap[dateKey] = { in: 0, out: 0, net: 0 };
      }
    }
    
    // Aggregate movement data by date
    movements.forEach(movement => {
      const date = format(parseISO(movement.created_at), 'yyyy-MM-dd');
      if (!dateMap[date]) {
        dateMap[date] = { in: 0, out: 0, net: 0 };
      }
      
      if (['in', 'release'].includes(movement.movement_type)) {
        dateMap[date].in += movement.quantity || 0;
        dateMap[date].net += movement.quantity || 0;
      } else if (['out', 'reserve'].includes(movement.movement_type)) {
        dateMap[date].out += movement.quantity || 0;
        dateMap[date].net -= movement.quantity || 0;
      }
    });
    
    // Convert to array format for charts
    return Object.entries(dateMap).map(([date, values]) => ({
      date,
      in: values.in,
      out: values.out,
      net: values.net
    }));
  }, [movementsQuery.data, filters.dateRange]);

  return {
    data: executiveSummary,
    timeSeriesData,
    isLoading: movementsQuery.isLoading || inventoryQuery.isLoading,
    error: movementsQuery.error || inventoryQuery.error,
    filters,
    setFilters,
    refetch: () => {
      movementsQuery.refetch();
      inventoryQuery.refetch();
    }
  };
};
