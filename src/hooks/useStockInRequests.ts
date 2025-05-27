import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Profile {
  id: string;
  name: string;
  username: string;
}

interface StockInRecord {
  id: string;
  product_id: string | null;
  submitted_by: string;
  number_of_boxes: number | null;
  status: "pending" | "approved" | "rejected" | "completed" | "processing" | null;
  created_at: string | null;
  source: string;
  notes?: string | null;
  rejection_reason?: string | null;
  products: Product | null;
  profiles: Profile | null;
}

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
  const { toast } = useToast();

  const fetchStockInRequests = useCallback(async () => {
    console.log('Fetching stock in requests with filter:', filters, 'page:', page, 'pageSize:', pageSize);
    try {
      let query = supabase
        .from('stock_in')
        .select(`
          id,
          product_id,
          submitted_by,
          number_of_boxes,
          status,
          created_at,
          source,
          notes,
          rejection_reason,
          products (
            id,
            name,
            sku
          ),
          profiles!stock_in_submitted_by_fkey (
            id,
            username,
            name
          )
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

      const processedData = (stockData as unknown as StockInRecord[]).map((item) => ({
        id: item.id,
        product: {
          id: item.products?.id || null,
          name: item.products?.name || 'Unknown Product',
          sku: item.products?.sku || null
        },
        submitter: item.profiles ? {
          id: item.profiles.id,
          name: item.profiles.name || 'Unknown User',
          username: item.profiles.username || 'unknown'
        } : null,
        boxes: item.number_of_boxes || 0,
        status: item.status || 'pending',
        created_at: item.created_at || new Date().toISOString(),
        source: item.source,
        notes: item.notes || undefined,
        rejection_reason: item.rejection_reason || undefined
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
  }, [filters, page, pageSize, toast]);

  const queryResult = useQuery({
    queryKey: ['stock-in-requests', filters, page, pageSize],
    queryFn: fetchStockInRequests,
    staleTime: 1000 * 30, // Data is fresh for 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute as a backup
  });

  useEffect(() => {
    const subscription = supabase
      .channel('stock_in_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stock_in'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return queryResult;
};
