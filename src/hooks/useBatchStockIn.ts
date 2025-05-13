
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProcessedBatch, BatchFormData } from '@/types/batchStockIn';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { generateBarcodeString } from '@/utils/barcodeUtils';

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
  const [formSubmitted, setFormSubmitted] = useState(false);

  const addBatch = useCallback((batchData: BatchFormData) => {
    let generatedBarcodes: string[] = [];
    
    // If we have product data with category, generate better barcodes
    if (batchData.product) {
      const category = batchData.product.category || 'PROD';
      const sku = batchData.product.sku || batchData.product.id.substring(0, 6);
      
      // Generate unique barcodes for each box
      generatedBarcodes = Array.from({ length: batchData.boxes_count }, (_, index) => 
        generateBarcodeString(category, sku, index + 1)
      );
    } else {
      // Fallback to simple UUIDs if no product data available
      generatedBarcodes = Array.from({ length: batchData.boxes_count }, () => uuidv4());
    }
    
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
      barcodes: generatedBarcodes,
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
        // Ensure we have a valid barcode
        const barcode = batch.barcodes?.[i] || uuidv4();
        
        boxes.push({
          barcode,
          quantity: batch.quantity_per_box,
          color: batch.color || null,
          size: batch.size || null,
          warehouse_id: batch.warehouse_id,
          location_id: batch.location_id,
          product_id: batch.product_id, 
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
    console.log("Processed boxes:", processedBoxes);

    try {
      // Check for empty barcodes and assign new ones
      const validatedBoxes = processedBoxes.map(box => {
        if (!box.barcode || box.barcode.trim() === '') {
          const newBarcode = uuidv4();
          console.log(`Fixing missing barcode with new UUID: ${newBarcode}`);
          return { ...box, barcode: newBarcode };
        }
        return box;
      });
      
      // Check for duplicate barcodes by comparing with existing inventory
      const { data: existingBarcodes, error: barcodeCheckError } = await supabase
        .from('inventory')
        .select('barcode')
        .in('barcode', validatedBoxes.map(box => box.barcode));
        
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
      
      // 1. Insert each box into stock_in_details and collect the returned id
      const stockInDetailsResults = [];
      for (const box of validatedBoxes) {
        // Ensure barcode is always present
        const boxBarcode = box.barcode || uuidv4();
        
        const { data: detailData, error: detailError } = await supabase
          .from('stock_in_details')
          .insert({
            stock_in_id: stockInId,
            quantity: box.quantity,
            barcode: boxBarcode,  // Explicitly pass the barcode
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            color: box.color,
            size: box.size,
            product_id: box.product_id  // Make sure product_id is passed
          })
          .select('id')
          .single();
          
        if (detailError) {
          console.error('Error inserting stock_in_details:', JSON.stringify(detailError, null, 2), 'Box:', box);
          throw new Error('Failed to add stock_in_details');
        }
        stockInDetailsResults.push(detailData.id);
      }

      // 2. Insert into inventory using the correct stock_in_detail_id for each box
      const inventoryInsertPayload = validatedBoxes.map((box, idx) => {
        // Create base payload with required fields
        const payload = {
          barcode: box.barcode,
          product_id: box.product_id,
          warehouse_id: box.warehouse_id,
          location_id: box.location_id,
          quantity: box.quantity,
          status: 'completed',
          // Add optional fields with null checks
          ...(stockInId && { stock_in_id: stockInId }),
          ...(stockInDetailsResults?.[idx] && { stock_in_detail_id: stockInDetailsResults[idx] }),
          ...(box.color && { color: box.color }),
          ...(box.size && { size: box.size })
        };
        
        return payload;
      });
      
      // Define the inventory item type
      type InventoryItem = {
        id: string;
        barcode: string;
        product_id: string;
        [key: string]: unknown;
      };
      
      // Insert inventory items one by one to handle errors individually
      const inventoryInsertResults: InventoryItem[] = [];
      
      for (const item of inventoryInsertPayload) {
        try {
          const { data, error } = await supabase
            .from('inventory')
            .insert(item)
            .select()
            .single();
            
          if (error) throw error;
          if (data) inventoryInsertResults.push(data);
        } catch (error) {
          console.error('Error inserting inventory item:', error, 'Item:', item);
          // Continue with other items even if one fails
          continue;
        }
      }
      
      if (inventoryInsertResults.length === 0) {
        throw new Error('Failed to add any items to inventory');
      }
      
      console.log('Successfully inserted inventory items:', inventoryInsertResults);
      
      // Process barcode logs for inserted items
      if (inventoryInsertResults.length > 0) {
        // Insert barcode logs for each barcode
        const barcodeLogRows = inventoryInsertResults.map((inv, idx) => {
          // Get the corresponding box data
          const box = validatedBoxes[idx];
          const logEntry = {
            barcode: String(inv.barcode),
            action: 'stock_in' as const,
            user_id: submittedBy,
            batch_id: stockInId,
            details: {
              batch_id: stockInId,
              product_id: String(inv.product_id),
              product_name: box?.product_name || 'Unknown Product',
              warehouse: box?.warehouse_name || 'Unknown Warehouse',
              location: box?.location_name || 'Unknown Location',
              created_by: submittedBy,
              created_at: new Date().toISOString()
            }
          };
          return logEntry;
        });

        try {
          const { error: logError } = await supabase
            .from('barcode_logs')
            .insert(barcodeLogRows);

          if (logError) {
            console.error('Error logging barcode actions:', logError);
            // Don't fail the whole operation if logging fails
          }
        } catch (logError) {
          console.error('Exception while logging barcode actions:', logError);
        }
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
      
      // Invalidate stock-in-requests query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      
      // Setup a subscription to real-time updates for immediate UI refresh
      const stockInChannel = supabase
        .channel('stock-in-updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'stock_in',
          filter: `id=eq.${stockInId}`
        }, () => {
          console.log('Received real-time update for stock-in');
          queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
        })
        .subscribe();
        
      // Clean up subscription after 3 seconds
      setTimeout(() => {
        supabase.removeChannel(stockInChannel);
      }, 3000);
      
      return { success: true };
    } catch (error) {
      // If anything fails, try to revert the stock_in status to 'pending'
      await supabase
        .from('stock_in')
        .update({ 
          status: 'pending',
          processed_by: null
        })
        .eq('id', stockInId);
        
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
        // Ensure barcode is always present
        if (!box.barcode || box.barcode.trim() === '') {
          box.barcode = uuidv4();
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
      }
      
      // Create a detailed barcode log entry
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
          processed_boxes: processedBoxes.map(box => ({
            barcode: box.barcode,
            product_id: box.product_id,
            quantity: box.quantity
          })),
          completed_at: new Date().toISOString()
        }
      }]);
      
      // Add detailed notification for inventory system
      await supabase.from('notifications').insert([{
        user_id: data.submittedBy,
        role: 'warehouse_manager',
        action_type: 'inventory_updated',
        metadata: {
          source: 'batch_stock_in',
          stock_in_id: data.stockInId,
          items_count: processedBoxes.length,
          product_id: data.productId,
          product_name: data.batches?.[0]?.product?.name || 'Unknown Product',
          completed_at: new Date().toISOString()
        }
      }]);
      
      // Force an immediate refresh of related data
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      
      // Set up a realtime subscription for stock_in table updates
      const stockInChannel = supabase
        .channel('stock_in_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'stock_in'
        }, () => {
          console.log('Real-time update received for stock-in table');
          queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
        })
        .subscribe();
        
      // Remove channel after 5 seconds to avoid memory leaks
      setTimeout(() => {
        supabase.removeChannel(stockInChannel);
      }, 5000);
      
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

  const resetBatches = () => {
    setBatches([]);
    setEditingIndex(null);
    setIsSuccess(false);
    setFormSubmitted(false);
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
    barcodeErrors,
    resetBatches,
  };
};
