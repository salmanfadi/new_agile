
import { supabase } from '@/integrations/supabase/client';
import { createInventoryMovement } from '@/hooks/useInventoryMovements';

export interface StockInBox {
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  warehouse: string;
  location: string;
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
    const { error: completeError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', stockInId);
      
    if (completeError) {
      throw completeError;
    }
    
    return { success: true, message: 'Stock in processed successfully' };
  } catch (error) {
    console.error('Error processing stock in:', error);
    
    // Try to mark the stock_in as failed
    await supabase
      .from('stock_in')
      .update({ status: 'failed' })
      .eq('id', stockInId);
      
    throw error;
  }
};
