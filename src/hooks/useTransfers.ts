
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { TransferStatus } from '@/types/database';

// Define interface for TransferForm.tsx
export interface TransferFormData {
  // Database column names
  product_id: string;
  source_warehouse_id: string;
  source_location_id: string;
  destination_warehouse_id: string;
  destination_location_id: string;
  quantity: number;
  transfer_reason?: string;
  notes?: string;
  
  // Form field names that match what's used in TransferForm.tsx
  productId?: string;
  fromWarehouseId?: string;
  fromLocationId?: string;
  toWarehouseId?: string;
  toLocationId?: string;
  transferReason?: string;
}

export const useTransfers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch transfer history with proper relationship aliases
  const getTransferHistory = (filters?: Record<string, any>) => {
    return useQuery({
      queryKey: ['transfers-history', filters],
      queryFn: async () => {
        let query = supabase
          .from('inventory_transfers')
          .select(`
            id,
            product_id,
            quantity,
            source_warehouse_id,
            source_location_id,
            destination_warehouse_id,
            destination_location_id,
            status,
            transfer_reason,
            notes,
            initiated_by,
            approved_by,
            created_at,
            updated_at,
            products(id, name, sku),
            source_warehouse:warehouses!source_warehouse_id(id, name, location),
            source_location:warehouse_locations!source_location_id(id, floor, zone),
            destination_warehouse:warehouses!destination_warehouse_id(id, name, location),
            destination_location:warehouse_locations!destination_location_id(id, floor, zone),
            initiator:profiles!initiated_by(id, name, username)
          `)
          .order('created_at', { ascending: false });
        
        // Apply filters if provided
        if (filters) {
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.productId) {
            query = query.eq('product_id', filters.productId);
          }
          if (filters.sourceWarehouseId) {
            query = query.eq('source_warehouse_id', filters.sourceWarehouseId);
          }
          if (filters.destinationWarehouseId) {
            query = query.eq('destination_warehouse_id', filters.destinationWarehouseId);
          }
          if (filters.initiatedBy) {
            query = query.eq('initiated_by', filters.initiatedBy);
          }
          if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
          }
          if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
          }
          // Add limit if specified
          if (filters.limit) {
            query = query.limit(filters.limit);
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching transfer history:', error);
          throw error;
        }
        
        return data || [];
      }
    });
  };

  // Get pending transfers for approval with proper relationship aliases
  const getPendingTransfers = () => {
    return useQuery({
      queryKey: ['transfers-pending'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_transfers')
          .select(`
            id,
            product_id,
            quantity,
            source_warehouse_id,
            source_location_id,
            destination_warehouse_id,
            destination_location_id,
            status,
            transfer_reason,
            notes,
            initiated_by,
            created_at,
            products(id, name, sku),
            source_warehouse:warehouses!source_warehouse_id(id, name, location),
            source_location:warehouse_locations!source_location_id(id, floor, zone),
            destination_warehouse:warehouses!destination_warehouse_id(id, name, location),
            destination_location:warehouse_locations!destination_location_id(id, floor, zone),
            initiator:profiles!initiated_by(id, name, username)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching pending transfers:', error);
          throw error;
        }
        
        return data || [];
      }
    });
  };

  // Create new transfer
  const createTransfer = useMutation({
    mutationFn: async (transferData: TransferFormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Map the form field names to the database column names
      const transferPayload = {
        product_id: transferData.product_id || transferData.productId,
        source_warehouse_id: transferData.source_warehouse_id || transferData.fromWarehouseId,
        source_location_id: transferData.source_location_id || transferData.fromLocationId,
        destination_warehouse_id: transferData.destination_warehouse_id || transferData.toWarehouseId,
        destination_location_id: transferData.destination_location_id || transferData.toLocationId,
        quantity: transferData.quantity,
        transfer_reason: transferData.transfer_reason || transferData.transferReason,
        notes: transferData.notes,
        initiated_by: user.id,
        status: 'pending' as TransferStatus
      };
      
      const { data, error } = await supabase
        .from('inventory_transfers')
        .insert(transferPayload)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-stock-activity'] });
      
      toast({
        title: 'Transfer Created',
        description: 'Your inventory transfer request has been submitted for approval.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to create transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error.message || 'Could not create inventory transfer',
      });
    }
  });

  // Approve a transfer
  const approveTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_transfers')
        .update({
          status: 'approved' as TransferStatus,
          approved_by: user.id
        })
        .eq('id', transferId)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers-pending'] });
      queryClient.invalidateQueries({ queryKey: ['transfers-history'] });
      
      toast({
        title: 'Transfer Approved',
        description: 'The inventory transfer has been approved.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message || 'Could not approve the transfer',
      });
    }
  });

  // Reject a transfer
  const rejectTransfer = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_transfers')
        .update({
          status: 'rejected' as TransferStatus,
          approved_by: user.id,
          notes: reason // Store rejection reason in notes field
        })
        .eq('id', transferId)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers-pending'] });
      queryClient.invalidateQueries({ queryKey: ['transfers-history'] });
      
      toast({
        title: 'Transfer Rejected',
        description: 'The inventory transfer has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error.message || 'Could not reject the transfer',
      });
    }
  });

  // Mark transfer as complete
  const completeTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('inventory_transfers')
        .update({
          status: 'completed' as TransferStatus
        })
        .eq('id', transferId)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers-history'] });
      
      toast({
        title: 'Transfer Completed',
        description: 'The inventory transfer has been marked as completed.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Completion Failed',
        description: error.message || 'Could not mark the transfer as completed',
      });
    }
  });

  return {
    getTransferHistory,
    getPendingTransfers,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    completeTransfer
  };
};
