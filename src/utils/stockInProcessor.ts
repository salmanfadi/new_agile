
import { supabase } from '@/integrations/supabase/client';
import { BoxData, StockInData } from '@/hooks/useStockInBoxes';

export const processStockIn = async (stockInId: string, boxes: BoxData[], userId?: string) => {
  // First update stock in status to processing
  const { error: updateError } = await supabase
    .from('stock_in')
    .update({ 
      status: "processing",
      processed_by: userId 
    })
    .eq('id', stockInId);

  if (updateError) throw updateError;

  // Create stock in details for each box
  const stockInDetailPromises = boxes.map(box => {
    return supabase
      .from('stock_in_details')
      .insert([{
        stock_in_id: stockInId,
        warehouse_id: box.warehouse_id,
        location_id: box.location_id,
        barcode: box.barcode,
        quantity: box.quantity,
        color: box.color || null,
        size: box.size || null,
      }]);
  });
  
  const stockInDetailsResults = await Promise.all(stockInDetailPromises);
  const stockInDetailsError = stockInDetailsResults.find(result => result.error);
  
  if (stockInDetailsError) throw stockInDetailsError.error;

  // Get product_id from stock_in for inventory creation
  const { data: stockInData } = await supabase
    .from('stock_in')
    .select('product_id')
    .eq('id', stockInId)
    .single();

  if (!stockInData) throw new Error('Stock in not found');

  // Create inventory entries for each box
  const inventoryPromises = boxes.map(box => {
    return supabase
      .from('inventory')
      .insert([{
        product_id: stockInData.product_id,
        warehouse_id: box.warehouse_id,
        location_id: box.location_id,
        barcode: box.barcode,
        quantity: box.quantity,
        color: box.color || null,
        size: box.size || null,
      }]);
  });
  
  const inventoryResults = await Promise.all(inventoryPromises);
  const inventoryError = inventoryResults.find(result => result.error);
  
  if (inventoryError) throw inventoryError.error;

  // Create a notification for the processed stock in
  await supabase.from('notifications').insert([{
    user_id: userId,
    role: 'warehouse_manager', 
    action_type: 'stock_in_processed',
    metadata: {
      stock_in_id: stockInId,
      boxes_count: boxes.length,
      product_id: stockInData.product_id
    }
  }]);

  // Finally update stock in status to approved (instead of completed)
  const { error: completeError } = await supabase
    .from('stock_in')
    .update({ status: "approved" })
    .eq('id', stockInId);

  if (completeError) throw completeError;

  return true;
};
