
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect } from 'react';
import { StockInRequest } from '@/types/database';

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
  boxes: number | null;
  status: "pending" | "approved" | "rejected" | "completed" | "processing" | null;
  created_at: string | null;
  source: string;
  notes?: string | null;
  rejection_reason?: string | null;
  products: Product | null;
  profiles: Profile | null;
}

export const useStockInRequests = (filters: Record<string, any> = {}, page: number = 1, pageSize: number = 20) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchStockInRequests = useCallback(async () => {
    console.log('Fetching stock in requests with filter:', filters, 'page:', page, 'pageSize:', pageSize);
    try {
      // First get the count separately for better performance
      const countQuery = supabase
        .from('stock_in')
        .select('*', { count: 'exact', head: true });
      
      // Apply filters to count query
      let filteredCountQuery = countQuery;
      if (filters.status) {
        filteredCountQuery = filteredCountQuery.eq('status', filters.status);
      }
      if (filters.source) {
        filteredCountQuery = filteredCountQuery.ilike('source', `%${filters.source}%`);
      }
      if (filters.date_from) {
        filteredCountQuery = filteredCountQuery.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        filteredCountQuery = filteredCountQuery.lte('created_at', filters.date_to);
      }
      if (filters.submitted_by) {
        filteredCountQuery = filteredCountQuery.eq('submitted_by', filters.submitted_by);
      }
      
      const { count, error: countError } = await filteredCountQuery;
      if (countError) {
        console.error('Error counting stock in requests:', countError);
        throw countError;
      }
      
      // If no records, return early
      if (count === 0) {
        return { data: [], totalCount: 0 };
      }

      // Then fetch the actual data with joins
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
          rejection_reason,
          products!inner (
            id,
            name,
            sku
          ),
          profiles!stock_in_submitted_by_fkey!inner (
            id,
            username,
            name
          )
        `);
      
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

      const { data: stockData, error: stockError, count: totalCount } = await query
        .order('created_at', { ascending: false });

      if (stockError) {
        console.error('Error fetching stock in requests:', stockError);
        throw stockError;
      }

      if (!stockData || stockData.length === 0) {
        return { data: [], totalCount: totalCount ?? 0 };
      }

      const processedData: StockInRequest[] = (stockData as unknown as StockInRecord[]).map((item) => ({
        id: item.id,
        product_id: item.product_id || '',
        quantity: 0, // Default since not in database
        submitted_by: item.submitted_by,
        processed_by: null,
        product: item.products ? {
          id: item.products.id,
          name: item.products.name,
          sku: item.products.sku || null,
          description: null,
          hsn_code: null,
          gst_rate: null,
          created_at: '',
          updated_at: '',
          category: null,
          barcode: null,
          unit: null,
          min_stock_level: null,
          is_active: null,
          gst_category: null,
          image_url: null
        } : null,
        submitter: item.profiles ? {
          id: item.profiles.id,
          name: item.profiles.name || 'Unknown User',
          username: item.profiles.username || 'unknown'
        } : null,
        boxes: item.boxes || 0,
        status: (item.status || 'pending') as "pending" | "approved" | "rejected" | "completed" | "processing",
        created_at: item.created_at || new Date().toISOString(),
        source: item.source || 'Unknown',
        notes: item.notes || null,
        rejection_reason: item.rejection_reason || undefined
      }));
      
      return { data: processedData, totalCount: totalCount ?? 0 };
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
    retry: 2, // Retry failed requests twice before showing an error
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
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

export type { StockInRequest };
