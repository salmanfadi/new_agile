
import { useState, useCallback } from 'react';
import { BoxData } from './useStockInBoxes';
import { processStockIn } from '@/utils/stockInProcessor';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface BatchType {
  boxes_count: number;
  product_id: string;
  location_id?: string;
  warehouse_id?: string;
  color?: string;
  size?: string;
  barcode?: string;
}

export const useBatchStockIn = (userId: string = '') => {
  const queryClient = useQueryClient();
  const [batches, setBatches] = useState<BatchType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [barcodeErrors, setBarcodeErrors] = useState<any[]>([]);

  const resetBatches = useCallback(() => {
    setBatches([]);
    setEditingIndex(null);
    setError(null);
    setSuccess(false);
    setIsSuccess(false);
    setBarcodeErrors([]);
    setIsSubmitting(false);
    setIsProcessing(false);
  }, []);

  const addBatch = useCallback((batchData: BatchType) => {
    if (editingIndex !== null) {
      // Update existing batch
      const updatedBatches = [...batches];
      updatedBatches[editingIndex] = batchData;
      setBatches(updatedBatches);
      setEditingIndex(null);
    } else {
      // Add new batch
      setBatches(prevBatches => [...prevBatches, batchData]);
    }
  }, [batches, editingIndex]);

  const editBatch = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const deleteBatch = useCallback((index: number) => {
    setBatches(prevBatches => prevBatches.filter((_, i) => i !== index));
  }, []);

  const submitStockIn = useCallback(async ({
    stockInId,
    productId,
    source,
    notes,
    submittedBy,
    batches: batchesToSubmit
  }: {
    stockInId?: string;
    productId: string;
    source: string;
    notes: string;
    submittedBy: string;
    batches: BatchType[];
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Convert batches to BoxData format
      const boxesData: BoxData[] = batchesToSubmit.map(batch => ({
        product_id: batch.product_id,
        quantity: batch.boxes_count,
        warehouse_id: batch.warehouse_id,
        location_id: batch.location_id,
        color: batch.color,
        size: batch.size,
        barcode: batch.barcode
      }));
      
      const result = await processStockIn(stockInId || '', boxesData, submittedBy);
      
      if (result.success) {
        // Invalidate related queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
        queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
        
        setSuccess(true);
        setIsSuccess(true);
        
        if (result.barcodeErrors && result.barcodeErrors.length > 0) {
          setBarcodeErrors(result.barcodeErrors);
          toast({
            title: "Processing Completed with Warnings",
            description: `Some barcodes had issues. Check the warnings for details.`,
            variant: "warning",
          });
        } else {
          toast({
            title: "Success!",
            description: `Stock-in request successfully processed into inventory.`,
          });
        }
        
        return result;
      } else {
        setError("Unknown error occurred while processing");
        return null;
      }
    } catch (err) {
      console.error("Error processing stock in:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: errorMsg,
      });
      
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient]);
  
  const processBatch = useCallback(async (stockInId: string, boxes: BoxData[], userId?: string) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await processStockIn(stockInId, boxes, userId);
      
      if (result.success) {
        // Invalidate related queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
        queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
        
        setSuccess(true);
        toast({
          title: "Success!",
          description: `Stock-in request successfully processed into inventory.`,
        });
        
        return result;
      } else {
        setError("Unknown error occurred while processing");
        return null;
      }
    } catch (err) {
      console.error("Error processing stock in:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: errorMsg,
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [queryClient]);

  return {
    batches,
    addBatch,
    editBatch,
    deleteBatch,
    editingIndex,
    setEditingIndex,
    submitStockIn,
    isSubmitting,
    processBatch,
    isProcessing,
    error,
    success,
    isSuccess,
    barcodeErrors,
    resetBatches
  };
};

export default useBatchStockIn;
