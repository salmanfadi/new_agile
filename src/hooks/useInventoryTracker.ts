
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MovementType, MovementStatus } from '@/types/inventory';

// Interface for tracking inventory balance changes
export interface InventoryBalanceChange {
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  direction: 'in' | 'out';
  barcode?: string;
  movementType: MovementType;
  referenceId?: string;
  referenceTable?: string;
  userId: string;
  color?: string;
  size?: string;
  notes?: string;
  batchId?: string;
}

export const useInventoryTracker = () => {
  const queryClient = useQueryClient();

  // Record stock in (add to inventory)
  const recordStockIn = useMutation({
    mutationFn: async (data: InventoryBalanceChange) => {
      try {
        // 1. Create an inventory movement record
        const movementData = {
          product_id: data.productId,
          warehouse_id: data.warehouseId,
          location_id: data.locationId,
          quantity: data.quantity,
          movement_type: data.movementType,
          status: 'approved' as MovementStatus,
          reference_table: data.referenceTable,
          reference_id: data.referenceId,
          performed_by: data.userId,
          details: {
            barcode: data.barcode,
            color: data.color,
            size: data.size,
            notes: data.notes,
            direction: 'in',
            batch_id: data.batchId
          }
        };
        
        const { data: movement, error: movementError } = await supabase
          .from('inventory_movements')
          .insert(movementData)
          .select()
          .single();
          
        if (movementError) throw movementError;
        
        // 2. Check if this item already exists in inventory (by barcode)
        if (data.barcode) {
          const { data: existingItem, error: itemError } = await supabase
            .from('inventory')
            .select('*')
            .eq('barcode', data.barcode)
            .maybeSingle();
            
          if (itemError) throw itemError;
          
          if (existingItem) {
            // Update existing inventory item
            const { error: updateError } = await supabase
              .from('inventory')
              .update({
                quantity: existingItem.quantity + data.quantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingItem.id);
              
            if (updateError) throw updateError;
          } else {
            // Create new inventory item
            const { error: createError } = await supabase
              .from('inventory')
              .insert({
                product_id: data.productId,
                warehouse_id: data.warehouseId,
                location_id: data.locationId,
                barcode: data.barcode,
                quantity: data.quantity,
                color: data.color,
                size: data.size,
                status: 'available',
                batch_id: data.batchId
              });
              
            if (createError) throw createError;
          }
        }
        
        return movement;
      } catch (error) {
        console.error('Error recording stock in:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast({
        title: 'Stock In Recorded',
        description: 'Inventory has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Recording Stock In',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  // Record stock out (reduce inventory)
  const recordStockOut = useMutation({
    mutationFn: async (data: InventoryBalanceChange) => {
      try {
        // 1. Check if enough inventory is available
        if (data.barcode) {
          const { data: inventoryItem, error: itemError } = await supabase
            .from('inventory')
            .select('*')
            .eq('barcode', data.barcode)
            .maybeSingle();
            
          if (itemError) throw itemError;
          
          if (!inventoryItem) {
            throw new Error(`Inventory item with barcode ${data.barcode} not found`);
          }
          
          if (inventoryItem.quantity < data.quantity) {
            throw new Error(`Not enough inventory available. Only ${inventoryItem.quantity} items in stock.`);
          }
          
          // 2. Create inventory movement record
          const movementData = {
            product_id: data.productId,
            warehouse_id: data.warehouseId,
            location_id: data.locationId,
            quantity: data.quantity,
            movement_type: data.movementType,
            status: 'approved' as MovementStatus,
            reference_table: data.referenceTable,
            reference_id: data.referenceId,
            performed_by: data.userId,
            details: {
              barcode: data.barcode,
              color: data.color,
              size: data.size,
              notes: data.notes,
              direction: 'out'
            }
          };
          
          const { data: movement, error: movementError } = await supabase
            .from('inventory_movements')
            .insert(movementData)
            .select()
            .single();
            
          if (movementError) throw movementError;
          
          // 3. Update inventory quantity
          const newQuantity = inventoryItem.quantity - data.quantity;
          const { error: updateError } = await supabase
            .from('inventory')
            .update({
              quantity: newQuantity,
              status: newQuantity === 0 ? 'out_of_stock' : inventoryItem.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', inventoryItem.id);
            
          if (updateError) throw updateError;
          
          return movement;
        } else {
          throw new Error('Barcode is required for stock out operations');
        }
      } catch (error) {
        console.error('Error recording stock out:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast({
        title: 'Stock Out Recorded',
        description: 'Inventory has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Recording Stock Out',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  // Get inventory balance for a product across all warehouses
  const getProductBalance = (productId: string) => {
    return useQuery({
      queryKey: ['inventory-balance', productId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_inventory_levels');
        
        if (error) throw error;
        
        // Filter for the requested product
        const productInventory = (data || []).filter(
          item => item.product_id === productId
        );
        
        // Calculate total across all warehouses
        const totalQuantity = productInventory.reduce(
          (sum, item) => sum + Number(item.stock_level), 
          0
        );
        
        return {
          inventoryByLocation: productInventory,
          totalQuantity
        };
      },
      enabled: !!productId
    });
  };

  // Get inventory balance for specific warehouse location
  const getLocationBalance = (warehouseId: string, locationId: string) => {
    return useQuery({
      queryKey: ['inventory-location-balance', warehouseId, locationId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_inventory_levels');
        
        if (error) throw error;
        
        // Filter for the requested warehouse and location
        return (data || []).filter(
          item => item.warehouse_id === warehouseId && item.location_id === locationId
        );
      },
      enabled: !!(warehouseId && locationId)
    });
  };

  return {
    recordStockIn,
    recordStockOut,
    getProductBalance,
    getLocationBalance
  };
};
