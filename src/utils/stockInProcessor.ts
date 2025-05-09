
import { supabase } from '@/integrations/supabase/client';
import { BoxData, StockInData } from '@/hooks/useStockInBoxes';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

/**
 * Process a stock in request by updating the status and creating inventory entries
 * 
 * @param stockInId - ID of the stock in request
 * @param boxes - Array of box data to process
 * @param userId - ID of the user processing the request
 * @returns Promise resolving to true if successful
 */
export const processStockIn = async (stockInId: string, boxes: BoxData[], userId?: string) => {
  const traceId = uuidv4().substring(0, 8); // For tracing this operation in logs
  
  console.log(`[${traceId}] Starting stock in processing for ID: ${stockInId}`, boxes);
  
  try {
    // First update stock in status to processing
    const { error: updateError } = await supabase
      .from('stock_in')
      .update({ 
        status: "processing",
        processed_by: userId 
      })
      .eq('id', stockInId);

    if (updateError) {
      console.error(`[${traceId}] Error updating stock-in status:`, updateError);
      throw updateError;
    }

    // Get product_id from stock_in for inventory creation
    const { data: stockInData, error: stockInFetchError } = await supabase
      .from('stock_in')
      .select('product_id')
      .eq('id', stockInId)
      .single();

    if (stockInFetchError) {
      console.error(`[${traceId}] Error fetching stock-in data:`, stockInFetchError);
      throw stockInFetchError;
    }

    if (!stockInData) {
      console.error(`[${traceId}] Stock in not found`);
      throw new Error('Stock in not found');
    }

    console.log(`[${traceId}] Processing ${boxes.length} boxes for product_id: ${stockInData.product_id}`);

    // Create inventory entries and details in a batch for better performance
    const detailsToInsert = [];
    const inventoryToInsert = [];
    const barcodeLogsToInsert = [];
    
    // Prepare all data for batch insertions
    for (const box of boxes) {
      try {
        // Ensure box has a valid barcode
        const boxBarcode = box.barcode || uuidv4();
        
        // Prepare stock in detail entry
        detailsToInsert.push({
          stock_in_id: stockInId,
          warehouse_id: box.warehouse_id,
          location_id: box.location_id,
          barcode: boxBarcode,
          quantity: box.quantity,
          color: box.color || null,
          size: box.size || null,
        });
        
        // Prepare inventory entry
        inventoryToInsert.push({
          product_id: stockInData.product_id,
          warehouse_id: box.warehouse_id,
          location_id: box.location_id,
          barcode: boxBarcode,
          quantity: box.quantity,
          color: box.color || null,
          size: box.size || null,
          status: 'available'
        });
        
        // Prepare barcode log entry
        barcodeLogsToInsert.push({
          barcode: boxBarcode,
          action: 'stock_in_processed',
          user_id: userId || '',
          details: {
            stock_in_id: stockInId,
            product_id: stockInData.product_id,
            quantity: box.quantity,
            trace_id: traceId
          }
        });
        
      } catch (boxError) {
        console.error(`[${traceId}] Error processing individual box:`, boxError);
        // Continue processing other boxes
      }
    }

    // Batch insert all stock in details
    if (detailsToInsert.length > 0) {
      const { error: detailsError } = await supabase
        .from('stock_in_details')
        .insert(detailsToInsert);
        
      if (detailsError) {
        console.error(`[${traceId}] Error creating stock_in_details:`, detailsError);
        throw detailsError;
      }
    }
    
    // Batch insert all inventory entries
    if (inventoryToInsert.length > 0) {
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryToInsert);
        
      if (inventoryError) {
        console.error(`[${traceId}] Error creating inventory entries:`, inventoryError);
        throw inventoryError;
      }
    }
    
    // Batch insert all barcode logs
    if (barcodeLogsToInsert.length > 0) {
      const { error: logError } = await supabase
        .from('barcode_logs')
        .insert(barcodeLogsToInsert);
        
      if (logError) {
        console.warn(`[${traceId}] Warning: Failed to create barcode logs:`, logError);
        // Don't throw for log failures, just warn
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
        trace_id: traceId
      }
    }]);

    // Finally update stock in status to approved
    const { error: completeError } = await supabase
      .from('stock_in')
      .update({ status: "approved" })
      .eq('id', stockInId);

    if (completeError) {
      console.error(`[${traceId}] Error completing stock-in:`, completeError);
      throw completeError;
    }

    console.log(`[${traceId}] Successfully processed stock-in: ${stockInId}`);
    
    // Show success toast - Fix: Use 'default' variant instead of 'success'
    toast({
      title: "Stock-In Processed Successfully",
      description: `${boxes.length} boxes have been added to inventory`,
      variant: "default"  // Fixed variant to be one of the allowed values
    });
    
    return true;
  } catch (error) {
    console.error(`[${traceId}] Stock-in processing failed:`, error);
    
    // Show error toast
    toast({
      title: "Stock-In Processing Failed",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive"
    });
    
    throw error;
  }
};
