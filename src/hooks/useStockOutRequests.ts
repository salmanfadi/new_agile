import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StockOutRequestData {
  id: string;
  product: { name: string; id: string };
  requester: { name: string; username: string; id: string } | null;
  approvedBy: { name: string; username: string; id: string } | null;
  quantity: number;
  approvedQuantity: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  destination: string;
  reason: string | null;
  created_at: string;
  invoice_number: string | null;
  packing_slip_number: string | null;
}

export const useStockOutRequests = (filters: Record<string, any> = {}, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['stock-out-requests', filters, page, pageSize],
    queryFn: async (): Promise<{ data: StockOutRequestData[]; totalCount: number }> => {
      try {
        let query = supabase
          .from('stock_out')
          .select(`
            id,
            product_id,
            requested_by,
            approved_by,
            quantity,
            approved_quantity,
            status,
            destination,
            reason,
            created_at,
            invoice_number,
            packing_slip_number
          `, { count: 'exact' });

        // Apply filters
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.destination) {
          query = query.ilike('destination', `%${filters.destination}%`);
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
        if (filters.requested_by) {
          query = query.eq('requested_by', filters.requested_by);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data: stockData, error: stockError, count } = await query.order('created_at', { ascending: false });

        if (stockError) {
          console.error('Error fetching stock out requests:', stockError);
          throw stockError;
        }

        if (!stockData || stockData.length === 0) {
          return { data: [], totalCount: count ?? 0 };
        }

        // Process each stock out record to fetch related data
        const processedData = await Promise.all(stockData.map(async (item) => {
          // Get product details
          let product = { name: 'Unknown Product', id: item.product_id || '' };
          if (item.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('id, name')
              .eq('id', item.product_id)
              .single();
            if (productData) {
              product = productData;
            }
          }

          // Get requester details
          let requester = null;
          if (item.requested_by) {
            const { data: requesterData } = await supabase
              .from('profiles')
              .select('id, name, username')
              .eq('id', item.requested_by)
              .maybeSingle();
            if (requesterData) {
              requester = {
                id: requesterData.id,
                name: requesterData.name || 'Unknown User',
                username: requesterData.username
              };
            } else {
              requester = {
                id: item.requested_by,
                name: 'Unknown User',
                username: item.requested_by.substring(0, 8) + '...'
              };
            }
          }

          // Get approver details if exists
          let approvedBy = null;
          if (item.approved_by) {
            const { data: approverData } = await supabase
              .from('profiles')
              .select('id, name, username')
              .eq('id', item.approved_by)
              .maybeSingle();
            if (approverData) {
              approvedBy = {
                id: approverData.id,
                name: approverData.name || 'Unknown Approver',
                username: approverData.username
              };
            } else {
              approvedBy = {
                id: item.approved_by,
                name: 'Unknown Approver',
                username: item.approved_by.substring(0, 8) + '...'
              };
            }
          }

          return {
            id: item.id,
            product,
            requester,
            approvedBy,
            quantity: item.quantity,
            approvedQuantity: item.approved_quantity || 0,
            status: item.status,
            destination: item.destination,
            reason: item.reason,
            created_at: item.created_at,
            invoice_number: item.invoice_number,
            packing_slip_number: item.packing_slip_number
          } as StockOutRequestData;
        }));

        return { data: processedData, totalCount: count ?? 0 };
      } catch (error) {
        console.error('Failed to fetch stock out requests:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Failed to load stock out requests',
          description: errorMessage,
        });
        return { data: [], totalCount: 0 };
      }
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}; 