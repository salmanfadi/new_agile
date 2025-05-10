import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProcessedBatch, BatchFormData } from '@/types/batchStockIn';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface StockInSubmissionData {
  stockInId?: string;
  productId: string;
  source: string;
  notes: string;
  submittedBy: string;
  batches: ProcessedBatch[];
}

export const useBatchStockIn = (userId: string) => {
  const queryClient = useQueryClient();
  const [batches, setBatches] = useState<ProcessedBatch[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [barcodeErrors, setBarcodeErrors] = useState<{ barcode: string; error: string; }[]>([]);

  const addBatch = useCallback((batchData: BatchFormData) => {
    const newBatch: ProcessedBatch = {
      id: uuidv4(),
      product_id: batchData.product?.id || '',
      product: batchData.product || null,
      warehouse_id: batchData.warehouse?.id || '',
      warehouse: batchData.warehouse || null,
      location_id: batchData.location?.id || '',
      warehouseLocation: batchData.location || null,
      boxes_count: batchData.boxes_count,
      quantity_per_box: batchData.quantity_per_box,
      color: batchData.color || '',
      size: batchData.size || '',
      barcodes: Array.from({ length: batchData.boxes_count }, () => uuidv4()),
    };
    setBatches(prevBatches => [...prevBatches, newBatch]);
  }, []);

  const editBatch = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const updateBatch = useCallback((index: number, updatedBatchData: Partial<ProcessedBatch>) => {
    setBatches(prevBatches => {
      const newBatches = [...prevBatches];
      newBatches[index] = { ...newBatches[index], ...updatedBatchData };
      return newBatches;
    });
    setEditingIndex(null);
  }, []);

  const deleteBatch = useCallback((index: number) => {
    setBatches(prevBatches => {
      const newBatches = [...prevBatches];
      newBatches.splice(index, 1);
      return newBatches;
    });
  }, []);

  const prepareBoxData = useCallback(async (batches: ProcessedBatch[]) => {
    const boxes = [];
    for (const batch of batches) {
      for (let i = 0; i < batch.boxes_count; i++) {
        boxes.push({
          barcode: batch.barcodes?.[i] || uuidv4(),
          quantity: batch.quantity_per_box,
          color: batch.color || null,
          size: batch.size || null,
          warehouse_id: batch.warehouse_id,
          location_id: batch.location_id,
        });
      }
    }
    return boxes;
  }, []);

  // Add to the submitStockIn function to handle barcode validation errors
  const submitStockIn = async (data: StockInSubmissionData) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting batch stock in:', data);
      const processedBoxes = await prepareBoxData(data.batches);
      
      // Process the stock-in request
      const result = await processStockIn(
        data.stockInId as string,
        processedBoxes,
        data.submittedBy
      );
      
      // Check for barcode validation errors
      if (result && result.barcodeErrors && result.barcodeErrors.length > 0) {
        // Handle barcode errors - still count as success but warn the user
        toast({
          title: `Stock In Processed with Warnings`,
          description: `${result.barcodeErrors.length} barcode(s) were found to be duplicates and were skipped.`,
          variant: 'warning',
        });
        
        console.warn('Barcode validation errors:', result.barcodeErrors);
        setBarcodeErrors(result.barcodeErrors);
      } else {
        // No barcode errors, complete success
        toast({
          title: 'Stock In Processed Successfully',
          description: 'All items have been added to inventory',
        });
        
        setBarcodeErrors([]);
      }
      
      setIsProcessing(false);
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Create the notification if we have a product ID
      if (data.productId) {
        await supabase.from('barcode_logs').insert([{
          barcode: 'batch-submission',
          action: 'batch_stock_in_completed',
          user_id: data.submittedBy,
          details: {
            stock_in_id: data.stockInId,
            product_id: data.productId,
            batch_count: data.batches.length,
            total_items: processedBoxes.length,
            source: data.source,
            completed_at: new Date().toISOString()
          }
        }]);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
    } catch (error) {
      console.error('Error submitting batch stock in:', error);
      toast({
        title: 'Error Processing Stock In',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      setIsProcessing(false);
      setIsSubmitting(false);
    }
  };

  return {
    batches,
    addBatch,
    editBatch,
    updateBatch,
    deleteBatch,
    editingIndex,
    setEditingIndex,
    submitStockIn,
    isSubmitting,
    isProcessing,
    isSuccess,
    barcodeErrors
  };
};
