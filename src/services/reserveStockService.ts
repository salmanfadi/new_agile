import { supabase } from '@/lib/supabase';
import { ReserveStock, ReserveStockWithDetails, CreateReserveStockDTO } from '@/types/reserve-stock';

export const reserveStockService = {
  async create(data: CreateReserveStockDTO): Promise<ReserveStock> {
    // Start a transaction
    const { error: beginError } = await supabase.rpc('begin_transaction');
    if (beginError) throw beginError;

    try {
      // Check if there's enough inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', data.product_id)
        .single();

      if (inventoryError) throw inventoryError;
      if (!inventory || inventory.quantity < data.quantity) {
        throw new Error('Not enough inventory available');
      }

      // Create the reservation
      const { data: reserveStock, error: reserveError } = await supabase
        .from('reserve_stocks')
        .insert([{
          ...data,
          status: 'pending',
          warehouse_id: inventory.warehouse_id,
          location_id: inventory.location_id
        }])
        .select()
        .single();

      if (reserveError) throw reserveError;

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: inventory.quantity - data.quantity })
        .eq('id', inventory.id);

      if (updateError) throw updateError;

      // Record the movement in audit log
      const { error: auditError } = await supabase
        .from('stock_movement_audit')
        .insert([{
          inventory_id: inventory.id,
          action: 'reserve',
          quantity: data.quantity,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (auditError) throw auditError;

      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

      return reserveStock;
    } catch (error) {
      // Rollback on any error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  },

  async getAll(): Promise<ReserveStockWithDetails[]> {
    const { data, error } = await supabase
      .from('reserve_stocks')
      .select(`
        *,
        product:products(id, name, sku),
        customer:customers(id, name)
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
        product:products(id, name, sku),
        customer:customers(id, name)
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
            .select('id, quantity')
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
              inventory_id: inventory.id,
              action: 'unreserve',
              quantity: currentReservation.quantity,
              performed_by: (await supabase.auth.getUser()).data.user?.id
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