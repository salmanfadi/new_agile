
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

    if (stockError && stockError.code !== '406') { // Modified from stockError.status to stockError.code
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

// Function to create an inventory movement record
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
        details: details || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory movement:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createInventoryMovement:', error);
    throw error;
  }
};

// Main function to process stock-in
export const processStockIn = async (stockInId: string, boxes: any[], userId: string) => {
  try {
    // Fetch the stock-in details
    const { data: stockIn, error: stockInError } = await supabase
      .from('stock_in')
      .select('product_id, boxes, source')
      .eq('id', stockInId)
      .single();

    if (stockInError) {
      console.error('Error fetching stock-in details:', stockInError);
      throw stockInError;
    }

    if (!stockIn) {
      throw new Error(`Stock-in with ID ${stockInId} not found.`);
    }
    
    // Get the warehouse_id from the first box
    if (!boxes || boxes.length === 0) {
      throw new Error('No boxes provided for processing');
    }
    
    const warehouseId = boxes[0].warehouse_id;
    if (!warehouseId) {
      throw new Error('Warehouse ID is required');
    }

    // Process each box and create inventory movements
    for (const box of boxes) {
      // Ensure all required fields are present
      if (!box.location_id || !box.barcode) {
        console.error('Missing required box data:', box);
        throw new Error('Box is missing required fields (location_id, barcode)');
      }

      // Create inventory movement record for this box
      await createInventoryMovement(
        stockIn.product_id,
        box.warehouse_id,
        box.location_id,
        box.quantity || 1, // Default to 1 if quantity is not provided
        'in',
        'approved',
        'stock_in',
        stockInId,
        userId,
        {
          barcode: box.barcode,
          color: box.color,
          size: box.size,
          source: stockIn.source
        }
      );
    }

    // For backward compatibility, still update the legacy stock details
    await updateStockDetails(stockIn.product_id, stockIn.boxes, warehouseId);

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
