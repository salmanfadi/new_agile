
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserStockActivity = (userId: string | undefined, { limit }: { limit?: number } = {}) => {
  const query = useQuery({
    queryKey: ['user-stock-activity', userId, limit],
    queryFn: async () => {
      if (!userId) return { stockIn: [], stockOut: [], transfers: [] };

      // Stock In
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

      // Stock Out
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
        
      // Transfers
      let transfersQuery = supabase
        .from('inventory_movements')
        .select(`
          id,
          product:product_id(name),
          quantity,
          status,
          created_at,
          warehouse:warehouse_id(name),
          details,
          transfer_reference_id,
          reference_table,
          reference_id
        `)
        .eq('performed_by', userId)
        .eq('movement_type', 'transfer')
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
