
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { MovementType } from '@/types/inventory';

interface CreateMovementParams {
  transferId: string;
  productId: string;
  sourceWarehouseId: string;
  sourceLocationId: string;
  destinationWarehouseId: string;
  destinationLocationId: string;
  quantity: number;
}

export const useInventoryTransferMovements = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Create inventory movements for transfer
  const createTransferMovements = useMutation({
    mutationFn: async (params: CreateMovementParams) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { transferId, productId, sourceWarehouseId, sourceLocationId, 
              destinationWarehouseId, destinationLocationId, quantity } = params;
      
      // Create two movements: outgoing from source and incoming to destination
      const [outgoingResult, incomingResult] = await Promise.all([
        // Outgoing movement (subtract from source)
        supabase.from('inventory_movements').insert({
          product_id: productId,
          warehouse_id: sourceWarehouseId,
          location_id: sourceLocationId,
          movement_type: 'transfer' as MovementType,
          quantity: quantity,
          status: 'approved', // Use string literal to match DB enum
          performed_by: user.id,
          transfer_reference_id: transferId,
          details: { direction: 'outgoing' }
        }),
        
        // Incoming movement (add to destination)
        supabase.from('inventory_movements').insert({
          product_id: productId,
          warehouse_id: destinationWarehouseId,
          location_id: destinationLocationId,
          movement_type: 'transfer' as MovementType,
          quantity: quantity,
          status: 'approved', // Use string literal to match DB enum
          performed_by: user.id,
          transfer_reference_id: transferId,
          details: { direction: 'incoming' }
        })
      ]);
      
      if (outgoingResult.error) throw outgoingResult.error;
      if (incomingResult.error) throw incomingResult.error;
      
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      
      toast({
        title: 'Transfer Movements Created',
        description: 'Inventory has been updated to reflect the transfer.',
      });
    },
    onError: (error) => {
      console.error('Failed to create inventory movements:', error);
      toast({
        variant: 'destructive',
        title: 'Movement Creation Failed',
        description: 'Could not update inventory for this transfer.',
      });
    }
  });
  
  return {
    createTransferMovements
  };
};
