import { supabase } from '../lib/supabase';

// Function to update the stock details for a product
export const updateStockDetails = async (productId: string, quantity: number, warehouseId: string) => {
  try {
    // Check if the product already exists in the warehouse
    const { data: existingStock, error: stockError } = await supabase
      .from('warehouse_stock')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .single();

    if (stockError && stockError.status !== 404) {
      console.error('Error checking existing stock:', stockError);
      throw stockError;
    }

    if (existingStock) {
      // If the product exists, update the quantity
      const { error: updateError } = await supabase
        .from('warehouse_stock')
        .update({ quantity: existingStock.quantity + quantity })
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId);

      if (updateError) {
        console.error('Error updating stock:', updateError);
        throw updateError;
      }
    } else {
      // If the product doesn't exist, create a new entry
      const { error: insertError } = await supabase
        .from('warehouse_stock')
        .insert([{ product_id: productId, quantity, warehouse_id: warehouseId }]);

      if (insertError) {
        console.error('Error inserting stock:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error in updateStockDetails:', error);
    throw error;
  }
};

// Function to log stock movement
const logStockMovement = async (
  stockInId: string,
  productId: string,
  action: string,
  quantity: number,
  userId: string,
  details: any
) => {
  try {
    await supabase
      .from('stock_movement_audit')
      .insert({
        stock_in_id: stockInId,
        product_id: productId,
        action,
        quantity,
        user_id: userId,
        details
      });
  } catch (error) {
    console.error('Error logging stock movement:', error);
  }
};

// Main function to process stock-in
export const processStockIn = async (stockInId: string, userId: string, warehouseId: string) => {
  try {
    // Fetch the stock-in details
    const { data: stockIn, error: stockInError } = await supabase
      .from('stock_in')
      .select('product_id, boxes')
      .eq('id', stockInId)
      .single();

    if (stockInError) {
      console.error('Error fetching stock-in details:', stockInError);
      throw stockInError;
    }

    if (!stockIn) {
      throw new Error(`Stock-in with ID ${stockInId} not found.`);
    }

    // Update stock details in the warehouse
    await updateStockDetails(stockIn.product_id, stockIn.boxes, warehouseId);

    // Log the stock movement
    await logStockMovement(stockInId, stockIn.product_id, 'stock_in', stockIn.boxes, userId, {
      warehouse_id: warehouseId,
    });

    // Update the stock-in status to 'completed'
    const { error: updateError } = await supabase
      .from('stock_in')
      .update({ status: 'completed', processed_by: userId })
      .eq('id', stockInId);

    if (updateError) {
      console.error('Error updating stock-in status:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error processing stock-in:', error);
    throw error;
  }
};
