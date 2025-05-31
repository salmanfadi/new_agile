import { supabase } from '@/lib/supabase';
import { ReserveStock, ReserveStockWithDetails, CreateReserveStockDTO } from '@/types/reserve-stock';

export const reserveStockService = {
  async create(data: CreateReserveStockDTO): Promise<ReserveStock> {
    try {
      // Check if there's enough inventory
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity, warehouse_id')
        .eq('product_id', data.product_id)
        .gt('quantity', 0);

      if (inventoryError) throw inventoryError;
      
      // Calculate total available quantity
      const totalAvailable = inventoryItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      
      if (!inventoryItems?.length || totalAvailable < data.quantity) {
        throw new Error(`Not enough inventory available. Requested: ${data.quantity}, Available: ${totalAvailable}`);
      }

      // Find the inventory item with enough quantity
      const targetInventory = inventoryItems.find(item => item.quantity >= data.quantity) || inventoryItems[0];

      // Create the reservation
      const { data: reserveStock, error: reserveError } = await supabase
        .from('reserve_stocks')
        .insert([{
          product_id: data.product_id,
          customer_name: data.customer_name,
          quantity: data.quantity,
          start_date: data.start_date,
          end_date: data.end_date,
          status: 'pending'
        }])
        .select()
        .single();

      if (reserveError) throw reserveError;

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: targetInventory.quantity - data.quantity })
        .eq('id', targetInventory.id);

      if (updateError) throw updateError;

      // Record the movement in audit log
      const { error: auditError } = await supabase
        .from('stock_movement_audit')
        .insert([{
          product_id: data.product_id,
          warehouse_id: targetInventory.warehouse_id,
          quantity: data.quantity,
          movement_type: 'reserve',
          reference_id: reserveStock.id,
          reference_type: 'reserve_stock',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (auditError) throw auditError;

      return reserveStock;
    } catch (error) {
      console.error('Error creating reserve stock:', error);
      throw error;
    }
  },

  async getAll(): Promise<ReserveStockWithDetails[]> {
    const { data, error } = await supabase
      .from('reserve_stocks')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<ReserveStockWithDetails> {
    const { data, error } = await supabase
      .from('reserve_stocks')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, data: Partial<ReserveStock>): Promise<ReserveStock> {
    // Start a transaction if we're cancelling or completing the reservation
    if (data.status === 'cancelled' || data.status === 'completed') {
      const { error: beginError } = await supabase.rpc('begin_transaction');
      if (beginError) throw beginError;

      try {
        // Get the current reservation
        const { data: currentReservation, error: getError } = await supabase
          .from('reserve_stocks')
          .select('*')
          .eq('id', id)
          .single();

        if (getError) throw getError;

        // Update the reservation status
        const { data: updatedStock, error: updateError } = await supabase
          .from('reserve_stocks')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // If cancelling, return the quantity to inventory
        if (data.status === 'cancelled') {
          // Get the inventory record
          const { data: inventory, error: inventoryError } = await supabase
            .from('inventory')
            .select('id, quantity, warehouse_id')
            .eq('product_id', currentReservation.product_id)
            .single();

          if (inventoryError) throw inventoryError;

          // Update inventory quantity
          const { error: updateInventoryError } = await supabase
            .from('inventory')
            .update({ quantity: inventory.quantity + currentReservation.quantity })
            .eq('id', inventory.id);

          if (updateInventoryError) throw updateInventoryError;

          // Record the movement in audit log
          const { error: auditError } = await supabase
            .from('stock_movement_audit')
            .insert([{
              product_id: currentReservation.product_id,
              warehouse_id: inventory.warehouse_id,
              quantity: currentReservation.quantity,
              movement_type: 'unreserve',
              reference_id: id,
              reference_type: 'reserve_stock',
              created_by: (await supabase.auth.getUser()).data.user?.id
            }]);

          if (auditError) throw auditError;
        }

        // Commit the transaction
        const { error: commitError } = await supabase.rpc('commit_transaction');
        if (commitError) throw commitError;

        return updatedStock;
      } catch (error) {
        // Rollback on any error
        await supabase.rpc('rollback_transaction');
        throw error;
      }
    } else {
      // For other updates, just update the reservation
      const { data: updatedStock, error } = await supabase
        .from('reserve_stocks')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedStock;
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('reserve_stocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 