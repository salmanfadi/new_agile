import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StockOutRequestData {
  id: string;
  product: { name: string; id: string };
  requester: { name: string; username: string; id: string } | null;
  approvedBy: { name: string; username: string; id: string } | null;
  rejectedBy: { name: string; username: string; id: string } | null;
  completedBy: { name: string; username: string; id: string } | null;
  quantity: number;
  approvedQuantity: number | null;
  status: "pending" | "approved" | "rejected" | "processing" | "completed";
  destination: string;
  reason: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  invoice_number: string | null;
  packing_slip_number: string | null;
  reservation_id: string | null;
  details: Array<{
    id: string;
    product_id: string;
    quantity: number;
    status: "pending" | "processing" | "completed";
    barcode: string;
    batch_id: string | null;
    processed_by: { name: string; username: string; id: string } | null;
    processed_at: string | null;
  }>;
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
            rejected_by,
            completed_by,
            quantity,
            approved_quantity,
            status,
            destination,
            reason,
            created_at,
            approved_at,
            rejected_at,
            completed_at,
            invoice_number,
            packing_slip_number,
            reservation_id,
            stock_out_details (
              id,
              product_id,
              quantity,
              status,
              barcode,
              batch_id,
              processed_by,
              processed_at
            )
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
        if (filters.reservation_id) {
          query = query.eq('reservation_id', filters.reservation_id);
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

          // Get user details function
          const getUserDetails = async (userId: string | null) => {
            if (!userId) return null;
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, name, username')
              .eq('id', userId)
              .maybeSingle();
            return userData ? {
              id: userData.id,
              name: userData.name || 'Unknown User',
              username: userData.username
            } : {
              id: userId,
              name: 'Unknown User',
              username: userId.substring(0, 8) + '...'
            };
          };

          // Get all user details in parallel
          const [requester, approvedBy, rejectedBy, completedBy] = await Promise.all([
            getUserDetails(item.requested_by),
            getUserDetails(item.approved_by),
            getUserDetails(item.rejected_by),
            getUserDetails(item.completed_by)
          ]);

          // Process details
          const details = await Promise.all((item.stock_out_details || []).map(async (detail) => {
            const processedBy = await getUserDetails(detail.processed_by);
            return {
              id: detail.id,
              product_id: detail.product_id,
              quantity: detail.quantity,
              status: detail.status,
              barcode: detail.barcode,
              batch_id: detail.batch_id,
              processed_by: processedBy,
              processed_at: detail.processed_at
            };
          }));

          return {
            id: item.id,
            product,
            requester,
            approvedBy,
            rejectedBy,
            completedBy,
            quantity: item.quantity,
            approvedQuantity: item.approved_quantity,
            status: item.status,
            destination: item.destination,
            reason: item.reason,
            created_at: item.created_at,
            approved_at: item.approved_at,
            rejected_at: item.rejected_at,
            completed_at: item.completed_at,
            invoice_number: item.invoice_number,
            packing_slip_number: item.packing_slip_number,
            reservation_id: item.reservation_id,
            details
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