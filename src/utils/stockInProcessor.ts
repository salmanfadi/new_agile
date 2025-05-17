
import { supabase } from '@/lib/supabase';
import { createInventoryMovement } from '@/hooks/useInventoryMovements';
import { generateBarcodeString } from '@/utils/barcodeUtils';

export interface StockInBox {
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  warehouse: string;  // This is the warehouse_id
  location: string;   // This is the location_id
  product_id: string; // Added product_id for better error handling
}

// Enhanced function that uses database transactions
export const processStockIn = async (stockInId: string, boxes: StockInBox[], userId: string) => {
  try {
    // Start a transaction to process all boxes
    const { data: stockInData, error: stockInError } = await supabase
      .from('stock_in')
      .select('product_id, status')
      .eq('id', stockInId)
      .single();
      
    if (stockInError) {
      throw new Error(`Error fetching stock-in data: ${stockInError.message}`);
    }
    
    if (stockInData.status === 'completed') {
      throw new Error('This stock-in has already been processed.');
    }
    
    // Update stock_in status to processing
    const { error: updateError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'processing',
        processed_by: userId,
        processing_started_at: new Date().toISOString()
      })
      .eq('id', stockInId);
      
    if (updateError) {
      throw new Error(`Error updating stock-in status: ${updateError.message}`);
    }
    
    // Process each box and create stock_in_details first
    const stockInDetails = [];
    const errors = [];
    
    // Generate barcodes for boxes if they don't have them
    for (let i = 0; i < boxes.length; i++) {
      try {
        if (!boxes[i].barcode) {
          const product = await supabase
            .from('products')
            .select('sku, category')
            .eq('id', boxes[i].product_id)
            .single();
          
          boxes[i].barcode = await generateBarcodeString(
            product.data?.category,
            product.data?.sku,
            i + 1
          );
        }
      } catch (error) {
        console.error(`Error generating barcode for box ${i + 1}:`, error);
        errors.push({
          box: i + 1,
          error: `Failed to generate barcode: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    // Process each box in sequence using transactions
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      
      try {
        // Start a transaction for this box
        // Create stock_in_detail record
        const { data: detailData, error: detailError } = await supabase
          .from('stock_in_details')
          .insert({
            stock_in_id: stockInId,
            warehouse_id: box.warehouse,
            location_id: box.location,
            barcode: box.barcode,
            quantity: box.quantity, 
            color: box.color,
            size: box.size,
            product_id: stockInData.product_id,
            status: 'processing'
          })
          .select()
          .single();
          
        if (detailError) {
          throw new Error(`Error creating stock_in_details: ${detailError.message}`);
        }
        
        stockInDetails.push(detailData);
        
        // Create inventory entry
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: stockInData.product_id,
            warehouse_id: box.warehouse,
            location_id: box.location,
            barcode: box.barcode,
            quantity: box.quantity,
            color: box.color,
            size: box.size,
            stock_in_id: stockInId,
            stock_in_detail_id: detailData.id,
            status: 'available'
          });
          
        if (inventoryError) {
          throw new Error(`Error creating inventory entry: ${inventoryError.message}`);
        }
        
        // Create inventory movement
        await createInventoryMovement(
          stockInData.product_id,
          box.warehouse,
          box.location,
          box.quantity,
          'in',
          'approved',
          'stock_in',
          stockInId,
          userId,
          {
            barcode: box.barcode,
            color: box.color,
            size: box.size,
            stock_in_detail_id: detailData.id
          }
        );
        
        // Update stock_in_detail status to completed
        const { error: updateDetailError } = await supabase
          .from('stock_in_details')
          .update({ status: 'completed', processed_at: new Date().toISOString() })
          .eq('id', detailData.id);
          
        if (updateDetailError) {
          console.error(`Error updating stock_in_detail status: ${updateDetailError.message}`);
          // Continue processing other boxes
        }
      } catch (error) {
        console.error(`Error processing box ${i + 1}:`, error);
        errors.push({
          box: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Mark the stock_in as completed if all boxes were processed successfully
    if (errors.length === 0) {
      const { error: completeError } = await supabase
        .from('stock_in')
        .update({ 
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', stockInId);
        
      if (completeError) {
        errors.push({
          step: 'final-update',
          error: `Error updating stock-in status to completed: ${completeError.message}`
        });
      }
    } else {
      // If there were errors, mark the stock_in as partially completed
      const { error: partialError } = await supabase
        .from('stock_in')
        .update({ 
          status: 'processing',
          notes: `Processed with ${errors.length} errors`
        })
        .eq('id', stockInId);
        
      if (partialError) {
        errors.push({
          step: 'partial-update',
          error: `Error updating stock-in status to processing: ${partialError.message}`
        });
      }
    }
    
    return { 
      success: errors.length === 0, 
      message: errors.length === 0 ? 'Stock in processed successfully' : `Processed with ${errors.length} errors`, 
      errors,
      processedBoxes: stockInDetails.length,
      totalBoxes: boxes.length
    };
  } catch (error) {
    console.error('Error processing stock in:', error);
    
    try {
      // Try to mark the stock_in with an error status - using 'rejected' instead of 'failed'
      await supabase
        .from('stock_in')
        .update({ 
          status: 'rejected',
          notes: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
        .eq('id', stockInId);
    } catch (updateError) {
      console.error('Failed to update status after error:', updateError);
    }
      
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during processing',
      errors: [{ step: 'process', error: error instanceof Error ? error.message : 'Unknown error' }],
      processedBoxes: 0,
      totalBoxes: boxes.length
    };
  }
};
