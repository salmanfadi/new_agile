// @ts-nocheck
// Edge Function for processing stock-in requests
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Define valid status values
type StockInStatus = 'pending' | 'processing' | 'completed' | 'approved' | 'rejected' | 'failed';

interface Batch {
  warehouse_id: string;
  location_id: string;
  base_barcode?: string;
  box_count?: number;
  quantity_per_box?: number;
  boxCount?: number;
  quantityPerBox?: number;
  color?: string;
  size?: string;
}

interface StockInPayload {
  run_id: string;
  stock_in_id: string;
  user_id: string;
  product_id: string;
  batches: Batch[];
}

// Generate sequential barcodes based on base barcode and box number
function generateBarcode(baseBarcode: string | undefined, boxNumber: number): string {
  // If baseBarcode is not provided, generate a random one
  const base = baseBarcode || `BC${Math.floor(10000000 + Math.random() * 90000000)}`;
  const numericPart = base.replace(/\D/g, '');
  const boxSuffix = String(boxNumber).padStart(3, '0');
  return `${numericPart}${boxSuffix}`;
}

// Helper function to safely update stock_in status
async function safeUpdateStockIn(supabase: any, stockInId: string, updates: any) {
  try {
    // Map the status to the correct timestamp column
    const timestampField = updates.status === 'processing' 
      ? 'processing_started_at' 
      : updates.status === 'completed' 
        ? 'processing_completed_at' 
        : updates.status === 'failed'
          ? 'updated_at'
          : 'updated_at';

    const updateData = {
      ...updates,
      [timestampField]: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stock_in')
      .update(updateData)
      .eq('id', stockInId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in safeUpdateStockIn:', error);
    return { data: null, error };
  }
}

// Cleanup function to remove any partial data in case of failure
async function cleanupPartialData(
  supabase: any,
  stockInId: string,
  batchIds: string[],
  barcodes: string[]
) {
  console.log('Starting cleanup of partial data...');
  
  // Delete any created barcodes
  if (barcodes.length > 0) {
    console.log(`Deleting ${barcodes.length} barcodes...`);
    const { error: barcodeError } = await supabase
      .from('barcodes')
      .delete()
      .in('barcode', barcodes);
    
    if (barcodeError) {
      console.error('Error cleaning up barcodes:', barcodeError);
    }
  }

  // Delete any processed boxes
  if (batchIds.length > 0) {
    console.log(`Deleting processed boxes for ${batchIds.length} batches...`);
    const { error: boxError } = await supabase
      .from('batch_items')
      .delete()
      .in('batch_id', batchIds);
    
    if (boxError) {
      console.error('Error cleaning up processed boxes:', boxError);
    }
  }

  // Delete any processed batches
  if (batchIds.length > 0) {
    console.log(`Deleting ${batchIds.length} processed batches...`);
    const { error: batchError } = await supabase
      .from('processed_batches')
      .delete()
      .in('id', batchIds);
    
    if (batchError) {
      console.error('Error cleaning up processed batches:', batchError);
    }
  }

  // Delete any inventory items
  if (batchIds.length > 0) {
    console.log(`Deleting inventory items for ${batchIds.length} batches...`);
    const { error: inventoryError } = await supabase
      .from('inventory')
      .delete()
      .in('batch_id', batchIds);
    
    if (inventoryError) {
      console.error('Error cleaning up inventory items:', inventoryError);
    }
  }

  // Reset stock_in status safely
  console.log('Resetting stock_in status...');
  const { error: updateError } = await safeUpdateStockIn(supabase, stockInId, {
    status: 'failed',
    error_message: 'Processing failed'
  });

  if (updateError) {
    console.error('Error resetting stock_in status:', updateError);
  }

  console.log('Cleanup completed.');
}

// Helper function to safely parse JSON
async function safeJsonParse(jsonString: string): Promise<any> {
  try {
    // First try direct parsing
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    try {
      // Some clients might double-encode the JSON
      return JSON.parse(JSON.parse(jsonString));
    } catch (nestedError) {
      console.error('Error with nested JSON parsing attempt:', nestedError);
      return null;
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Received request`);
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      const error = 'Missing Supabase configuration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set';
      console.error(`[${requestId}] ${error}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error,
          requestId
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`[${requestId}] Creating Supabase client`);
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
    });

    // Track all created resources for cleanup
    const createdBatches: string[] = [];
    const createdBarcodes: string[] = [];
    const now = new Date().toISOString();

    // Parse the request body
    let payload: StockInPayload;
    try {
      // Get the raw request body
      const body = await req.text();
      
      // Log detailed information about the request
      console.log(`[${requestId}] Request headers:`, JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
      console.log(`[${requestId}] Raw body length:`, body.length);
      console.log(`[${requestId}] First 500 chars of body:`, body.substring(0, 500));
      
      // Try to parse the JSON
      const parsed = await safeJsonParse(body);
      if (!parsed) {
        throw new Error('Invalid JSON payload - Could not parse request body');
      }
      
      // Log the structure of the parsed data
      console.log(`[${requestId}] Parsed data structure:`, 
        JSON.stringify({
          has_run_id: !!parsed.run_id,
          has_stock_in_id: !!parsed.stock_in_id,
          has_user_id: !!parsed.user_id,
          has_product_id: !!parsed.product_id,
          batches_length: Array.isArray(parsed.batches) ? parsed.batches.length : 'not an array',
          first_batch: parsed.batches && parsed.batches[0] ? 
            JSON.stringify({
              has_warehouse_id: !!parsed.batches[0].warehouse_id,
              has_location_id: !!parsed.batches[0].location_id,
              boxCount_type: typeof parsed.batches[0].boxCount,
              boxCount_value: parsed.batches[0].boxCount,
              quantityPerBox_type: typeof parsed.batches[0].quantityPerBox,
              quantityPerBox_value: parsed.batches[0].quantityPerBox
            }) : 'no batches'
        }, null, 2));
      
      // Assign the parsed data to payload
      payload = parsed as StockInPayload;
      
      console.log(`[${requestId}] Processing payload for stock-in:`, payload.stock_in_id);
    } catch (error) {
      const errorMsg = 'Invalid request body';
      console.error(`[${requestId}] ${errorMsg}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          details: error instanceof Error ? error.message : 'Unknown error',
          requestId
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // Start by marking the stock_in as processing
      console.log(`[${requestId}] Updating stock_in status to 'processing'...`);
      const { error: updateStatusError } = await safeUpdateStockIn(supabaseClient, payload.stock_in_id, {
        status: 'processing',
        processed_by: payload.user_id
      });

      if (updateStatusError) {
        throw new Error(`Failed to update stock_in status: ${updateStatusError.message}`);
      }

      // Process each batch
      for (const [index, batch] of payload.batches.entries()) {
        console.log(`[${requestId}] Processing batch ${index + 1}/${payload.batches.length}`);
        
        // Log the raw batch data for debugging
        console.log(`[${requestId}] Raw batch data:`, JSON.stringify(batch, null, 2));
        
        // Extract batch data
        const batchBoxCount = typeof batch.boxCount === 'string' ? parseInt(batch.boxCount, 10) : 
                            Number(batch.boxCount || batch.box_count || 10);
                            
        const batchQtyPerBox = typeof batch.quantityPerBox === 'string' ? parseInt(batch.quantityPerBox, 10) : 
                             Number(batch.quantityPerBox || batch.quantity_per_box || 10);
        
        // Calculate total quantity
        const totalQuantity = batchBoxCount * batchQtyPerBox;
        
        // Log the values
        console.log(`[${requestId}] Using boxCount:`, batchBoxCount);
        console.log(`[${requestId}] Using qtyPerBox:`, batchQtyPerBox);
        console.log(`[${requestId}] Calculated totalQuantity:`, totalQuantity);
        
        if (isNaN(totalQuantity) || totalQuantity <= 0) {
          throw new Error(`Invalid quantity calculation: ${batchBoxCount} boxes × ${batchQtyPerBox} items = ${totalQuantity}`);
        }

        if (batchBoxCount <= 0) {
          throw new Error(`Invalid box count: ${batchBoxCount}`);
        }

        if (batchQtyPerBox <= 0) {
          throw new Error(`Invalid quantity per box: ${batchQtyPerBox}`);
        }

        console.log(`[${requestId}] Batch data received:`, {
          box_count: batch.box_count,
          boxCount: batch.boxCount,
          quantity_per_box: batch.quantity_per_box,
          quantityPerBox: batch.quantityPerBox,
          calculated: {
            boxCount: batchBoxCount,
            qtyPerBox: batchQtyPerBox,
            totalQuantity
          }
        });

        // We've already calculated these values above
        // Using the values we already calculated
        
        // Create a processed batch record with all required fields
        const processedBatchData = {
          id: crypto.randomUUID(), // Explicitly set the ID
          batch_number: String(batch.base_barcode || `BATCH-${Date.now()}`),
          product_id: payload.product_id,
          quantity_processed: totalQuantity,
          processed_at: now,
          processed_by: payload.user_id,
          status: 'processing',
          total_boxes: batchBoxCount,
          total_quantity: totalQuantity, // This is the critical field
          warehouse_id: batch.warehouse_id,
          created_at: now,
          updated_at: now,
          location_id: batch.location_id || null,
          stock_in_id: payload.stock_in_id || null,
          notes: `Processed ${batchBoxCount} boxes with ${batchQtyPerBox} items each`,
          source: 'stock-in-process',
          total_items: totalQuantity
        };

        // Debug log the values
        console.log(`[${requestId}] Batch calculation: `, {
          box_count: batchBoxCount,
          quantity_per_box: batchQtyPerBox,
          calculated_total: totalQuantity,
          is_valid: !isNaN(totalQuantity) && totalQuantity > 0
        });

        console.log(`[${requestId}] Creating processed batch with data:`, JSON.stringify(processedBatchData, null, 2));
        
        
        // First try direct insertion
        try {
          const { data: processedBatch, error: batchError } = await supabaseClient
            .from('processed_batches')
            .insert(processedBatchData)
            .select('id, status, total_quantity, total_boxes')
            .single();

          if (batchError) throw batchError;
          
          console.log(`[${requestId}] Successfully created processed batch:`, processedBatch.id);
          createdBatches.push(processedBatch.id);
          let batchId = processedBatch.id;
        } catch (insertError) {
          console.error(`[${requestId}] Error in direct insert, trying with raw SQL:`, insertError);
          
          // Fallback to raw SQL if direct insert fails
          const { data, error: sqlError } = await supabaseClient.rpc('execute_sql', {
            query: `
              INSERT INTO processed_batches (
                id, batch_number, product_id, quantity_processed, processed_at, 
                processed_by, status, total_boxes, total_quantity, warehouse_id, 
                created_at, updated_at, location_id, stock_in_id, notes, source, 
                total_items
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
              ) RETURNING id, status, total_quantity, total_boxes
            `,
            params: [
              processedBatchData.id,
              processedBatchData.batch_number,
              processedBatchData.product_id,
              processedBatchData.quantity_processed,
              processedBatchData.processed_at,
              processedBatchData.processed_by,
              processedBatchData.status,
              processedBatchData.total_boxes,
              processedBatchData.total_quantity,
              processedBatchData.warehouse_id,
              processedBatchData.created_at,
              processedBatchData.updated_at,
              processedBatchData.location_id,
              processedBatchData.stock_in_id,
              processedBatchData.notes,
              processedBatchData.source,
              processedBatchData.total_items
            ]
          });

          if (sqlError) {
            console.error(`[${requestId}] Raw SQL insert failed:`, sqlError);
            throw new Error(`Failed to create processed batch: ${sqlError.message}`);
          }
          
          console.log(`[${requestId}] Successfully created processed batch via raw SQL:`, data);
          createdBatches.push(data.id);
          let batchId = data.id;
        }
        
        let batchId = createdBatches[createdBatches.length - 1];

        // Prepare all boxes, inventory items, and barcodes for batch insert
        const boxInserts = [];
        const inventoryInserts = [];
        const barcodeInserts = [];
        const boxBarcodes: string[] = [];

        console.log(`[${requestId}] Processing ${batch.boxCount || batch.box_count} boxes for batch ${batchId}`);
        
        // Generate all box, inventory, and barcode data first
        for (let i = 0; i < (batch.boxCount || batch.box_count); i++) {
          const boxNumber = i + 1;
          // Generate a base barcode if not provided, using batch ID and product ID as fallback
          const baseBarcode = batch.base_barcode || `BC-${payload.product_id.substring(0, 8)}-${batchId.substring(0, 4)}`;
          const boxBarcode = generateBarcode(baseBarcode, boxNumber);
          const boxId = crypto.randomUUID();
          
          // Data for batch_items table (with barcode)
          const boxData = {
            id: boxId,
            batch_id: batchId,
            barcode: boxBarcode,
            quantity: batch.quantityPerBox || batch.quantity_per_box,
            status: 'available',
            warehouse_id: batch.warehouse_id,
            location_id: batch.location_id || null,
            // Removed product_id as it's not in the schema
            created_at: now,
            updated_at: now,
            color: batch.color || null,
            size: batch.size || null
          };
          boxInserts.push(boxData);

          // Data for inventory table
          const inventoryData = {
            product_id: payload.product_id,
            warehouse_id: batch.warehouse_id,
            location_id: batch.location_id || null,
            batch_id: batchId,
            // Removed box_id as it's not in the schema
            barcode: boxBarcode,
            quantity: batch.quantityPerBox || batch.quantity_per_box,
            status: 'available',
            created_at: now,
            updated_at: now,
            color: batch.color || null,
            size: batch.size || null
          };
          inventoryInserts.push(inventoryData);

          // Data for barcodes table
          const barcodeData = {
            barcode: boxBarcode,
            box_id: boxId,
            product_id: payload.product_id,
            warehouse_id: batch.warehouse_id,
            location_id: batch.location_id || null,
            batch_id: batchId,
            quantity: batch.quantityPerBox || batch.quantity_per_box,
            status: 'active',
            created_at: now,
            updated_at: now
          };
          barcodeInserts.push(barcodeData);
          
          console.log(`[${requestId}] Prepared box ${boxNumber}/${batch.boxCount || batch.box_count}:`, JSON.stringify(boxData, null, 2));
        }

        // Insert all batch items with error handling
        if (boxInserts.length > 0) {
          console.log(`[${requestId}] Inserting ${boxInserts.length} batch items...`);
          const { error: boxError } = await supabaseClient
            .from('batch_items')
            .insert(boxInserts);

          if (boxError) {
            console.error(`[${requestId}] Error creating batch items:`, boxError);
            throw new Error(`Failed to create batch items: ${boxError.message}`);
          }
          console.log(`[${requestId}] Successfully inserted batch items`);
        }

        // Insert all inventory items with error handling
        if (inventoryInserts.length > 0) {
          console.log(`[${requestId}] Inserting ${inventoryInserts.length} inventory items...`);
          const { error: inventoryError } = await supabaseClient
            .from('inventory')
            .insert(inventoryInserts);

          if (inventoryError) {
            console.error(`[${requestId}] Error creating inventory items:`, inventoryError);
            throw new Error(`Failed to create inventory items: ${inventoryError.message}`);
          }
          console.log(`[${requestId}] Successfully inserted inventory items`);
        }

        // Insert all barcodes with error handling
        if (barcodeInserts.length > 0) {
          console.log(`[${requestId}] Inserting ${barcodeInserts.length} barcodes...`);
          const { error: barcodeError } = await supabaseClient
            .from('barcodes')
            .insert(barcodeInserts);

          if (barcodeError) {
            console.error(`[${requestId}] Error creating barcodes:`, barcodeError);
            throw new Error(`Failed to create barcodes: ${barcodeError.message}`);
          }
          console.log(`[${requestId}] Successfully inserted barcodes`);
        }

        // Mark batch as completed - handle missing completed_at column
        try {
          const updateData: Record<string, any> = {
            status: 'completed',
            updated_at: now,
            quantity_processed: totalQuantity,
            total_boxes: batch.boxCount || batch.box_count
          };

          // Try to set completed_at, but don't fail if column doesn't exist
          try {
            updateData.completed_at = now;
          } catch (e) {
            console.warn(`[${requestId}] Could not set completed_at - column may not exist`);
          }

          const { error: batchUpdateError } = await supabaseClient
            .from('processed_batches')
            .update(updateData)
            .eq('id', batchId);

          if (batchUpdateError) {
            console.error(`[${requestId}] Error updating batch status:`, batchUpdateError);
            throw new Error(`Failed to update batch status: ${batchUpdateError.message}`);
          }
          
          console.log(`[${requestId}] Batch ${batchId} marked as completed with ${batch.boxCount || batch.box_count} boxes`);
        } catch (updateError) {
          console.error(`[${requestId}] Error in batch completion:`, updateError);
          throw new Error(`Failed to complete batch: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
        }
      }

      // After processing all batches, update stock_in status to completed
      console.log(`[${requestId}] Successfully processed ${payload.batches.length} batches`);
      
      // Mark stock_in as completed
      await safeUpdateStockIn(supabaseClient, payload.stock_in_id, {
        status: 'completed',
        processed_by: payload.user_id,
        processed_at: now
      });

      // Return success response with batch IDs
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Stock-in processed successfully',
          batch_ids: createdBatches,
          requestId
        }),
        { status: 200, headers: corsHeaders }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${requestId}] Error in transaction:`, error);
      
      // Clean up any partial data
      try {
        await cleanupPartialData(
          supabaseClient,
          payload.stock_in_id,
          createdBatches,
          createdBarcodes
        );
      } catch (cleanupError) {
        console.error(`[${requestId}] Error during cleanup:`, cleanupError);
      }

      // Update stock_in status back to 'pending' so it can be processed again
      const errorUpdate = await safeUpdateStockIn(supabaseClient, payload.stock_in_id, {
        status: 'pending',
        error_message: errorMessage
      });

      if (!errorUpdate.success) {
        console.error(`[${requestId}] Failed to update stock_in with error:`, errorUpdate.error);
      }

      const errorResponse = {
        success: false,
        error: 'Failed to process stock-in',
        details: errorMessage,
        requestId
      };

      console.error(`[${requestId}] Error response:`, JSON.stringify(errorResponse, null, 2));
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    console.error(`[${requestId || 'unknown'}] Unhandled error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        requestId: requestId || 'unknown'
      }),
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
});