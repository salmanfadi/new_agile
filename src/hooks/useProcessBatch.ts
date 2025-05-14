
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createInventoryMovement } from './useInventoryMovements';

interface BatchFormData {
  product_id: string;
  number_of_boxes: number;
  quantity_per_box: number;
  warehouse_id: string;
  location_id: string;
  color: string | null;
  size: string | null;
}

interface ProcessedBatch {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  batch_number: string;
  processing_order: number;
  processed_at: string | null;
}

export const useProcessBatch = () => {
  const [batches, setBatches] = useState<ProcessedBatch[]>([]);
  const [isPending, setIsPending] = useState(false);

  const processBatch = async (batchData: BatchFormData) => {
    try {
      setIsPending(true);

      // Create a unique batch ID for tracing
      const batchId = crypto.randomUUID();

      // 1. Create a new stock_in record
      const { data: stockIn, error: stockInError } = await supabase
        .from('stock_in')
        .insert({
          product_id: batchData.product_id,
          source: 'batch',
          status: 'processing',
          submitted_by: (await supabase.auth.getUser()).data.user?.id,
          boxes: batchData.number_of_boxes,
        })
        .select()
        .single();

      if (stockInError) throw stockInError;

      // 2. Create a processed_batches record
      const { data: processedBatch, error: batchError } = await supabase
        .from('processed_batches')
        .insert({
          stock_in_id: stockIn.id,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'completed',
          source: 'direct batch creation',
          total_boxes: batchData.number_of_boxes,
          total_quantity: batchData.number_of_boxes * batchData.quantity_per_box,
          processed_at: new Date().toISOString(),
          product_id: batchData.product_id,
          warehouse_id: batchData.warehouse_id
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // 3. Create stock-in details and inventory entries for each box
      const details = [];
      const currentUser = (await supabase.auth.getUser()).data.user?.id;

      for (let i = 0; i < batchData.number_of_boxes; i++) {
        const barcode = `B${processedBatch.id.substring(0, 8)}-${i + 1}`;
        
        // First create stock_in_detail to satisfy FK constraint
        const { data: detail, error: detailError } = await supabase
          .from('stock_in_details')
          .insert({
            stock_in_id: stockIn.id,
            warehouse_id: batchData.warehouse_id,
            location_id: batchData.location_id,
            barcode,
            quantity: batchData.quantity_per_box,
            color: batchData.color,
            size: batchData.size,
            product_id: batchData.product_id
          })
          .select()
          .single();

        if (detailError) throw detailError;
        details.push(detail);

        // Create batch_item record
        await supabase
          .from('batch_items')
          .insert({
            batch_id: processedBatch.id,
            barcode,
            quantity: batchData.quantity_per_box,
            color: batchData.color,
            size: batchData.size,
            warehouse_id: batchData.warehouse_id,
            location_id: batchData.location_id,
            status: 'available'
          });

        // Add to inventory with reference to stock_in_detail
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: batchData.product_id,
            warehouse_id: batchData.warehouse_id,
            location_id: batchData.location_id,
            barcode,
            quantity: batchData.quantity_per_box,
            color: batchData.color,
            size: batchData.size,
            status: 'available',
            batch_id: processedBatch.id,
            stock_in_id: stockIn.id,
            stock_in_detail_id: detail.id
          })
          .select()
          .single();

        if (inventoryError) throw inventoryError;

        // Create inventory movement record
        await createInventoryMovement(
          batchData.product_id,
          batchData.warehouse_id,
          batchData.location_id,
          batchData.quantity_per_box,
          'in',
          'approved',
          'stock_in',
          stockIn.id,
          currentUser || '',
          {
            barcode,
            batch_id: processedBatch.id,
            stock_in_detail_id: detail.id
          }
        );
      }

      // 4. Update stock_in status to completed
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);

      if (updateError) throw updateError;

      return { batch: processedBatch, details };
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    batches,
    processBatch,
    isPending,
  };
};
