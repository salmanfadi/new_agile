import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface StockOutSubmission {
  productId: string;
  quantity: number;
  destination: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requiredDate?: string;
  userId: string;
}

export const useStockOut = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const submitStockOut = useMutation({
    mutationFn: async (data: StockOutSubmission) => {
      setIsLoading(true);
      try {
        // Create the stock out request
        const { data: stockOut, error } = await supabase
          .from('stock_out')
          .insert({
            product_id: data.productId,
            quantity: data.quantity,
            destination: data.destination,
            notes: data.notes,
            priority: data.priority || 'normal',
            required_date: data.requiredDate,
            status: 'pending', // Initial status for warehouse manager review
            requested_by: data.userId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Invalidate queries to refresh the lists
        queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
        
        return stockOut;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock out request has been submitted for approval',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit stock out request',
        variant: 'destructive',
      });
    },
  });

  return {
    submitStockOut,
    isLoading,
  };
}; 