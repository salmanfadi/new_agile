import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ApproveStockOutParams {
  id: string;
  approvedQuantity: number;
}

interface RejectStockOutParams {
  id: string;
  reason: string;
}

interface ProcessStockOutParams {
  id: string;
  details: Array<{
    id: string;
    processedQuantity: number;
    batchId: string;
  }>;
}

export const useStockOutActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const approve = useMutation({
    mutationFn: async ({ id, approvedQuantity }: ApproveStockOutParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('approve_stock_out', {
        p_stock_out_id: id,
        p_approved_quantity: approvedQuantity,
        p_user_id: user.id
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Stock Out Approved',
        description: 'The stock out request has been approved successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve stock out request',
      });
    }
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: RejectStockOutParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('reject_stock_out', {
        p_stock_out_id: id,
        p_reason: reason,
        p_user_id: user.id
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Stock Out Rejected',
        description: 'The stock out request has been rejected.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject stock out request',
      });
    }
  });

  const process = useMutation({
    mutationFn: async ({ id, details }: ProcessStockOutParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Process each detail in sequence
      for (const detail of details) {
        const { error } = await supabase.rpc('process_stock_out_detail', {
          p_detail_id: detail.id,
          p_processed_quantity: detail.processedQuantity,
          p_batch_id: detail.batchId,
          p_user_id: user.id
        });

        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Stock Out Processed',
        description: 'The stock out request has been processed successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process stock out request',
      });
    }
  });

  return {
    approve,
    reject,
    process
  };
}; 