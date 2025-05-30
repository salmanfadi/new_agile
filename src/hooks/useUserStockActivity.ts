import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StockInItem {
  id: string;
  product_id: string;
  products: {
    name: string;
  };
  number_of_boxes: number;
  status: string;
  created_at: string;
  source: string;
  notes: string;
}

interface StockOutWithProduct {
  id: string;
  item_id: string;
  status: string;
  created_at: string;
  destination: string;
  notes: string;
  quantity: number;
  product_name: string;
}

interface TransferItem {
  id: string;
  products: {
    name: string;
  };
  quantity: number;
  status: string;
  created_at: string;
  source_warehouse: { name: string };
  destination_warehouse: { name: string };
  notes: string;
  transfer_reason: string;
}

export const useUserStockActivity = (userId: string | undefined, { limit }: { limit?: number } = {}) => {
  const query = useQuery({
    queryKey: ['user-stock-activity', userId, limit],
    queryFn: async () => {
      if (!userId) return { stockIn: [], stockOut: [], transfers: [] };

      // Use the correct table names and column names
      let stockInQuery = supabase
        .from('stock_in')
        .select(`
          id,
          product_id,
          products!inner(name),
          number_of_boxes,
          status,
          created_at,
          source,
          notes
        `)
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false });

      let stockOutQuery = supabase
        .from('stock_out_with_products')
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });
        
      // Transfers - Using the inventory_transfers table with explicit relationship hints
      let transfersQuery = supabase
        .from('inventory_transfers')
        .select(`
          id,
          products!inner(name),
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

      // Transform the data to match the expected format
      const transformedStockIn = (stockIn.data as StockInItem[] || []).map(item => ({
        ...item,
        boxes: item.number_of_boxes,
        product: item.products?.name || 'Unknown Product'
      }));

      // Transform stock out data to match the expected format
      const transformedStockOut = (stockOut.data as StockOutWithProduct[] || []).map(item => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        destination: item.destination,
        notes: item.notes,
        quantity: item.quantity,
        product: item.product_name || 'Unknown Product'
      }));

      const transformedTransfers = (transfers.data as TransferItem[] || []).map(item => ({
        ...item,
        product: item.products?.name || 'Unknown Product'
      }));

      return {
        stockIn: transformedStockIn,
        stockOut: transformedStockOut,
        transfers: transformedTransfers,
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
