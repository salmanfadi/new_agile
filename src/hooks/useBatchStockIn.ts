import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BatchData, StockInBatchSubmission } from '@/types/batchStockIn';
import { v4 as uuidv4 } from 'uuid';
import { createInventoryMovement } from './useInventoryMovements';

// Define the BoxData interface used for processing
export interface BoxData {
  id: string;
  product_id: string;
  quantity: number;
  warehouse_id: string;
  location_id: string;
  color: string;
  size: string;
  barcode: string;
}

// Define the BatchType interface that is exported for components to use
export interface BatchType {
  id?: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  boxes_count: number;
  quantity_per_box: number; // Required
  color?: string;
  size?: string;
  created_by: string; // Required
  barcodes?: string[];
}

export const useBatchStockIn = (userId: string = '') => {
  const [batches, setBatches] = useState<BatchType[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [barcodeErrors, setBarcodeErrors] = useState<any[]>([]);
  const { toast } = useToast();

  // Add a batch to the state
  const addBatch = (batchData: any) => {
    const newBatch: BatchType = {
      id: uuidv4(),
      product_id: batchData.product?.id || '',
      warehouse_id: batchData.warehouse?.id || '',
      location_id: batchData.location?.id || '',
      boxes_count: batchData.boxes_count,
      quantity_per_box: batchData.quantity_per_box || 1,
      color: batchData.color,
      size: batchData.size,
      created_by: userId, 
    };

    if (editingIndex !== null) {
      // Update existing batch
      const updatedBatches = [...batches];
      updatedBatches[editingIndex] = newBatch;
      setBatches(updatedBatches);
      setEditingIndex(null);
    } else {
      // Add new batch
      setBatches([...batches, newBatch]);
    }
  };

  // Edit an existing batch
  const editBatch = (index: number) => {
    setEditingIndex(index);
  };

  // Delete a batch
  const deleteBatch = (index: number) => {
    const updatedBatches = batches.filter((_, i) => i !== index);
    setBatches(updatedBatches);
  };

  // Reset batches state
  const resetBatches = () => {
    setBatches([]);
    setEditingIndex(null);
    setIsProcessing(false);
    setIsSubmitting(false);
    setIsSuccess(false);
    setBarcodeErrors([]);
  };

  // Process batches into boxes
  const processBatch = async (stockInId: string, boxes: BoxData[], userId?: string) => {
    setIsProcessing(true);
    try {
      // Create processed batch record
      const { data: batchData, error: batchError } = await supabase
        .from('processed_batches')
        .insert({
          stock_in_id: stockInId,
          processed_by: userId || '',
          status: 'completed',
          source: 'batch processing',
          total_boxes: boxes.length,
          total_quantity: boxes.reduce((sum, box) => sum + box.quantity, 0),
          processed_at: new Date().toISOString(),
          product_id: boxes[0].product_id,
        })
        .select()
        .single();

      if (batchError) throw batchError;
      
      const processed_batch_id = batchData.id;
      const barcodeErrors: any[] = [];
      
      // Process each box as a batch item
      for (const box of boxes) {
        const { error } = await supabase
          .from('batch_items')
          .insert({
            batch_id: processed_batch_id,
            barcode: box.barcode,
            quantity: box.quantity,
            color: box.color,
            size: box.size,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            status: 'available'
          });
          
        if (error) {
          console.error('Error creating batch item:', error);
          barcodeErrors.push({
            barcode: box.barcode,
            error: error.message
          });
        }
        
        // Create inventory entry
        const { error: inventoryError, data: inventoryData } = await supabase
          .from('inventory')
          .insert({
            product_id: box.product_id,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            quantity: box.quantity,
            barcode: box.barcode,
            color: box.color,
            size: box.size,
            batch_id: processed_batch_id,
            status: 'available'
          })
          .select()
          .single();
          
        if (inventoryError) {
          console.error('Error creating inventory entry:', inventoryError);
          barcodeErrors.push({
            barcode: box.barcode,
            error: inventoryError.message
          });
        } else if (inventoryData) {
          // Create inventory movement record
          await createInventoryMovement(
            box.product_id,
            box.warehouse_id,
            box.location_id,
            box.quantity,
            'in',
            'approved',
            'stock_in',
            stockInId,
            userId || '',
            { barcode: box.barcode, batch_id: processed_batch_id }
          );
        }
      }
      
      // Update stock_in status to completed if this was from a stock_in request
      if (stockInId) {
        const { error: updateError } = await supabase
          .from('stock_in')
          .update({ status: 'completed', processed_by: userId })
          .eq('id', stockInId);
          
        if (updateError) {
          console.error('Error updating stock_in status:', updateError);
        }
      }
      
      if (barcodeErrors.length > 0) {
        toast({
          title: 'Batch processed with some errors',
          description: `${barcodeErrors.length} barcodes had errors during processing.`,
          variant: 'default',
        });
        setBarcodeErrors(barcodeErrors);
        return { success: true, processed_batch_id, barcodeErrors };
      }
      
      toast({
        title: 'Batch processed successfully',
        description: `${boxes.length} boxes have been processed and added to inventory.`,
        variant: 'default',
      });
      
      return { success: true, processed_batch_id };
    } catch (error) {
      console.error('Error processing batch:', error);
      
      toast({
        title: 'Error processing batch',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      return { success: false, processed_batch_id: '', barcodeErrors: [] };
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit all batches as a stock in submission
  const submitStockIn = async (submission: StockInBatchSubmission) => {
    setIsSubmitting(true);
    
    try {
      // Convert batches to box format for processing
      const boxes: BoxData[] = [];
      
      for (const batch of submission.batches) {
        for (let i = 0; i < batch.boxes_count; i++) {
          // Generate a unique barcode for each box
          const barcode = `BOX-${batch.product_id.slice(0, 6)}-${Date.now()}-${i}`;
          
          boxes.push({
            id: uuidv4(),
            product_id: batch.product_id,
            quantity: batch.quantity_per_box,
            warehouse_id: batch.warehouse_id,
            location_id: batch.location_id,
            color: batch.color || '',
            size: batch.size || '',
            barcode
          });
        }
      }
      
      const result = await processBatch(submission.stockInId || '', boxes, submission.submittedBy);
      
      if (result.success) {
        setIsSuccess(true);
        setBarcodeErrors(result.barcodeErrors || []);
      }
      
      return result;
    } catch (error) {
      console.error('Error submitting stock in:', error);
      
      toast({
        title: 'Error submitting batch',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    batches,
    addBatch,
    editBatch,
    deleteBatch,
    editingIndex,
    setEditingIndex,
    submitStockIn,
    isSubmitting,
    isProcessing,
    isSuccess,
    barcodeErrors,
    resetBatches,
    processBatch,
  };
};
