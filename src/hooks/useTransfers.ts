
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryTransfer, TransferStatus } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { useInventoryTransferMovements } from './useInventoryTransferMovements';

export interface TransferFormData {
  productId: string;
  fromWarehouseId: string;
  fromLocationId: string;
  toWarehouseId: string;
  toLocationId: string;
  quantity: number;
  notes?: string;
  transferReason?: string;
}

export const useTransfers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { createTransferMovements } = useInventoryTransferMovements();
  
  // Get pending transfers that require approval
  const getPendingTransfers = () => {
    return useQuery({
      queryKey: ['pending-transfers'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_transfers')
          .select(`
            id,
            product_id,
            source_warehouse_id,
            source_location_id,
            destination_warehouse_id,
            destination_location_id,
            quantity,
            status,
            transfer_reason,
            notes,
            initiated_by,
            approved_by,
            created_at,
            updated_at,
            created_by,
            updated_by,
            products(name, sku),
            initiator:profiles!initiated_by(name, username),
            source_warehouse:warehouses!source_warehouse_id(name, location),
            source_location:warehouse_locations!source_location_id(floor, zone),
            destination_warehouse:warehouses!destination_warehouse_id(name, location),
            destination_location:warehouse_locations!destination_location_id(floor, zone)
          `)
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
          .from('inventory_transfers')
          .select(`
            id,
            product_id,
            source_warehouse_id,
            source_location_id,
            destination_warehouse_id,
            destination_location_id,
            quantity,
            status,
            transfer_reason,
            notes,
            initiated_by,
            approved_by,
            created_at,
            updated_at,
            created_by,
            updated_by,
            products(name, sku),
            initiator:profiles!initiated_by(name, username),
            approver:profiles!approved_by(name, username),
            source_warehouse:warehouses!source_warehouse_id(name, location),
            source_location:warehouse_locations!source_location_id(floor, zone),
            destination_warehouse:warehouses!destination_warehouse_id(name, location),
            destination_location:warehouse_locations!destination_location_id(floor, zone)
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching transfer history:', error);
          throw error;
        }
        
        return data || [];
      },
      // Handle errors gracefully with empty default
      meta: {
        onError: (error: any) => {
          console.error('Transfer history query failed:', error);
        }
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
        const { data, error } = await supabase
          .from('inventory_transfers')
          .insert({
            product_id: formData.productId,
            source_warehouse_id: formData.fromWarehouseId,
            source_location_id: formData.fromLocationId,
            destination_warehouse_id: formData.toWarehouseId,
            destination_location_id: formData.toLocationId,
            quantity: formData.quantity,
            status: 'pending' as TransferStatus,
            transfer_reason: formData.transferReason || null,
            notes: formData.notes || null,
            initiated_by: user.id,
            created_by: user.id
          })
          .select('id')
          .single();
          
        if (error) throw error;
        
        return { success: true, transferId: data.id };
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
      // Also invalidate inventory queries to reflect changes
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
    mutationFn: async (transferId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // First, get the transfer details to create movements after approval
      const { data: transfer, error: fetchError } = await supabase
        .from('inventory_transfers')
        .select('*')
        .eq('id', transferId)
        .eq('status', 'pending')
        .single();
      
      if (fetchError) throw fetchError;
      if (!transfer) throw new Error('Transfer not found or already processed');
      
      // Update the transfer status
      const { error: updateError } = await supabase
        .from('inventory_transfers')
        .update({ 
          status: 'approved' as TransferStatus,
          approved_by: user.id,
          updated_by: user.id
        })
        .eq('id', transferId)
        .eq('status', 'pending');
        
      if (updateError) throw updateError;
      
      return { 
        success: true,
        transfer: {
          id: transfer.id,
          productId: transfer.product_id,
          sourceWarehouseId: transfer.source_warehouse_id,
          sourceLocationId: transfer.source_location_id,
          destinationWarehouseId: transfer.destination_warehouse_id,
          destinationLocationId: transfer.destination_location_id,
          quantity: transfer.quantity
        }
      };
    },
    onSuccess: (result) => {
      toast({
        title: 'Transfer Approved',
        description: 'The transfer has been approved successfully.',
      });
      
      // Create inventory movements for the transfer
      if (result.transfer) {
        createTransferMovements.mutate({
          transferId: result.transfer.id,
          productId: result.transfer.productId,
          sourceWarehouseId: result.transfer.sourceWarehouseId,
          sourceLocationId: result.transfer.sourceLocationId,
          destinationWarehouseId: result.transfer.destinationWarehouseId,
          destinationLocationId: result.transfer.destinationLocationId,
          quantity: result.transfer.quantity
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      // Also invalidate inventory queries to reflect changes
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
    mutationFn: async ({ transferId, reason }: { transferId: string, reason: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('inventory_transfers')
        .update({ 
          status: 'rejected' as TransferStatus,
          notes: reason,
          approved_by: user.id,
          updated_by: user.id
        })
        .eq('id', transferId)
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
