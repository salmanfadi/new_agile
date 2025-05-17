
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MovementType, MovementStatus, InventoryMovement } from '@/types/inventory';

// Function to create a single inventory movement
export const createInventoryMovement = async (
  product_id: string,
  warehouse_id: string,
  location_id: string,
  quantity: number,
  movement_type: MovementType,
  status: MovementStatus,
  reference_table?: string,
  reference_id?: string,
  performed_by?: string,
  details?: Record<string, any>,
  transfer_reference_id?: string
) => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      product_id,
      warehouse_id,
      location_id,
      quantity,
      movement_type,
      status,
      reference_table,
      reference_id,
      performed_by,
      details,
      transfer_reference_id
    })
    .select();
    
  if (error) {
    console.error('Error creating inventory movement:', error);
    throw error;
  }
  
  return data?.[0];
};

// Hook to fetch inventory movements with filters
export const useInventoryMovements = (filters?: Record<string, any>) => {
  const query = useQuery({
    queryKey: ['inventory-movements', filters],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          products:product_id (name, sku),
          warehouse:warehouse_id (name, location),
          location:location_id (floor, zone),
          performer:performed_by (name, username)
        `);

      // Apply filters if provided
      if (filters) {
        if (filters.productId) {
          query = query.eq('product_id', filters.productId);
        }
        if (filters.warehouseId) {
          query = query.eq('warehouse_id', filters.warehouseId);
        }
        if (filters.locationId) {
          query = query.eq('location_id', filters.locationId);
        }
        if (filters.movementType) {
          query = query.eq('movement_type', filters.movementType);
        }
        if (filters.status) {
          // Only use values that match the database enum
          if (['pending', 'approved', 'rejected', 'in_transit'].includes(filters.status)) {
            query = query.eq('status', filters.status);
          }
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }
        if (filters.referenceId) {
          query = query.eq('reference_id', filters.referenceId);
        }
        if (filters.performedBy) {
          query = query.eq('performed_by', filters.performedBy);
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching inventory movements:', error);
        throw error;
      }

      return data as InventoryMovement[];
    }
  });

  return {
    movements: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

// Hook to create movement mutations
export const useCreateInventoryMovement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      productId,
      warehouseId,
      locationId,
      quantity,
      movementType,
      status,
      referenceTable,
      referenceId,
      performedBy,
      details
    }: {
      productId: string;
      warehouseId: string;
      locationId: string;
      quantity: number;
      movementType: MovementType;
      status: MovementStatus; // Match DB enum exactly
      referenceTable?: string;
      referenceId?: string;
      performedBy: string;
      details?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.from('inventory_movements').insert({
        product_id: productId,
        warehouse_id: warehouseId,
        location_id: locationId,
        movement_type: movementType,
        quantity: quantity,
        status: status,
        reference_table: referenceTable,
        reference_id: referenceId,
        performed_by: performedBy,
        details: details || {}
      }).select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      toast({
        title: 'Movement Created',
        description: 'Inventory movement has been recorded.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to create inventory movement:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create inventory movement',
      });
    }
  });
};

// Hook to update movement status
export const useUpdateMovementStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      movementId, 
      status 
    }: { 
      movementId: string; 
      status: MovementStatus; // Match DB enum exactly
    }) => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .update({ status })
        .eq('id', movementId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast({
        title: 'Status Updated',
        description: 'Movement status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update movement status',
      });
    }
  });
};
