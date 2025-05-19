import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockIn, StockInDetail } from '@/types/stockIn';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ProcessableStockIn } from '@/components/StockInDetails';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string | null;
}

interface Submitter {
  id: string;
  name: string | null;  // Changed from name?: string | null to make it always present but possibly null
  username: string;
}

// Update interface to align with ProcessableStockIn
export interface StockInWithDetails extends Omit<StockIn, 'boxes'> {
  boxes: number; // Make boxes required to match ProcessableStockIn
  details: StockInDetail[];
  product?: Product;
  submitter?: Submitter;
  detailsTotalCount: number;
}

export const useStockInProcessing = (stockInId?: string, page: number = 1, pageSize: number = 20) => {
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const stockInQuery = useQuery({
    queryKey: ['stock-in-detail', stockInId],
    queryFn: async (): Promise<StockInWithDetails[]> => {
      if (!stockInId) {
        return [];
      }
      try {
        const { data: stockIns, error } = await supabase
          .from('stock_in')
          .select(`
            *,
            products (
              id,
              name,
              sku,
              category
            ),
            profiles (
              id,
              name,
              username
            )
          `)
          .eq('id', stockInId);
        if (error) {
          console.error('Error fetching stock-in data:', error);
          throw error;
        }
        if (!stockIns || stockIns.length === 0) {
          console.warn('No stock-in data found.');
          return [];
        }
        const stockInWithDetails = await Promise.all(
          stockIns.map(async (stockIn) => {
            // Paginated details
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            const { data: details, error: detailsError, count } = await supabase
              .from('stock_in_details')
              .select('*', { count: 'exact' })
              .eq('stock_in_id', stockIn.id)
              .range(from, to);
            if (detailsError) {
              console.error(`Error fetching details for stock-in ID ${stockIn.id}:`, detailsError);
              return { ...mapStockInWithDetails(stockIn, []), detailsTotalCount: 0 };
            }
            return { ...mapStockInWithDetails(stockIn, details || []), detailsTotalCount: count ?? 0 };
          })
        );
        return stockInWithDetails;
      } catch (error) {
        console.error('Failed to fetch stock-in data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch stock-in data.',
        });
        throw error;
      }
    },
    enabled: !!stockInId,
  });

  const mapStockInWithDetails = (stockIn: any, details: any[]): StockInWithDetails => {
    const stockInData: StockInWithDetails = {
      id: stockIn.id,
      created_at: stockIn.created_at,
      updated_at: stockIn.updated_at,
      product_id: stockIn.product_id,
      boxes: stockIn.boxes || 0, // Ensure boxes is always provided with a default value
      source: stockIn.source,
      notes: stockIn.notes,
      submitted_by: stockIn.submitted_by,
      processed_by: stockIn.processed_by,
      rejection_reason: stockIn.rejection_reason,
      status: stockIn.status,
      details: details || [],
      detailsTotalCount: 0,
    };
    
    // Fix product and submitter parsing
    if (stockIn.products) {
      stockInData.product = {
        id: stockIn.products.id,
        name: stockIn.products.name,
        sku: stockIn.products.sku,
        category: stockIn.products.category,
      };
    }

    if (stockIn.profiles) {
      stockInData.submitter = {
        id: stockIn.profiles.id,
        name: stockIn.profiles.name, // This can be null but is now always present as a property
        username: stockIn.profiles.username,
      };
    }

    return stockInData;
  };

  // Get the first item from the array (if there is one)
  const currentStockIn = stockInQuery.data && stockInQuery.data.length > 0 ? stockInQuery.data[0] : null;

  // Get the paginated stock-in details and total count
  const details = currentStockIn ? currentStockIn.details : [];
  const detailsTotalCount = currentStockIn ? currentStockIn.detailsTotalCount : 0;

  const handleApproval = async (isApproved: boolean) => {
    if (!stockInId || !currentStockIn) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the stock-in status
      const newStatus = isApproved ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('stock_in')
        .update({
          status: newStatus,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: isApproved ? null : approvalNotes
        })
        .eq('id', stockInId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: `Stock-in request ${isApproved ? 'approved' : 'rejected'}`,
        description: isApproved ? 'The stock-in request has been approved' : 'The stock-in request has been rejected',
      });
      
      // Navigate back to the stock-in list
      navigate('/manager/stock-in');
    } catch (error) {
      console.error('Error updating stock-in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${isApproved ? 'approve' : 'reject'} the stock-in request.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    stockInData: {
      data: currentStockIn,
      loading: stockInQuery.isLoading,
      error: stockInQuery.error,
    },
    currentStockIn,
    details,
    detailsTotalCount,
    approvalNotes,
    setApprovalNotes,
    handleApproval,
    isSubmitting,
    navigate
  };
};
