
import { supabase } from '@/integrations/supabase/client';
import { createInventoryMovement } from '@/hooks/useInventoryMovements';

export interface StockInBox {
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  warehouse: string;  // This is the warehouse_id
  location: string;   // This is the location_id
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
    // Cast status to movement_status type to fix type mismatch error
    const { error: updateError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'processing'::movement_status,
        processed_by: userId,
        processing_started_at: new Date().toISOString()
      })
      .eq('id', stockInId);
      
    if (updateError) {
      throw updateError;
    }
    
    // Process each box and create inventory movements
    for (const box of boxes) {
      // Create inventory movement for this box
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
          size: box.size
        }
      );
    }
    
    // Mark the stock_in as completed
    // Cast status to movement_status type to fix type mismatch error
    const { error: completeError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'completed'::movement_status,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', stockInId);
      
    if (completeError) {
      throw completeError;
    }
    
    return { success: true, message: 'Stock in processed successfully' };
  } catch (error) {
    console.error('Error processing stock in:', error);
    
    try {
      // Try to mark the stock_in as processing instead of failed
      // Cast status to movement_status type to fix type mismatch error
      await supabase
        .from('stock_in')
        .update({ status: 'processing'::movement_status })
        .eq('id', stockInId);
    } catch (updateError) {
      console.error('Failed to update status after error:', updateError);
    }
      
    throw error;
  }
};
