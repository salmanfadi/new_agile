
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters, InventoryMovementData } from '@/types/reports';
import { format, parseISO, subDays } from 'date-fns';

export const useInventoryMovementReport = (initialFilters: ReportFilters) => {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);

  const queryResult = useQuery({
    queryKey: ['inventory-movement-report', filters],
    queryFn: async () => {
      try {
        // Build query for inventory movements
        let queryBuilder = supabase
          .from('inventory_movements')
          .select(`
            id,
            product_id,
            warehouse_id,
            location_id,
            movement_type,
            quantity,
            status,
            reference_table,
            reference_id,
            performed_by,
            created_at,
            details,
            products:product_id (name, sku),
            warehouse:warehouse_id (name),
            location:location_id (floor, zone),
            performer:performed_by (name, username)
          `);
        
        // Apply filters
        if (filters.warehouseId) {
          queryBuilder = queryBuilder.eq('warehouse_id', filters.warehouseId);
        }
        
        if (filters.productId) {
          queryBuilder = queryBuilder.eq('product_id', filters.productId);
        }
        
        if (filters.dateRange.from) {
          queryBuilder = queryBuilder.gte('created_at', filters.dateRange.from.toISOString());
        }
        
        if (filters.dateRange.to) {
          queryBuilder = queryBuilder.lte('created_at', filters.dateRange.to.toISOString());
        }
        
        if (filters.status) {
          queryBuilder = queryBuilder.eq('status', filters.status);
        }
        
        // Only get approved movements for meaningful analysis
        if (!filters.status) {
          queryBuilder = queryBuilder.eq('status', 'approved');
        }
        
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        
        const { data, error } = await queryBuilder;
        
        if (error) {
          throw new Error(`Failed to fetch inventory movements: ${error.message}`);
        }
        
        return data || [];
      } catch (err) {
        console.error('Error fetching inventory movement report:', err);
        throw err;
      }
    }
  });

  // Memoize and transform the data for the report
  const reportData: InventoryMovementData = useMemo(() => {
    const movements = queryResult.data || [];
    
    // Calculate totals
    const totalIn = movements.reduce((sum, item) => {
      if (['in', 'release'].includes(item.movement_type)) {
        return sum + (item.quantity || 0);
      }
      return sum;
    }, 0);
    
    const totalOut = movements.reduce((sum, item) => {
      if (['out', 'reserve'].includes(item.movement_type)) {
        return sum + (item.quantity || 0);
      }
      return sum;
    }, 0);
    
    const netChange = totalIn - totalOut;
    
    // Group by product
    const byProduct = movements.reduce((acc: Record<string, number>, item) => {
      const productName = item.products?.name || 'Unknown Product';
      const quantity = item.quantity || 0;
      const value = ['in', 'release'].includes(item.movement_type) ? quantity : -quantity;
      
      acc[productName] = (acc[productName] || 0) + value;
      return acc;
    }, {});
    
    // Group by warehouse
    const byWarehouse = movements.reduce((acc: Record<string, number>, item) => {
      const warehouseName = item.warehouse?.name || 'Unknown Warehouse';
      const quantity = item.quantity || 0;
      const value = ['in', 'release'].includes(item.movement_type) ? quantity : -quantity;
      
      acc[warehouseName] = (acc[warehouseName] || 0) + value;
      return acc;
    }, {});
    
    // Transform movements for display
    const transformedMovements = movements.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products?.name || 'Unknown Product',
      productSku: item.products?.sku,
      warehouseId: item.warehouse_id,
      warehouseName: item.warehouse?.name || 'Unknown Warehouse',
      locationId: item.location_id,
      locationDetails: `Floor ${item.location?.floor || '?'}, Zone ${item.location?.zone || '?'}`,
      movementType: item.movement_type,
      direction: ['in', 'release'].includes(item.movement_type) ? 'in' : 'out',
      quantity: item.quantity || 0,
      status: item.status,
      performedBy: item.performer?.name || 'Unknown',
      date: format(parseISO(item.created_at), 'yyyy-MM-dd'),
      time: format(parseISO(item.created_at), 'HH:mm:ss'),
      reference: item.reference_table ? `${item.reference_table}: ${item.reference_id}` : 'N/A',
      source: item.details?.source || 'N/A',
      notes: item.details?.notes || '',
    }));
    
    return {
      movements: transformedMovements,
      totalIn,
      totalOut,
      netChange,
      byProduct,
      byWarehouse,
    };
  }, [queryResult.data]);

  // Generate daily movement data for charts
  const dailyMovementData = useMemo(() => {
    const movements = queryResult.data || [];
    const dateMap: Record<string, { in: number; out: number }> = {};
    
    // Create a map of dates with default values
    if (filters.dateRange.from && filters.dateRange.to) {
      let currentDate = subDays(filters.dateRange.to, 30); // Default to 30 days if date range is bigger
      if (filters.dateRange.from > currentDate) {
        currentDate = filters.dateRange.from;
      }
      
      while (currentDate <= filters.dateRange.to) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        dateMap[dateKey] = { in: 0, out: 0 };
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
    } else {
      // If no date range specified, use the last 30 days
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = subDays(now, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        dateMap[dateKey] = { in: 0, out: 0 };
      }
    }
    
    // Aggregate movement data by date
    movements.forEach(movement => {
      const date = format(parseISO(movement.created_at), 'yyyy-MM-dd');
      if (!dateMap[date]) {
        dateMap[date] = { in: 0, out: 0 };
      }
      
      if (['in', 'release'].includes(movement.movement_type)) {
        dateMap[date].in += movement.quantity || 0;
      } else if (['out', 'reserve'].includes(movement.movement_type)) {
        dateMap[date].out += movement.quantity || 0;
      }
    });
    
    // Convert to array format for charts
    return Object.entries(dateMap).map(([date, values]) => ({
      date,
      in: values.in,
      out: values.out,
      net: values.in - values.out
    }));
  }, [queryResult.data, filters.dateRange]);

  return {
    data: reportData,
    dailyMovementData,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    filters,
    setFilters,
    refetch: queryResult.refetch
  };
};
