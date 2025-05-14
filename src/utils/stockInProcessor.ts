import { supabase } from '@/integrations/supabase/client';
import { BoxData, StockInData } from '@/hooks/useStockInBoxes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validates if a barcode already exists in the inventory system
 * @param barcode Barcode to validate
 * @returns Boolean indicating if barcode exists and any inventory item with that barcode
 */
const validateBarcode = async (barcode: string) => {
  // Check if barcode already exists in inventory
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();
    
  if (error) {
    console.error('Error validating barcode:', error);
    throw error;
  }
  
  return { exists: !!data, item: data };
};

/**
 * Processes stock in request and adds items to inventory
 * @param stockInId Stock in request ID
 * @param boxes Array of box data with barcodes, quantities, etc.
 * @param userId User ID processing the request
 * @returns Boolean indicating success
 */
export const processStockIn = async (stockInId: string, boxes: BoxData[], userId?: string) => {
  try {
    console.log('Starting stock-in processing for:', stockInId);
    
    // Get the stock in data first
    const { data: stockInData, error: stockInError } = await supabase
      .from('stock_in')
      .select('*')
      .eq('id', stockInId)
      .single();
      
    if (stockInError) {
      console.error('Error fetching stock in data:', stockInError);
      throw stockInError;
    }
    
    if (!stockInData) {
      throw new Error('Stock in record not found');
    }
    
    // Create a batch record
    const { data: batchData, error: batchError } = await supabase
      .from('processed_batches')
      .insert({
        stock_in_id: stockInId,
        processed_by: userId || '',
        status: 'processing',
        source: 'batch processing',
        total_boxes: boxes.length,
        total_quantity: boxes.reduce((sum, box) => sum + box.quantity, 0),
        processed_at: new Date().toISOString(),
        product_id: stockInData.product_id,
      })
      .select()
      .single();
      
    if (batchError) {
      console.error('Error creating batch record:', batchError);
      throw batchError;
    }
    
    const batchId = batchData.id;
    const barcodeErrors: any[] = [];
    const auditEntries: any[] = [];
    
    // Process each box
    for (const box of boxes) {
      try {
        // Ensure box has a valid barcode
        if (!box.barcode || box.barcode.trim() === '') {
          const newBarcode = uuidv4();
          console.log(`Box missing barcode, generating new one: ${newBarcode}`);
          box.barcode = newBarcode;
        }
        
        const boxBarcode = box.barcode;
        
        // Validate barcode
        const { exists: barcodeExists, item: existingItem } = await validateBarcode(boxBarcode);
        
        if (barcodeExists) {
          const errorMsg = `Duplicate barcode found: ${boxBarcode} - Already assigned to product ID: ${existingItem.product_id}`;
          console.error(errorMsg);
          barcodeErrors.push({
            barcode: boxBarcode,
            error: errorMsg,
            existingItem
          });
          continue;
        }
        
        // Get current inventory quantity for this product and location
        const { data: currentInventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', stockInData.product_id)
          .eq('warehouse_id', box.warehouse_id)
          .eq('location_id', box.location_id)
          .single();
          
        if (inventoryError && inventoryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error checking current inventory:', inventoryError);
          throw inventoryError;
        }
        
        const currentQuantity = currentInventory?.quantity || 0;
        const newQuantity = currentQuantity + box.quantity;
        
        // Create stock in detail entry
        const { data: detailData, error: detailError } = await supabase
          .from('stock_in_details')
          .insert([{
            stock_in_id: stockInId,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: boxBarcode,
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
            product_id: stockInData.product_id
          }])
          .select('id')
          .single();
        
        if (detailError) {
          console.error('Error creating stock_in_detail:', detailError);
          throw detailError;
        }
        
        const detailId = detailData?.id;
        
        // Create or update inventory entry
        const { error: inventoryUpdateError } = await supabase
          .from('inventory')
          .upsert({
            product_id: stockInData.product_id,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: boxBarcode,
            quantity: newQuantity,
            color: box.color || null,
            size: box.size || null,
            status: 'available',
            batch_id: batchId,
            last_updated_by: userId,
            last_updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,warehouse_id,location_id'
          });
        
        if (inventoryUpdateError) {
          console.error('Error updating inventory:', inventoryUpdateError);
          throw inventoryUpdateError;
        }
        
        // Create stock movement audit entry - Check if table exists first
        try {
          const { error: auditError } = await supabase
            .from('stock_audit_log')  // Changed from stock_movement_audit to stock_audit_log
            .insert({
              inventory_id: detailId,
              movement_type: 'stock_in',
              quantity: box.quantity,
              previous_quantity: currentQuantity,
              new_quantity: newQuantity,
              performed_by: userId,
              reference_id: batchId,
              reference_type: 'batch',
              notes: `Batch stock in: ${batchId}`
            });
          
          if (auditError) {
            // Don't throw, just log the error
            console.error('Error creating audit entry:', auditError);
          }
        } catch (auditError) {
          console.warn('Audit logging failed, continuing process:', auditError);
          // Continue execution, don't block on audit failure
        }
        
        // Create barcode log entry
        const { error: logError } = await supabase
          .from('barcode_logs')
          .insert({
            barcode: boxBarcode,
            action: 'stock_in_processed',
            user_id: userId || '',
            batch_id: batchId,
            details: {
              stock_in_id: stockInId,
              product_id: stockInData.product_id,
              quantity: box.quantity,
              processed_batch_id: batchId,
              warehouse_id: box.warehouse_id,
              location_id: box.location_id,
              color: box.color || null,
              size: box.size || null,
              processed_at: new Date().toISOString()
            }
          });
        
        if (logError) {
          console.warn('Warning: Failed to create barcode log:', logError);
        } else {
          auditEntries.push({
            barcode: boxBarcode,
            batchId: batchId,
            action: 'stock_in_processed'
          });
        }
        
        console.log(`Processed box with barcode: ${boxBarcode}, batch_id: ${batchId}`);
      } catch (boxError) {
        console.error('Error processing individual box:', boxError);
        throw boxError;
      }
    }
    
    // Update batch status to completed
    const { error: batchUpdateError } = await supabase
      .from('processed_batches')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);
      
    if (batchUpdateError) {
      console.error('Error updating batch status:', batchUpdateError);
      throw batchUpdateError;
    }
    
    // Update stock in status
    const { error: finalUpdateError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'completed',
        processed_by: userId,
        processed_at: new Date().toISOString()
      })
      .eq('id', stockInId);
      
    if (finalUpdateError) {
      console.error('Error finalizing stock-in status:', finalUpdateError);
      console.warn('Stock-in status update to completed failed, but inventory has been updated');
    }
    
    // Create notification
    await supabase.from('notifications').insert([{
      user_id: userId || '',
      role: 'warehouse_manager',
      action_type: 'stock_in_processed',
      metadata: {
        stock_in_id: stockInId,
        processed_batch_id: batchId,
        boxes_count: boxes.length,
        product_id: stockInData.product_id,
        audit_entries: auditEntries,
        barcode_errors: barcodeErrors
      }
    }]);
    
    if (barcodeErrors.length > 0) {
      console.warn(`Completed with ${barcodeErrors.length} barcode validation errors:`, barcodeErrors);
      return { 
        success: true,
        processed_batch_id: batchId,
        barcodeErrors
      };
    }
    
    console.log(`Successfully processed stock-in: ${stockInId}, batch: ${batchId}`);
    return { 
      success: true,
      processed_batch_id: batchId
    };
  } catch (error) {
    console.error('Stock-in processing failed:', error);
    throw error;
  }
};
