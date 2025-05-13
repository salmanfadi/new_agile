import { supabase } from '@/integrations/supabase/client';
import { BoxData, StockInData } from '@/hooks/useStockInBoxes';
import { v4 as uuidv4 } from 'uuid';
import { validateStockInRequest } from './stockInValidation';

interface InsertResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Validates if a barcode already exists in the inventory system
 * @param barcode Barcode to validate
 * @returns Boolean indicating if barcode exists and any inventory item with that barcode
 */
const validateBarcode = async (barcode: string): Promise<{ exists: boolean; item: any }> => {
  if (!barcode) {
    throw new Error('Barcode is required');
  }

  if (typeof barcode !== 'string') {
    throw new Error('Barcode must be a string');
  }

  if (!barcode.trim()) {
    throw new Error('Barcode cannot be empty');
  }

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('id')
      .eq('barcode', barcode)
      .maybeSingle();
    
    if (error) {
      console.error('Error validating barcode:', error);
      throw error;
    }
    
    return { exists: !!data, item: data };
  } catch (error) {
    console.error('Error in validateBarcode:', error);
    throw error;
  }
};

/**
 * Logs a barcode operation
 * @param barcode The barcode being operated on
 * @param action The action being performed
 * @param details Additional details about the operation
 * @param userId The ID of the user performing the operation
 */
const logBarcodeOperation = async (
  barcode: string,
  action: string,
  details: Record<string, any>,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('barcode_logs')
      .insert({
        barcode,
        action,
        details,
        created_by: userId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging barcode operation:', error);
      // Don't throw here, just log the error
    }
  } catch (error) {
    console.error('Error in logBarcodeOperation:', error);
  }
};

/**
 * Process a stock-in request by adding items to inventory
 * @param stockInId The ID of the stock-in request
 * @param boxes Array of box data to process
 * @param submittedBy The ID of the user submitting the stock-in
 * @returns Object containing success status and any barcode errors
 */
export const processStockIn = async (
  stockInId: string,
  boxes: BoxData[],
  submittedBy: string
): Promise<{ success: boolean; processedBoxes: BoxData[]; errors: { barcode: string; error: string; }[] }> => {
  const barcodeErrors: { barcode: string; error: string; }[] = [];
  const processedBoxes: BoxData[] = [];

  try {
    // Validate input data
    if (!validateStockInRequest(boxes)) {
      throw new Error('Invalid stock in data. Please check all required fields.');
    }

    // Start a transaction
    const { error: updateError } = await supabase
      .from('stock_in')
      .update({ 
        status: 'processing',
        processed_by: submittedBy
      })
      .eq('id', stockInId)
      .single();

    if (updateError) {
      console.error('Error updating stock in status:', updateError);
      throw new Error('Failed to update stock in status');
    }

    // Process each box
    for (const box of boxes) {
      try {
        // Validate barcode
        if (!box.barcode) {
          barcodeErrors.push({
            barcode: '',
            error: 'Barcode is required and cannot be null'
          });
          continue;
        }

        const { exists } = await validateBarcode(box.barcode);
        if (exists) {
          barcodeErrors.push({
            barcode: box.barcode,
            error: 'Barcode already exists in inventory'
          });
          continue;
        }

        // Insert stock in details
        const { error: insertError, data: detailData } = await supabase
          .from('stock_in_details')
          .insert({
            stock_in_id: stockInId,
            barcode: box.barcode,
            quantity: box.quantity || 0,
            color: box.color || '',
            size: box.size || '',
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            product_id: box.product_id,
            created_by: submittedBy
          })
          .single() as InsertResult<{ id: string }>;

        if (insertError) {
          console.error('Error inserting stock in details:', insertError);
          barcodeErrors.push({
            barcode: box.barcode,
            error: insertError.message
          });
          continue;
        }

        processedBoxes.push(box);

        // Insert into inventory
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: box.product_id,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: box.barcode,
            quantity: box.quantity || 0,
            color: box.color || '',
            size: box.size || '',
            batch_id: stockInId,
            stock_in_detail_id: detailData?.id,
            status: 'available'
          })
          .single();

        if (inventoryError) {
          console.error('Error inserting into inventory:', inventoryError);
          barcodeErrors.push({
            barcode: box.barcode,
            error: inventoryError.message
          });
          continue;
        }

        // Log the barcode operation
        await logBarcodeOperation(
          box.barcode,
          'stock_in_processed',
          {
            stock_in_id: stockInId,
            product_id: box.product_id,
            quantity: box.quantity || 0,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            color: box.color || '',
            size: box.size || '',
            batch_id: stockInId,
            stock_in_detail_id: detailData?.id
          },
          submittedBy
        );
      } catch (error) {
        console.error('Error processing box:', error);
        barcodeErrors.push({
          barcode: box.barcode,
          error: error instanceof Error ? error.message : 'Failed to process box'
        });
      }
    }

    // Update stock in status based on results
    const finalStatus = barcodeErrors.length > 0 ? 'partial' : 'completed';
    const { error: finalUpdateError } = await supabase
      .from('stock_in')
      .update({ 
        status: finalStatus,
        processed_by: submittedBy,
        processed_at: new Date().toISOString()
      })
      .eq('id', stockInId)
      .single();

    if (finalUpdateError) {
      console.error('Error updating final stock in status:', finalUpdateError);
      throw new Error('Failed to update final stock in status');
    }

    return {
      success: barcodeErrors.length === 0,
      processedBoxes,
      errors: barcodeErrors
    };
  } catch (error) {
    // If anything fails, try to revert the stock_in status to 'pending'
    await supabase
      .from('stock_in')
      .update({ 
        status: 'pending',
        processed_by: null
      })
      .eq('id', stockInId);
      
    console.error('Error in processStockIn transaction:', error);
    throw error;
  }
};
