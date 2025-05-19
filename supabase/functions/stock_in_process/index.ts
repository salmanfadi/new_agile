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
  location_id: string;
  boxes: Box[];
}

interface StockInPayload {
  run_id: string;
  stock_in_id: string;
  user_id: string;
  product_id: string;
  batches: Batch[];
}

// @ts-nocheck // Deno/Supabase Edge Function: ignore TS errors for Deno globals and imports
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

      // Use string[] for batchIds to avoid TS error
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
            total_boxes: batch.boxes.length,
            total_quantity: batch.boxes.reduce((sum, box) => sum + box.quantity, 0),
            status: 'completed'
          })
          .select()
          .single();

        if (batchError) throw batchError;
        batchIds.push(processedBatch.id);

        // Create stock_in_details records first
        for (const box of batch.boxes) {
          const { data: stockInDetail, error: detailError } = await client
            .from('stock_in_details')
            .insert({
              stock_in_id: payload.stock_in_id,
              warehouse_id: batch.warehouse_id,
              location_id: batch.location_id,
              barcode: box.barcode,
              quantity: box.quantity,
              color: box.color,
              size: box.size,
              product_id: payload.product_id,
              status: 'completed'
            })
            .select()
            .single();

          if (detailError) {
            console.error('Error creating stock_in_detail:', detailError);
            throw detailError;
          }

          // Create batch items
          const { error: itemsError } = await client
            .from('batch_items')
            .insert({
              batch_id: processedBatch.id,
              barcode: box.barcode,
              quantity: box.quantity,
              color: box.color,
              size: box.size,
              warehouse_id: batch.warehouse_id,
              location_id: batch.location_id,
              status: 'available'
            });

          if (itemsError) throw itemsError;

          // Now create inventory record with the stock_in_detail ID
          const { error: inventoryError } = await client
            .from('inventory')
            .insert({
              product_id: payload.product_id,
              warehouse_id: batch.warehouse_id,
              location_id: batch.location_id,
              barcode: box.barcode,
              quantity: box.quantity,
              color: box.color,
              size: box.size,
              status: 'available',
              batch_id: stockInDetail.id // Link to stock_in_detail
            });

          if (inventoryError) {
            console.error('Error creating inventory record:', inventoryError);
            throw inventoryError;
          }

          // Update stock_in_detail with inventory reference
          const { error: updateDetailError } = await client
            .from('stock_in_details')
            .update({ status: 'completed', processed_at: new Date().toISOString() })
            .eq('id', stockInDetail.id);

          if (updateDetailError) throw updateDetailError;
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