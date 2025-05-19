import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCallback, useEffect } from 'react';

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

export const useStockInRequests = (filters: Record<string, any> = {}, page: number = 1, pageSize: number = 20) => {
  const queryClient = useQueryClient();

  // Fetch function that we can call both from the query and when revalidating via subscription
  const fetchStockInRequests = useCallback(async () => {
    console.log('Fetching stock in requests with filter:', filters, 'page:', page, 'pageSize:', pageSize);
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
        `, { count: 'exact' });
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.source) {
        query = query.ilike('source', `%${filters.source}%`);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.submitted_by) {
        query = query.eq('submitted_by', filters.submitted_by);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: stockData, error: stockError, count } = await query
        .order('created_at', { ascending: false });

      if (stockError) {
        console.error('Error fetching stock in requests:', stockError);
        throw stockError;
      }

      if (!stockData || stockData.length === 0) {
        return { data: [], totalCount: count ?? 0 };
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
      
      return { data: processedData, totalCount: count ?? 0 };
    } catch (error) {
      console.error('Failed to fetch stock in requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to load stock requests',
        description: errorMessage,
      });
      return { data: [], totalCount: 0 };
    }
  }, [filters, page, pageSize]);

  // Set up the main React Query with increased poll interval for better responsiveness
  const queryResult = useQuery({
    queryKey: ['stock-in-requests', filters, page, pageSize],
    queryFn: fetchStockInRequests,
    staleTime: 1000 * 30, // Data is fresh for 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute as a backup
  });

  // Setup Supabase realtime subscription for stock_in table updates
  useEffect(() => {
    console.log('Setting up enhanced realtime subscription for stock_in table');
    const channel = supabase
      .channel('stock-in-changes-enhanced')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'stock_in' },
          (payload) => {
            console.log('Realtime update for stock_in:', payload);
            
            // Special handling for status updates
            if (payload.eventType === 'UPDATE' && 
                payload.old && payload.new && 
                payload.old.status !== payload.new.status) {
              console.log(`Status changed from ${payload.old.status} to ${payload.new.status}`);
              
              // If status changed to completed, show a toast notification
              if (payload.new.status === 'completed') {
                toast({
                  title: 'Stock In Completed',
                  description: 'A stock in request has been fully processed and completed',
                });
              }
            }
            
            // Immediately refetch data when changes occur
            queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
          }
      )
      .subscribe();

    // Setup subscription for stock_in_details to catch batch processing
    const detailsChannel = supabase
      .channel('stock-in-details-changes')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'stock_in_details' },
          (payload) => {
            console.log('Realtime update for stock_in_details:', payload);
            
            // Invalidate both stock-in requests and inventory data
            queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
      )
      .subscribe();

    // Clean up subscription when component unmounts or dependencies change
    return () => {
      console.log('Removing stock_in realtime subscriptions');
      supabase.removeChannel(channel);
      supabase.removeChannel(detailsChannel);
    };
  }, [filters, page, pageSize, queryClient]);

  return queryResult;
};
