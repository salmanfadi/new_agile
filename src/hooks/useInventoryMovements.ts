
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryMovement, InventoryMovementFilters } from '@/types/inventory';

export const useInventoryMovements = (filters: InventoryMovementFilters = {}) => {
  const fetchInventoryMovements = async () => {
    try {
      let query = supabase
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
          product:product_id (name, sku),
          warehouse:warehouse_id (name, location),
          location:location_id (floor, zone),
          performer:performed_by (name, username)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters if provided
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
        query = query.eq('status', filters.status);
      }
      
      if (filters.referenceId) {
        query = query.eq('reference_id', filters.referenceId);
      }
      
      if (filters.performedBy) {
        query = query.eq('performed_by', filters.performedBy);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching inventory movements:', error);
        throw error;
      }
      
      return data as InventoryMovement[];
    } catch (error) {
      console.error('Failed to fetch inventory movements:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch inventory movement data.',
      });
      throw error;
    }
  };
  
  return useQuery({
    queryKey: ['inventory-movements', filters],
    queryFn: fetchInventoryMovements,
  });
};

// Helper function to create a new inventory movement
export const createInventoryMovement = async (
  productId: string,
  warehouseId: string,
  locationId: string,
  quantity: number,
  movementType: 'in' | 'out' | 'adjustment' | 'reserve' | 'release',
  status: 'pending' | 'approved' | 'rejected' | 'in_transit',
  referenceTable: string,
  referenceId: string,
  userId: string,
  details?: any
) => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: productId,
        warehouse_id: warehouseId,
        location_id: locationId,
        movement_type: movementType,
        quantity: quantity,
        status: status,
        reference_table: referenceTable,
        reference_id: referenceId,
        performed_by: userId,
        details: details || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory movement:', error);
      throw error;
    }

    return data as InventoryMovement;
  } catch (error) {
    console.error('Error in createInventoryMovement:', error);
    throw error;
  }
};
