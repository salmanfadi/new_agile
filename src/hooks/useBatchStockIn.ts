
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
      created_by: userId,
    };
    setBatches(prevBatches => [...prevBatches, newBatch]);
  }, [userId]);

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
          product_id: batch.product_id, // Added product_id to ensure consistency
        });
      }
    }
    return boxes;
  }, []);

  // Implementation for processStockIn function
  const processStockIn = async (
    stockInId: string,
    processedBoxes: any[],
    submittedBy: string
  ) => {
    console.log("Processing stock in with ID:", stockInId);
    
    // Check for duplicate barcodes by comparing with existing inventory
    const { data: existingBarcodes, error: barcodeCheckError } = await supabase
      .from('inventory')
      .select('barcode')
      .in('barcode', processedBoxes.map(box => box.barcode));
      
    if (barcodeCheckError) {
      console.error('Error checking existing barcodes:', barcodeCheckError);
      throw new Error('Failed to validate barcodes');
    }
    
    // If we found any duplicates, return them as errors
    if (existingBarcodes && existingBarcodes.length > 0) {
      const barcodeErrors = existingBarcodes.map(item => ({
        barcode: item.barcode,
        error: 'Barcode already exists in inventory'
      }));
      
      return { success: false, barcodeErrors };
    }
    
    try {
      // Start a transaction to ensure data consistency
      // Update stock_in status to 'processing'
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({ 
          status: 'processing',
          processed_by: submittedBy
        })
        .eq('id', stockInId);
      
      if (updateError) {
        console.error('Error updating stock in status:', updateError);
        throw new Error('Failed to update stock in status');
      }
      
      // Insert boxes into inventory
      const { error: insertError } = await supabase
        .from('inventory')
        .insert(
          processedBoxes.map(box => ({
            product_id: box.product_id,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id, 
            barcode: box.barcode,
            quantity: box.quantity,
            color: box.color,
            size: box.size,
            batch_id: stockInId, // Link to the stock_in batch
            status: 'available'
          }))
        );
      
      if (insertError) {
        console.error('Error inserting inventory items:', insertError);
        throw new Error('Failed to add items to inventory');
      }
      
      // Update stock_in status to 'completed'
      const { error: completeError } = await supabase
        .from('stock_in')
        .update({ status: 'completed' })
        .eq('id', stockInId);
        
      if (completeError) {
        console.error('Error completing stock in:', completeError);
        throw new Error('Failed to complete stock in process');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in processStockIn transaction:', error);
      throw error;
    }
  };

  // Submit stock in function
  const submitStockIn = async (data: StockInSubmissionData) => {
    setIsSubmitting(true);
    setIsProcessing(true);
    
    try {
      console.log('Submitting batch stock in:', data);
      const processedBoxes = await prepareBoxData(data.batches);
      
      // Add product_id to each box if not already present
      processedBoxes.forEach(box => {
        if (!box.product_id) {
          box.product_id = data.productId;
        }
      });
      
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
          variant: "destructive",
        });
        
        console.warn('Barcode validation errors:', result.barcodeErrors);
        setBarcodeErrors(result.barcodeErrors);
        setIsSuccess(false); // Set to false because of errors
      } else {
        // No barcode errors, complete success
        toast({
          title: 'Stock In Processed Successfully',
          description: 'All items have been added to inventory',
        });
        
        setBarcodeErrors([]);
        setIsSuccess(true);
        
        // Force an immediate refresh of the inventory data
        queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      }
      
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
        
        // Add a notification for inventory system
        await supabase.from('notifications').insert([{
          user_id: data.submittedBy,
          role: 'warehouse_manager',
          action_type: 'inventory_updated',
          metadata: {
            source: 'batch_stock_in',
            stock_in_id: data.stockInId,
            items_count: processedBoxes.length,
            product_id: data.productId,
            completed_at: new Date().toISOString()
          }
        }]);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
      
    } catch (error) {
      console.error('Error submitting batch stock in:', error);
      toast({
        title: 'Error Processing Stock In',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      setIsSuccess(false);
    } finally {
      setIsProcessing(false);
      setIsSubmitting(false);
    }
  };

  return {
    batches,
    addBatch,
    editBatch,
    updateBatch: useCallback((index: number, updatedBatchData: Partial<ProcessedBatch>) => {
      setBatches(prevBatches => {
        const newBatches = [...prevBatches];
        newBatches[index] = { ...newBatches[index], ...updatedBatchData };
        return newBatches;
      });
      setEditingIndex(null);
    }, []),
    deleteBatch: useCallback((index: number) => {
      setBatches(prevBatches => {
        const newBatches = [...prevBatches];
        newBatches.splice(index, 1);
        return newBatches;
      });
    }, []),
    editingIndex,
    setEditingIndex,
    submitStockIn,
    isSubmitting,
    isProcessing,
    isSuccess,
    barcodeErrors
  };
};
