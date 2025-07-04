
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

// Define interface for TransferForm.tsx
export interface TransferFormData {
  // Database column names
  source_warehouse_id: string;
  destination_warehouse_id: string;
  quantity: number;
  notes?: string;
  
  // Form field names that match what's used in TransferForm.tsx
  productId?: string;
  product_id?: string;
  fromWarehouseId?: string;
  fromLocationId?: string;
  source_location_id?: string;
  toWarehouseId?: string;
  toLocationId?: string;
  destination_location_id?: string;
  transferReason?: string;
  transfer_reason?: string;
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
            source_warehouse_id,
            destination_warehouse_id,
            status,
            created_at,
            updated_at,
            initiated_by
          `)
          .order('created_at', { ascending: false });
        
        // Apply filters if provided
        if (filters) {
          if (filters.status) {
            query = query.eq('status', filters.status);
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

  // Get pending transfers for approval
  const getPendingTransfers = () => {
    return useQuery({
      queryKey: ['transfers-pending'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_transfers')
          .select(`
            id,
            source_warehouse_id,
            destination_warehouse_id,
            status,
            created_at,
            initiated_by
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
        source_warehouse_id: transferData.source_warehouse_id || transferData.fromWarehouseId,
        destination_warehouse_id: transferData.destination_warehouse_id || transferData.toWarehouseId,
        notes: transferData.notes,
        initiated_by: user.id,
        status: 'pending' as const
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
          status: 'completed' as const
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
          status: 'cancelled' as const
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
          status: 'completed' as const
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
