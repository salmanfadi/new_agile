
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserStockActivity = (userId: string | undefined, { limit }: { limit?: number } = {}) => {
  const query = useQuery({
    queryKey: ['user-stock-activity', userId, limit],
    queryFn: async () => {
      if (!userId) return { stockIn: [], stockOut: [], transfers: [] };

      // Use the correct table names: stock_in and stock_out
      let stockInQuery = supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          boxes,
          status,
          created_at,
          source,
          notes
        `)
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false });

      let stockOutQuery = supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          quantity,
          approved_quantity,
          destination,
          status,
          created_at,
          reason
        `)
        .eq('requested_by', userId)
        .order('created_at', { ascending: false });
        
      // Transfers - Using the inventory_transfers table with explicit relationship hints
      let transfersQuery = supabase
        .from('inventory_transfers')
        .select(`
          id,
          products(name),
          quantity,
          status,
          created_at,
          source_warehouse:warehouses!source_warehouse_id(name),
          destination_warehouse:warehouses!destination_warehouse_id(name),
          notes,
          transfer_reason
        `)
        .eq('initiated_by', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        stockInQuery = stockInQuery.limit(limit);
        stockOutQuery = stockOutQuery.limit(limit);
        transfersQuery = transfersQuery.limit(limit);
      }

      const [stockIn, stockOut, transfers] = await Promise.all([
        stockInQuery,
        stockOutQuery,
        transfersQuery,
      ]);

      return {
        stockIn: stockIn.data || [],
        stockOut: stockOut.data || [],
        transfers: transfers.data || [],
      };
    },
    enabled: !!userId,
    initialData: { stockIn: [], stockOut: [], transfers: [] },
    refetchInterval: 5000,
  });

  // Restructure the return value to include isLoading and data properties
  return {
    isActivityLoading: query.isLoading,
    stockInActivity: query.data.stockIn,
    stockOutActivity: query.data.stockOut,
    transferActivity: query.data.transfers,
    data: query.data,
    isLoading: query.isLoading,
  };
};
