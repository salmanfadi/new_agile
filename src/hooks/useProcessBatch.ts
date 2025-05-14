
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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

      // Create a new batch record
      // Note the casting of status to stock_status enum
      const { data: batch, error: batchError } = await supabase
        .from('stock_in')
        .insert({
          product_id: batchData.product_id,
          source: 'batch',
          status: 'processing', // This will be cast to the appropriate enum type by Postgres
          submitted_by: (await supabase.auth.getUser()).data.user?.id,
          boxes: batchData.number_of_boxes,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Create stock-in details for each box
      const details = [];
      for (let i = 0; i < batchData.number_of_boxes; i++) {
        const barcode = `B${batch.id}-${i + 1}`;
        const { data: detail, error: detailError } = await supabase
          .from('stock_in_details')
          .insert({
            stock_in_id: batch.id,
            warehouse_id: batchData.warehouse_id,
            location_id: batchData.location_id,
            barcode,
            quantity: batchData.quantity_per_box,
            color: batchData.color,
            size: batchData.size,
            product_id: batchData.product_id,
            status: 'pending',
            batch_number: batch.id,
            processing_order: i + 1,
          })
          .select()
          .single();

        if (detailError) throw detailError;
        details.push(detail);
      }

      // Update batch status to completed
      // Note the casting of status to stock_status enum
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'completed', // This will be cast to the appropriate enum type by Postgres
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', batch.id);

      if (updateError) throw updateError;

      // Add to inventory
      for (const detail of details) {
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            product_id: detail.product_id,
            warehouse_id: detail.warehouse_id,
            location_id: detail.location_id,
            barcode: detail.barcode,
            quantity: detail.quantity,
            color: detail.color,
            size: detail.size,
            status: 'available',
            batch_id: detail.batch_number,
            stock_in_id: batch.id,
            stock_in_detail_id: detail.id, // Add this to satisfy the foreign key constraint
          });

        if (inventoryError) throw inventoryError;
      }

      return { batch, details };
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
