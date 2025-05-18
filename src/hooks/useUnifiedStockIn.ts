
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BoxData } from './useStockInBoxes';

// Define specific types for status and processing step to ensure type safety
export type StockInStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
export type ProcessingStep = 'submitted' | 'details_verified' | 'boxes_defined' | 'preview' | 'completed';

export interface UnifiedStockIn {
  id: string;
  product_id: string;
  source: string;
  notes?: string;
  submitted_by: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  status: StockInStatus;
  processing_step?: ProcessingStep;
  processing_started_at?: string;
  processing_completed_at?: string;
  rejection_reason?: string;
  barcode?: string;
  quantity?: number;
  color?: string;
  size?: string;
  warehouse_id?: string;
  location_id?: string;
  batch_id?: string;
  box_number?: number;
  total_boxes?: number;
  parent_stock_in_id?: string;
  is_box_entry: boolean;
  is_processed: boolean;
}

export interface UnifiedStockInWithDetails {
  id: string;
  product_id: string;
  product?: {
    name: string;
    sku?: string;
    category?: string;
  };
  source: string;
  notes?: string;
  submitter?: {
    id: string;
    name?: string;
    username?: string;
  };
  processor?: {
    id: string;
    name?: string;
    username?: string;
  };
  status: StockInStatus;
  processing_step?: ProcessingStep;
  created_at: string;
  updated_at: string;
  total_boxes?: number;
  boxes: UnifiedStockIn[];
  is_box_entry: boolean;
}

