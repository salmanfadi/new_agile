
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryMovement, MovementType } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';

export interface TransferFormData {
  productId: string;
  fromWarehouseId: string;
  fromLocationId: string;
  toWarehouseId: string;
  toLocationId: string;
  quantity: number;
  notes?: string;
}

export const useTransfers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get pending transfers that require approval
  const getPendingTransfers = () => {
    return useQuery({
      queryKey: ['pending-transfers'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_movements')
          .select(`
            id,
            product_id,
            warehouse_id,
            location_id,
            movement_type,
            quantity,
            status,
            reference_table,
            reference_id,
            performed_by,
            created_at,
            details,
            transfer_reference_id,
            products:product_id (name, sku),
            warehouses:warehouse_id (name, location),
            warehouse_locations:location_id (floor, zone),
            profiles:performed_by (name, username)
          `)
          .eq('movement_type', 'transfer' as MovementType)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching pending transfers:', error);
          throw error;
        }
        
        return data || [];
      }
    });
  };
  
  // Get transfer history
  const getTransferHistory = () => {
    return useQuery({
      queryKey: ['transfer-history'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_movements')
          .select(`
            id,
            product_id,
            warehouse_id,
            location_id,
            movement_type,
            quantity,
            status,
            reference_table,
            reference_id,
            performed_by,
            created_at,
            details,
            transfer_reference_id,
            products:product_id (name, sku),
            warehouses:warehouse_id (name, location),
            warehouse_locations:location_id (floor, zone),
            profiles:performed_by (name, username)
          `)
          .eq('movement_type', 'transfer' as MovementType)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching transfer history:', error);
          throw error;
        }
        
        return data || [];
      }
    });
  };
  
  // Create a new internal transfer
  const createTransfer = useMutation({
    mutationFn: async (formData: TransferFormData) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      try {
        // Generate a unique reference ID for linking the two transfer operations
        const transferReferenceId = crypto.randomUUID();
        
        // Create the "out" movement from source location
        const { error: outError } = await supabase
          .from('inventory_movements')
          .insert({
            product_id: formData.productId,
            warehouse_id: formData.fromWarehouseId,
            location_id: formData.fromLocationId,
            movement_type: 'transfer' as MovementType,
            quantity: -formData.quantity, // Negative to indicate removal
            status: 'pending',
            transfer_reference_id: transferReferenceId,
            performed_by: user.id,
            details: { 
              notes: formData.notes,
              direction: 'out',
              to_warehouse_id: formData.toWarehouseId,
              to_location_id: formData.toLocationId
            }
          });
          
        if (outError) throw outError;
        
        // Create the "in" movement to destination location
        const { error: inError } = await supabase
          .from('inventory_movements')
          .insert({
            product_id: formData.productId,
            warehouse_id: formData.toWarehouseId,
            location_id: formData.toLocationId,
            movement_type: 'transfer' as MovementType,
            quantity: formData.quantity, // Positive to indicate addition
            status: 'pending',
            transfer_reference_id: transferReferenceId,
            performed_by: user.id,
            details: { 
              notes: formData.notes,
              direction: 'in',
              from_warehouse_id: formData.fromWarehouseId,
              from_location_id: formData.fromLocationId
            }
          });
          
        if (inError) throw inError;
        
        return { success: true, transferReferenceId };
      } catch (error) {
        console.error('Error creating transfer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Transfer Initiated',
        description: 'The transfer request has been submitted for approval.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
    onError: (error) => {
      console.error('Failed to create transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'Could not create the transfer request. Please try again.',
      });
    }
  });
  
  // Approve a transfer
  const approveTransfer = useMutation({
    mutationFn: async (transferReferenceId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data: relatedMovements, error: fetchError } = await supabase
        .from('inventory_movements')
        .select('id')
        .eq('transfer_reference_id', transferReferenceId)
        .eq('status', 'pending');
        
      if (fetchError) throw fetchError;
      
      if (!relatedMovements || relatedMovements.length === 0) {
        throw new Error('No pending transfer movements found with this reference ID');
      }
      
      // Update all related movements to approved status
      const { error: updateError } = await supabase
        .from('inventory_movements')
        .update({ 
          status: 'approved',
          details: { approved_by: user.id }
        })
        .eq('transfer_reference_id', transferReferenceId)
        .eq('status', 'pending');
        
      if (updateError) throw updateError;
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Transfer Approved',
        description: 'The transfer has been approved successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
    onError: (error) => {
      console.error('Failed to approve transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: 'Could not approve the transfer. Please try again.',
      });
    }
  });
  
  // Reject a transfer
  const rejectTransfer = useMutation({
    mutationFn: async ({ transferReferenceId, reason }: { transferReferenceId: string, reason: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('inventory_movements')
        .update({ 
          status: 'rejected',
          details: { rejection_reason: reason }
        })
        .eq('transfer_reference_id', transferReferenceId)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Transfer Rejected',
        description: 'The transfer has been rejected.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
    onError: (error) => {
      console.error('Failed to reject transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: 'Could not reject the transfer. Please try again.',
      });
    }
  });
  
  return {
    getPendingTransfers,
    getTransferHistory,
    createTransfer,
    approveTransfer,
    rejectTransfer
  };
};
