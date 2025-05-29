import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface ProcessStockOutParams {
  requestId: string;
  items: Array<{
    id: string;
    quantity: number;
  }>;
}

interface ProcessStockOutOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useProcessStockOut = (options?: ProcessStockOutOptions) => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, items }: ProcessStockOutParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Process each item in sequence
      for (const item of items) {
        // First get the batch ID for this item
        const { data: stockOutDetail, error: detailError } = await supabase
          .from('stock_out_details')
          .select('inventory_id')
          .eq('id', item.id)
          .single();

        if (detailError) throw detailError;
        if (!stockOutDetail) throw new Error('Stock out detail not found');

        // Now process the stock out
        const { error } = await supabase
          .from('stock_out_details')
          .update({ 
            quantity: item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;

        // Update the inventory
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({ 
            quantity: supabase.rpc('get_inventory_quantity', { 
              p_inventory_id: stockOutDetail.inventory_id,
              p_quantity: -item.quantity 
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', stockOutDetail.inventory_id);

        if (inventoryError) throw inventoryError;
      }

      // Update the stock out status
      const { error: statusError } = await supabase
        .from('stock_out')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (statusError) throw statusError;

      return { success: true };
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    }
  });
}; 