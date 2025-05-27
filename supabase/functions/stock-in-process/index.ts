import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Box {
  barcode: string;
  quantity: number;
  color: string;
  size: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  status: string;
}

interface Batch {
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  boxCount: number;
  quantityPerBox: number;
  color: string;
  size: string;
  batchBarcode?: string;
  boxBarcodes?: string[];
}

interface StockInPayload {
  run_id: string;
  stock_in_id: string;
  user_id: string;
  product_id: string;
  batches: Batch[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set up the authenticated client
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    });

    const payload: StockInPayload = await req.json();
    console.log('Processing payload:', payload);

    // Start a transaction
    const { data: client } = await supabaseClient.rpc('get_service_role');
    const { error: transactionError } = await client.rpc('begin_transaction');
    if (transactionError) throw transactionError;

    try {
      // Update stock_in status to processing
      const { error: updateError } = await client
        .from('stock_in')
        .update({
          status: 'processing',
          processed_by: payload.user_id,
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', payload.stock_in_id);

      if (updateError) throw updateError;

      const batchIds: string[] = [];

      // Process each batch
      for (const batch of payload.batches) {
        // Create processed batch record
        const { data: processedBatch, error: batchError } = await client
          .from('processed_batches')
          .insert({
            stock_in_id: payload.stock_in_id,
            processed_by: payload.user_id,
            product_id: payload.product_id,
            warehouse_id: batch.warehouse_id,
            location_id: batch.location_id,
            total_boxes: batch.boxCount,
            total_quantity: batch.boxCount * batch.quantityPerBox,
            status: 'completed',
            processed_at: new Date().toISOString(),
            batch_number: batch.batchBarcode || null
          })
          .select()
          .single();

        if (batchError) throw batchError;
        batchIds.push(processedBatch.id);

        // Process each box in the batch
        for (let i = 0; i < batch.boxCount; i++) {
          const boxBarcode = batch.boxBarcodes?.[i] || `${batch.batchBarcode}-${(i + 1).toString().padStart(3, '0')}`;
          
          // Create stock_in_detail record
          const { data: stockInDetail, error: detailError } = await client
            .from('stock_in_details')
            .insert({
              stock_in_id: payload.stock_in_id,
              product_id: payload.product_id,
              barcode: boxBarcode,
              quantity: batch.quantityPerBox,
              color: batch.color || null,
              size: batch.size || null,
              warehouse_id: batch.warehouse_id,
              location_id: batch.location_id,
              status: 'completed',
              batch_number: batch.batchBarcode || null,
              processed_at: new Date().toISOString()
            })
            .select()
            .single();

          if (detailError) throw detailError;

          // Create inventory record
          const { error: inventoryError } = await client
            .from('inventory')
            .insert({
              product_id: payload.product_id,
              warehouse_id: batch.warehouse_id,
              location_id: batch.location_id,
              barcode: boxBarcode,
              quantity: batch.quantityPerBox,
              color: batch.color || null,
              size: batch.size || null,
              status: 'in_stock',
              batch_id: processedBatch.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (inventoryError) throw inventoryError;
        }
      }

      // Update stock_in status to completed
      const { error: finalizeError } = await client
        .from('stock_in')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', payload.stock_in_id);

      if (finalizeError) throw finalizeError;

      // Commit transaction
      const { error: commitError } = await client.rpc('commit_transaction');
      if (commitError) throw commitError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Stock-in processed successfully',
          batch_ids: batchIds
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (error) {
      // Rollback transaction on error
      const { error: rollbackError } = await client.rpc('rollback_transaction');
      if (rollbackError) console.error('Rollback failed:', rollbackError);
      
      throw error;
    }

  } catch (error) {
    console.error('Error processing stock-in:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 