
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
    console.log(`Starting stock in processing for ID: ${stockInId}`, boxes);
    
    // First update stock in status to approved directly (changed from "processing")
    const { error: updateError } = await supabase
      .from('stock_in')
      .update({ 
        status: "approved", // Changed from "processing" to "approved"
        processed_by: userId 
      })
      .eq('id', stockInId);

    if (updateError) {
      console.error('Error updating stock-in status:', updateError);
      throw updateError;
    }

    // Get product_id from stock_in for inventory creation
    const { data: stockInData, error: stockInFetchError } = await supabase
      .from('stock_in')
      .select('product_id, source, notes')
      .eq('id', stockInId)
      .single();

    if (stockInFetchError) {
      console.error('Error fetching stock-in data:', stockInFetchError);
      throw stockInFetchError;
    }

    if (!stockInData) {
      console.error('Stock in not found');
      throw new Error('Stock in not found');
    }

    console.log(`Processing ${boxes.length} boxes for product_id: ${stockInData.product_id}`);
    
    const auditEntries = [];
    const barcodeErrors = [];

    // Calculate total quantity across all boxes
    const totalQuantity = boxes.reduce((total, box) => total + box.quantity, 0);
    
    // Create a new processed batch record
    const { data: batchData, error: batchError } = await supabase
      .from('processed_batches')
      .insert({
        stock_in_id: stockInId,
        processed_by: userId,
        product_id: stockInData.product_id,
        total_quantity: totalQuantity,
        total_boxes: boxes.length,
        warehouse_id: boxes[0]?.warehouse_id, // Use the first box's warehouse as default
        source: stockInData.source,
        notes: stockInData.notes,
        status: 'completed'
      })
      .select('id')
      .single();
      
    if (batchError) {
      console.error('Error creating processed batch record:', batchError);
      throw batchError;
    }
    
    const batchId = batchData.id;
    console.log(`Created new processed batch with ID: ${batchId}`);

    // Create stock in details for each box and inventory entries
    for (const box of boxes) {
      try {
        // Ensure box has a valid barcode - CRITICAL FIX
        if (!box.barcode || box.barcode.trim() === '') {
          const newBarcode = uuidv4();
          console.log(`Box missing barcode, generating new one: ${newBarcode}`);
          box.barcode = newBarcode;
        }
        
        const boxBarcode = box.barcode;
        
        // Validate barcode to ensure consistency with inventory system
        const { exists: barcodeExists, item: existingItem } = await validateBarcode(boxBarcode);
        
        // If barcode exists, log an error but continue with others
        if (barcodeExists) {
          const errorMsg = `Duplicate barcode found: ${boxBarcode} - Already assigned to product ID: ${existingItem.product_id}`;
          console.error(errorMsg);
          barcodeErrors.push({
            barcode: boxBarcode,
            error: errorMsg,
            existingItem
          });
          continue; // Skip this box and continue with others
        }
        
        // Create a stock in detail entry
        const { data: detailData, error: detailError } = await supabase
          .from('stock_in_details')
          .insert([{
            stock_in_id: stockInId,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: boxBarcode, // Using the validated barcode
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
            product_id: stockInData.product_id // Ensure product_id is set
          }])
          .select('id')
          .single();
        
        if (detailError) {
          console.error('Error creating stock_in_detail:', detailError);
          throw detailError;
        }
        
        // Save the detail ID to use as batch_id in the inventory entry
        const detailId = detailData?.id;
        
        // Create a batch item record
        const { error: batchItemError } = await supabase
          .from('batch_items')
          .insert({
            batch_id: batchId,
            barcode: boxBarcode,
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            status: 'available'
          });
          
        if (batchItemError) {
          console.error('Error creating batch item:', batchItemError);
          throw batchItemError;
        }
        
        // Create an inventory entry for this box
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert([{
            product_id: stockInData.product_id,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: boxBarcode,
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
            status: 'available',
            batch_id: batchId  // Link to the processed batch
          }]);
        
        if (inventoryError) {
          console.error('Error creating inventory entry:', inventoryError);
          throw inventoryError;
        }

        // Create a barcode log entry for audit trail
        const { error: logError } = await supabase
          .from('barcode_logs')
          .insert([{
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
          }]);
        
        if (logError) {
          console.warn('Warning: Failed to create barcode log:', logError);
          // Don't throw for log failures, just warn
        } else {
          // Add to successful audit entries
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

    // Create a notification for the processed stock in
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

    // Ensure we set the status to 'completed' to finalize the process
    const { error: finalUpdateError } = await supabase
      .from('stock_in')
      .update({ status: 'completed' })
      .eq('id', stockInId);

    if (finalUpdateError) {
      console.error('Error finalizing stock-in status:', finalUpdateError);
      // Don't throw here, as we've already processed the inventory
      console.warn('Stock-in status update to completed failed, but inventory has been updated');
    }

    // If there were barcode errors, return them along with success status
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
