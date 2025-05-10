
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
      .select('product_id')
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

    // Create stock in details for each box and inventory entries
    for (const box of boxes) {
      try {
        // Ensure box has a valid barcode
        const boxBarcode = box.barcode || uuidv4();
        
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
            barcode: boxBarcode,
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
          }])
          .select('id')
          .single();
        
        if (detailError) {
          console.error('Error creating stock_in_detail:', detailError);
          throw detailError;
        }
        
        // Save the detail ID to use as batch_id in the inventory entry
        const batchId = detailData?.id;
        
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
            batch_id: batchId  // Link to the batch ID
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
            details: {
              stock_in_id: stockInId,
              product_id: stockInData.product_id,
              quantity: box.quantity,
              batch_id: batchId,
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
        boxes_count: boxes.length,
        product_id: stockInData.product_id,
        audit_entries: auditEntries,
        barcode_errors: barcodeErrors
      }
    }]);

    // If there were barcode errors, return them along with success status
    if (barcodeErrors.length > 0) {
      console.warn(`Completed with ${barcodeErrors.length} barcode validation errors:`, barcodeErrors);
      return { 
        success: true, 
        barcodeErrors 
      };
    }

    console.log(`Successfully processed stock-in: ${stockInId}`);
    return { success: true };
  } catch (error) {
    console.error('Stock-in processing failed:', error);
    throw error;
  }
};
