
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StockInRequestData {
  id: string;
  product: { name: string; id: string | null; sku?: string | null };
  submitter: { name: string; username: string; id: string | null } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  rejection_reason?: string;
}

export const useStockInRequests = (statusFilter: string = 'all') => {
  return useQuery({
    queryKey: ['stock-in-requests', statusFilter],
    queryFn: async () => {
      console.log('Fetching stock in requests with filter:', statusFilter);
      try {
        // Build query based on filter
        let query = supabase
          .from('stock_in')
          .select(`
            id,
            product_id,
            submitted_by,
            boxes,
            status,
            created_at,
            source,
            notes,
            rejection_reason
          `);
          
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter as "pending" | "approved" | "rejected" | "completed" | "processing");
        }
        
        const { data: stockData, error: stockError } = await query
          .order('created_at', { ascending: false });

        if (stockError) {
          console.error('Error fetching stock in requests:', stockError);
          throw stockError;
        }

        if (!stockData || stockData.length === 0) {
          return [];
        }
        
        // Process each stock in record to fetch related data
        const processedData = await Promise.all(stockData.map(async (item) => {
          // Get product details
          let product = { name: 'Unknown Product', id: null as string | null };
          if (item.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('id, name, sku')
              .eq('id', item.product_id)
              .single();
            
            if (productData) {
              product = productData;
            }
          }
          
          // Get submitter details with consistent approach
          let submitter = null;
          if (item.submitted_by) {
            try {
              const { data: submitterData, error: submitterError } = await supabase
                .from('profiles')
                .select('id, name, username')
                .eq('id', item.submitted_by)
                .maybeSingle();
              
              if (!submitterError && submitterData) {
                submitter = {
                  id: submitterData.id,
                  name: submitterData.name || 'Unknown User',
                  username: submitterData.username
                };
              } else {
                // Fallback if profile not found
                submitter = { 
                  id: item.submitted_by,
                  name: 'Unknown User',
                  username: item.submitted_by.substring(0, 8) + '...'
                };
              }
            } catch (err) {
              console.error(`Error fetching submitter for ID: ${item.submitted_by}`, err);
              submitter = { 
                id: item.submitted_by,
                name: 'Unknown User',
                username: 'unknown'
              };
            }
          }
          
          return {
            id: item.id,
            product,
            submitter,
            boxes: item.boxes,
            status: item.status,
            created_at: item.created_at,
            source: item.source || 'Unknown Source',
            notes: item.notes,
            rejection_reason: item.rejection_reason
          } as StockInRequestData;
        }));
        
        return processedData;
      } catch (error) {
        console.error('Failed to fetch stock in requests:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Failed to load stock requests',
          description: errorMessage,
        });
        return [];
      }
    },
  });
};
