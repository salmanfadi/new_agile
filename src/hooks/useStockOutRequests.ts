
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define user profile type to avoid deep nesting issues
type UserProfile = {
  id: string;
  name: string;
  username: string;
} | null;

// Define stock out detail type separately
type StockOutDetail = {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string | null;
  updated_at: string | null;
};

// Main stock out request data interface
export interface StockOutRequestData {
  id: string;
  product: { name: string; id: string };
  requester: UserProfile;
  approvedBy: UserProfile;
  rejectedBy: UserProfile;
  completedBy: UserProfile;
  quantity: number;
  approvedQuantity: number | null;
  status: "pending" | "approved" | "rejected" | "completed";
  destination: string;
  reason: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  invoice_number: string | null;
  packing_slip_number: string | null;
  reservation_id: string | null;
  details: StockOutDetail[];
}

export interface StockOutRequestFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'completed';
  destination?: string;
  date_from?: string;
  date_to?: string;
  requested_by?: string;
  reservation_id?: string;
  [key: string]: any;
}

export const useStockOutRequests = (filters: StockOutRequestFilters = {}, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['stock-out-requests', filters, page, pageSize],
    queryFn: async (): Promise<{ data: StockOutRequestData[]; totalCount: number }> => {
      try {
        let query = supabase
          .from('stock_out')
          .select(`
            id,
            requested_by,
            approved_by,
            status,
            destination,
            notes,
            created_at,
            approved_at,
            updated_at,
            stock_out_details (
              id,
              product_id,
              quantity,
              created_at,
              updated_at
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
          let product = { name: 'Unknown Product', id: '' };
          if (item.stock_out_details && item.stock_out_details.length > 0) {
            const productId = item.stock_out_details[0].product_id;
            if (productId) {
              const { data: productData } = await supabase
                .from('products')
                .select('id, name')
                .eq('id', productId)
                .single();
              if (productData) {
                product = productData;
              }
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
          const [requester, approvedBy] = await Promise.all([
            getUserDetails(item.requested_by),
            getUserDetails(item.approved_by)
          ]);

          // Process details
          const details = (item.stock_out_details || []).map((detail) => ({
            id: detail.id,
            product_id: detail.product_id,
            quantity: detail.quantity,
            created_at: detail.created_at,
            updated_at: detail.updated_at
          }));

          const totalQuantity = details.reduce((sum, detail) => sum + detail.quantity, 0);

          return {
            id: item.id,
            product,
            requester,
            approvedBy,
            rejectedBy: null,
            completedBy: null,
            quantity: totalQuantity,
            approvedQuantity: null,
            status: item.status || 'pending',
            destination: item.destination || '',
            reason: item.notes,
            created_at: item.created_at,
            approved_at: item.approved_at,
            rejected_at: null,
            completed_at: null,
            invoice_number: null,
            packing_slip_number: null,
            reservation_id: null,
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
