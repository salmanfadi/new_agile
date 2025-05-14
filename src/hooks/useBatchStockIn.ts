
import { useState, useCallback } from 'react';
import { BoxData } from './useStockInBoxes';
import { processStockIn } from '@/utils/stockInProcessor';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export const useBatchStockIn = () => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const processBatch = useCallback(async (stockInId: string, boxes: BoxData[], userId?: string) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Fix: Using the function with the correct number of arguments
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
    processBatch,
    isProcessing,
    error,
    success,
  };
};

export default useBatchStockIn;
