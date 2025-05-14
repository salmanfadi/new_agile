
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryMovement, InventoryMovementFilters, MovementType, MovementStatus } from '@/types/inventory';

export const useInventoryMovements = (filters: InventoryMovementFilters = {}) => {
  const fetchInventoryMovements = async () => {
    try {
      // Use the new inventory_movements table with related data
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
          transfer_reference_id,
          details,
          products:product_id (name, sku),
          warehouses:warehouse_id (name, location),
          warehouse_locations:location_id (floor, zone),
          profiles:performed_by (name, username)
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
      
      // Map the data to our InventoryMovement interface
      const movements: InventoryMovement[] = data?.map(item => {
        // Parse the details if it's a string and use supplied details or empty object as fallback
        let parsedDetails;
        if (typeof item.details === 'string') {
          try {
            parsedDetails = JSON.parse(item.details);
          } catch (err) {
            parsedDetails = {};
            console.error('Error parsing details JSON:', err);
          }
        } else {
          parsedDetails = item.details || {};
        }

        return {
          id: item.id,
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          location_id: item.location_id,
          movement_type: item.movement_type,
          quantity: item.quantity,
          status: item.status,
          reference_table: item.reference_table,
          reference_id: item.reference_id,
          performed_by: item.performed_by,
          created_at: item.created_at,
          transfer_reference_id: item.transfer_reference_id,
          details: parsedDetails,
          product: item.products ? {
            name: item.products.name,
            sku: item.products.sku
          } : undefined,
          warehouse: item.warehouses ? {
            name: item.warehouses.name,
            location: item.warehouses.location
          } : undefined,
          location: item.warehouse_locations ? {
            floor: item.warehouse_locations.floor,
            zone: item.warehouse_locations.zone
          } : undefined,
          performer: item.profiles ? {
            name: item.profiles.name,
            username: item.profiles.username
          } : undefined
        };
      }) || [];
      
      return movements;
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
  movementType: MovementType,
  status: MovementStatus,
  referenceTable: string,
  referenceId: string,
  userId: string,
  details?: any,
  transferReferenceId?: string
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
        details: details || {},
        transfer_reference_id: transferReferenceId
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
