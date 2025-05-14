import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserStockActivity = (userId: string | undefined, { limit }: { limit?: number } = {}) => {
  return useQuery({
    queryKey: ['user-stock-activity', userId, limit],
    queryFn: async () => {
      if (!userId) return { stockIn: [], stockOut: [] };

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

      if (limit) {
        stockInQuery = stockInQuery.limit(limit);
        stockOutQuery = stockOutQuery.limit(limit);
      }

      const [stockIn, stockOut] = await Promise.all([
        stockInQuery,
        stockOutQuery,
      ]);

      return {
        stockIn: stockIn.data || [],
        stockOut: stockOut.data || [],
      };
    },
    enabled: !!userId,
    initialData: { stockIn: [], stockOut: [] },
    refetchInterval: 5000,
  });
}; 