// Get a stock in request by ID including all box entries
export const useUnifiedStockIn = (stockInId?: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['unified-stock-in', stockInId],
    queryFn: async (): Promise<UnifiedStockInWithDetails | null> => {
      if (!stockInId) return null;
      
      try {
        // First get the main stock in entry - with column names specified for relationships
        // Fixed approach to handle the profiles relationship correctly using specific column hints
        const { data: mainEntry, error: mainError } = await supabase
          .from('unified_stock_in')
          .select(`
            *,
            products (
              id,
              name,
              sku,
              category
            ),
            submitter:submitted_by (
              id,
              name,
              username
            ),
            processor:processed_by (
              id,
              name,
              username
            )
          `)
          .eq('id', stockInId)
          .eq('is_box_entry', false)
          .single();
          
        if (mainError) {
          console.error('Error fetching stock in:', mainError);
          throw mainError;
        }
        
        if (!mainEntry) {
          return null;
        }
        
        // Get all box entries for this stock in
        const { data: boxEntries, error: boxError } = await supabase
          .from('unified_stock_in')
          .select('*')
          .eq('parent_stock_in_id', stockInId)
          .eq('is_box_entry', true);
          
        if (boxError) {
          console.error('Error fetching box entries:', boxError);
          throw boxError;
        }
        
        // Type-safe property access with nullish coalescing
        const submitter = mainEntry.submitter ? {
          id: mainEntry.submitter.id || '',
          name: mainEntry.submitter.name || undefined,
          username: mainEntry.submitter.username || undefined,
        } : undefined;

        const processor = mainEntry.processor ? {
          id: mainEntry.processor.id || '',
          name: mainEntry.processor.name || undefined,
          username: mainEntry.processor.username || undefined,
        } : undefined;
        
        // Map the data to our interface with proper type casting
        const result: UnifiedStockInWithDetails = {
          id: mainEntry.id,
          product_id: mainEntry.product_id,
          product: mainEntry.products ? {
            name: mainEntry.products.name,
            sku: mainEntry.products.sku,
            category: mainEntry.products.category,
          } : undefined,
          source: mainEntry.source,
          notes: mainEntry.notes,
          submitter: submitter,
          processor: processor,
          status: mainEntry.status as StockInStatus,
          processing_step: mainEntry.processing_step as ProcessingStep,
          created_at: mainEntry.created_at,
          updated_at: mainEntry.updated_at,
          total_boxes: mainEntry.total_boxes,
          boxes: (boxEntries || []).map(box => ({
            ...box,
            status: box.status as StockInStatus,
            processing_step: box.processing_step as ProcessingStep,
          })) as UnifiedStockIn[],
          is_box_entry: false,
        };
        
        return result;
      } catch (error) {
        console.error('Failed to fetch stock in data:', error);
        toast({
          title: 'Error fetching stock in data',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        return null;
      }
    },
    enabled: !!stockInId,
  });
  
  // Update the main stock in entry's processing step
  const updateProcessingStep = useMutation({
    mutationFn: async ({ id, processingStep }: { id: string; processingStep: ProcessingStep }) => {
      const { error } = await supabase
        .from('unified_stock_in')
        .update({
          processing_step: processingStep,
        })
        .eq('id', id);
        
      if (error) throw error;
      return { id, processingStep };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stock-in', stockInId] });
    },
  });
  
  // Create or update box entries
  const upsertBoxes = useMutation({
    mutationFn: async ({ parentId, boxes }: { parentId: string; boxes: BoxData[] }) => {
      if (!parentId || boxes.length === 0) {
        throw new Error('Parent ID and boxes are required');
      }
      
      // Map the BoxData to UnifiedStockIn entries
      const boxEntries = boxes.map((box, index) => ({
        product_id: query.data?.product_id || '',
        source: query.data?.source || '',
        notes: query.data?.notes,
        submitted_by: query.data?.submitter?.id || '',
        barcode: box.barcode,
        quantity: box.quantity,
        color: box.color,
        size: box.size,
        warehouse_id: box.warehouse_id,
        location_id: box.location_id,
        box_number: index + 1,
        parent_stock_in_id: parentId,
        is_box_entry: true,
        status: query.data?.status || 'processing',
      }));
      
      // First, delete any existing box entries
      const { error: deleteError } = await supabase
        .from('unified_stock_in')
        .delete()
        .eq('parent_stock_in_id', parentId)
        .eq('is_box_entry', true);
        
      if (deleteError) throw deleteError;
      
      // Insert the new box entries
      const { data, error } = await supabase
        .from('unified_stock_in')
        .insert(boxEntries)
        .select();
        
      if (error) throw error;
      
      // Update the main entry with the total boxes count
      const { error: updateError } = await supabase
        .from('unified_stock_in')
        .update({
          total_boxes: boxes.length,
        })
        .eq('id', parentId);
        
      if (updateError) throw updateError;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stock-in', stockInId] });
      toast({
        title: 'Boxes updated',
        description: 'The box entries have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update boxes',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
  
  // Complete the stock in process
  const completeStockIn = useMutation({
    mutationFn: async ({ 
      id, 
      userId 
    }: { 
      id: string; 
      userId: string;
    }) => {
      // Update the main entry
      const { error: updateError } = await supabase
        .from('unified_stock_in')
        .update({
          status: 'completed' as StockInStatus,
          processed_by: userId,
          processing_step: 'completed' as ProcessingStep,
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      // Mark all boxes as processed
      const { error: boxUpdateError } = await supabase
        .from('unified_stock_in')
        .update({
          status: 'completed' as StockInStatus,
          is_processed: true,
        })
        .eq('parent_stock_in_id', id);
        
      if (boxUpdateError) throw boxUpdateError;
      
      return { id, status: 'completed' as StockInStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stock-in', stockInId] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      toast({
        title: 'Stock In Completed',
        description: 'The stock in has been processed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to complete stock in',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  return {
    stockIn: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateProcessingStep,
    upsertBoxes,
    completeStockIn,
  };
};

// Hook to get a list of unified stock in requests
export const useUnifiedStockInList = (
  status?: string, 
  limit: number = 10, 
  page: number = 1,
  userId?: string
) => {
  return useQuery({
    queryKey: ['unified-stock-in-list', status, limit, page, userId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('unified_stock_in')
          .select(`
            *,
            products (
              id,
              name,
              sku
            ),
            submitter:submitted_by (
              id,
              name,
              username
            )
          `)
          .eq('is_box_entry', false);
        
        if (status) {
          query = query.eq('status', status);
        }
        
        if (userId) {
          query = query.eq('submitted_by', userId);
        }
        
        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);
          
        if (error) throw error;
        
        // Get count for pagination
        const { count: totalCount, error: countError } = await supabase
          .from('unified_stock_in')
          .select('*', { count: 'exact', head: true })
          .eq('is_box_entry', false);
          
        if (countError) throw countError;
        
        return {
          data,
          count: totalCount || 0,
          page,
          pageSize: limit,
        };
      } catch (error) {
        console.error('Failed to fetch stock in list:', error);
        throw error;
      }
    },
  });
};

// Create a new unified stock in request
export const useCreateUnifiedStockIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      source: string;
      notes?: string;
      submitted_by: string;
      total_boxes: number;
    }) => {
      const { data: result, error } = await supabase
        .from('unified_stock_in')
        .insert({
          product_id: data.product_id,
          source: data.source,
          notes: data.notes,
          submitted_by: data.submitted_by,
          total_boxes: data.total_boxes,
          is_box_entry: false,
          status: 'pending',
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-stock-in-list'] });
      toast({
        title: 'Stock In Created',
        description: 'The stock in request has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create stock in',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
};
