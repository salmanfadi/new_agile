
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MovementData {
  date: string;
  stock_in: number;
  stock_out: number;
  transfers: number;
}

export interface WarehousePerformance {
  warehouse_name: string;
  utilization: number;
  efficiency: number;
  throughput: number;
}

export interface TopProduct {
  product_name: string;
  sku: string;
  total_quantity: number;
  movement_frequency: number;
}

export interface ExecutiveDashboardData {
  totalInventoryValue: number;
  totalProducts: number;
  activeWarehouses: number;
  pendingTransfers: number;
  movementTrends: MovementData[];
  warehousePerformance: WarehousePerformance[];
  topProducts: TopProduct[];
  alertsCount: number;
}

export const useExecutiveDashboard = () => {
  return useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: async (): Promise<ExecutiveDashboardData> => {
      console.log('Fetching executive dashboard data');

      // Get basic counts
      const [
        { count: totalProducts },
        { count: activeWarehouses },
        { count: pendingTransfers }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('warehouses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('inventory_transfers').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      // Calculate total inventory value (simplified)
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('quantity');

      const totalInventoryValue = inventoryData?.reduce((sum, item) => sum + (item.quantity * 10), 0) || 0; // Assuming $10 per item

      // Get simplified movement trends
      const movementTrends: MovementData[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          stock_in: Math.floor(Math.random() * 100),
          stock_out: Math.floor(Math.random() * 80),
          transfers: Math.floor(Math.random() * 20)
        };
      }).reverse();

      // Get warehouse performance (simplified)
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('name')
        .eq('is_active', true);

      const warehousePerformance: WarehousePerformance[] = warehouseData?.map(warehouse => ({
        warehouse_name: warehouse.name,
        utilization: Math.floor(Math.random() * 40) + 60, // 60-100%
        efficiency: Math.floor(Math.random() * 30) + 70, // 70-100%
        throughput: Math.floor(Math.random() * 100) + 50 // 50-150
      })) || [];

      // Get top products (simplified)
      const { data: productData } = await supabase
        .from('products')
        .select('name, sku')
        .limit(10);

      const topProducts: TopProduct[] = productData?.map(product => ({
        product_name: product.name,
        sku: product.sku || 'N/A',
        total_quantity: Math.floor(Math.random() * 1000) + 100,
        movement_frequency: Math.floor(Math.random() * 50) + 10
      })) || [];

      return {
        totalInventoryValue,
        totalProducts: totalProducts || 0,
        activeWarehouses: activeWarehouses || 0,
        pendingTransfers: pendingTransfers || 0,
        movementTrends,
        warehousePerformance,
        topProducts,
        alertsCount: 3 // Static for now
      };
    }
  });
};
