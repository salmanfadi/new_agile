
import { supabase } from '@/lib/supabase';
import { createInventoryMovement } from '@/hooks/useInventoryMovements';

export interface StockInBox {
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  warehouse: string;  // This is the warehouse_id
  location: string;   // This is the location_id
  metadata?: {
    weight?: number;
    dimensions?: {
      width?: number;
      height?: number;
      length?: number;
    };
    remarks?: string;
  };
}

export const processStockIn = async (stockInId: string, boxes: StockInBox[], userId: string) => {
  try {
    // Start a transaction to process all boxes
    const { data: stockInData, error: stockInError } = await supabase
      .from('stock_in')
      .select('product_id, status')
      .eq('id', stockInId)
      .single();
      
    if (stockInError) {
      throw stockInError;
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
      throw updateError;
    }
    
    // Process each box and create stock_in_details first
    const stockInDetails = [];
    for (const box of boxes) {
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
          status: 'completed',
          metadata: box.metadata || {}
        })
        .select()
        .single();
        
      if (detailError) {
        throw detailError;
      }
      
      stockInDetails.push(detailData);
    }
    
    // Now process each box and create inventory records with reference to stock_in_details
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const detail = stockInDetails[i];
      
      // Create inventory record with reference to stock_in_detail
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          product_id: stockInData.product_id,
          warehouse_id: box.warehouse,
          location_id: box.location,
          barcode: box.barcode,
          quantity: box.quantity,
          color: box.color,
          size: box.size,
          status: 'available',
          stock_in_id: stockInId,
          stock_in_detail_id: detail.id // Include the reference to stock_in_detail
        })
        .select()
        .single();
        
      if (inventoryError) {
        console.error('Error creating inventory record:', inventoryError);
        throw inventoryError;
      }
      
      // Create inventory movement for this box
      await createInventoryMovement(
        stockInData.product_id,
        box.warehouse,
        box.location,
        box.quantity, 
        'in',
        'approved', // Use literal string matching DB enum
        'stock_in',
        stockInId,
        userId,
        {
          barcode: box.barcode,
          color: box.color,
          size: box.size,
          stock_in_detail_id: detail.id
        }
      );
    }
    
    // Mark the stock_in as processing but not completed yet
    // Final completion will happen after barcode assignment
    const { error: processingError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', stockInId);
      
    if (processingError) {
      throw processingError;
    }
    
    return { success: true, message: 'Stock in processing started' };
  } catch (error) {
    console.error('Error processing stock in:', error);
    
    try {
      // Try to mark the stock_in with an error status - using 'rejected' instead of 'failed'
      await supabase
        .from('stock_in')
        .update({ status: 'rejected' })
        .eq('id', stockInId);
    } catch (updateError) {
      console.error('Failed to update status after error:', updateError);
    }
      
    throw error;
  }
};
