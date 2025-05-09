
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchFormData, BatchData, ProcessedBatch, StockInBatchSubmission } from '@/types/batchStockIn';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useBatchStockIn = (userId: string) => {
  const [batches, setBatches] = useState<ProcessedBatch[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const addBatch = (formData: BatchFormData) => {
    if (!formData.product || !formData.warehouse || !formData.location) {
      toast({
        title: 'Missing data',
        description: 'Please complete all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Generate barcodes for each box in the batch
    const barcodes: string[] = [];
    for (let i = 0; i < formData.boxes_count; i++) {
      const productSku = formData.product.sku || formData.product.name.substring(0, 6).toUpperCase().replace(/\s+/g, '');
      const category = formData.product.category || 'MISC';
      const boxNumber = i + 1;
      // Use the improved barcode generation function
      const barcode = generateBarcodeString(category, productSku, boxNumber);
      barcodes.push(barcode);
    }

    const newBatch: ProcessedBatch = {
      product_id: formData.product.id,
      warehouse_id: formData.warehouse.id,
      location_id: formData.location.id,
      boxes_count: formData.boxes_count,
      quantity_per_box: formData.quantity_per_box,
      color: formData.color || undefined,
      size: formData.size || undefined,
      created_by: userId,
      // Include joined data for display purposes
      product: formData.product,
      warehouse: formData.warehouse,
      warehouseLocation: formData.location,
      barcodes: barcodes
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

    toast({
      title: editingIndex !== null ? 'Batch updated' : 'Batch added',
      description: `${formData.boxes_count} boxes of ${formData.product.name} added to batch`,
    });
  };

  const editBatch = (index: number) => {
    setEditingIndex(index);
    // Return the batch data for pre-filling the form
    return batches[index];
  };

  const deleteBatch = (index: number) => {
    const updatedBatches = batches.filter((_, i) => i !== index);
    setBatches(updatedBatches);
    toast({
      title: 'Batch removed',
      description: 'The batch has been removed from the list',
    });
  };

  const submitStockInMutation = useMutation({
    mutationFn: async (data: StockInBatchSubmission) => {
      setIsProcessing(true);
      try {
        const operationId = uuidv4().substring(0, 8); // For tracing this operation
        console.log(`[${operationId}] Starting batch stock-in submission`);
        
        // Start transaction
        const { data: stockInData, error: stockInError } = await supabase
          .from('stock_in')
          .insert({
            product_id: data.productId,
            submitted_by: data.submittedBy,
            boxes: data.batches.reduce((sum, batch) => sum + batch.boxes_count, 0),
            status: 'processing',
            source: data.source,
            notes: data.notes,
            processed_by: data.submittedBy // Since we're using the batch system, the processor is the same as submitter
          })
          .select('id')
          .single();

        if (stockInError) {
          console.error(`[${operationId}] Error creating stock-in:`, stockInError);
          throw stockInError;
        }
        
        if (!stockInData || !stockInData.id) {
          console.error(`[${operationId}] Failed to create stock-in record`);
          throw new Error('Failed to create stock-in record');
        }
        
        const stockInId = stockInData.id;
        console.log(`[${operationId}] Created stock-in record: ${stockInId}`);
        
        // Process batches in parallel for better performance
        const batchResults = await Promise.all(data.batches.map(async (batch) => {
          try {
            // Insert batch record
            const { data: batchData, error: batchError } = await supabase
              .from('stock_in_batches' as any)
              .insert({
                stock_in_id: stockInId,
                product_id: batch.product_id,
                warehouse_id: batch.warehouse_id,
                location_id: batch.location_id,
                boxes_count: batch.boxes_count,
                quantity_per_box: batch.quantity_per_box,
                color: batch.color,
                size: batch.size,
                created_by: data.submittedBy
              } as any)
              .select('id')
              .single();
              
            if (batchError) {
              console.error(`[${operationId}] Error creating batch:`, batchError);
              throw batchError;
            }
            
            if (!batchData) {
              throw new Error('Failed to create batch record');
            }
            
            const batchId = (batchData as unknown as { id: string }).id;
            
            // Prepare arrays for batch inserts
            const detailsToInsert = [];
            const inventoryToInsert = [];
            const barcodeLogsToInsert = [];
            
            // Create entries for each box
            for (let i = 0; i < batch.boxes_count; i++) {
              const barcode = batch.barcodes ? batch.barcodes[i] : uuidv4();
              
              // Stock in detail
              detailsToInsert.push({
                stock_in_id: stockInId,
                batch_id: batchId,
                barcode: barcode,
                quantity: batch.quantity_per_box,
                warehouse_id: batch.warehouse_id,
                location_id: batch.location_id,
                color: batch.color,
                size: batch.size,
                created_by: data.submittedBy
              });
              
              // Inventory entry
              inventoryToInsert.push({
                product_id: batch.product_id,
                warehouse_id: batch.warehouse_id,
                location_id: batch.location_id,
                barcode: barcode,
                quantity: batch.quantity_per_box,
                color: batch.color,
                size: batch.size,
                status: 'available'
              });
              
              // Barcode log
              barcodeLogsToInsert.push({
                barcode: barcode,
                action: 'stock_in',
                user_id: data.submittedBy,
                batch_id: batchId,
                details: {
                  stock_in_id: stockInId,
                  product_id: batch.product_id,
                  quantity: batch.quantity_per_box
                }
              });
            }
            
            // Batch insert stock in details
            if (detailsToInsert.length > 0) {
              const { error: detailsError } = await supabase
                .from('stock_in_details')
                .insert(detailsToInsert);
                
              if (detailsError) {
                console.error(`[${operationId}] Error inserting details:`, detailsError);
                throw detailsError;
              }
            }
            
            // Batch insert inventory entries
            if (inventoryToInsert.length > 0) {
              const { error: inventoryError } = await supabase
                .from('inventory')
                .insert(inventoryToInsert);
                
              if (inventoryError) {
                console.error(`[${operationId}] Error inserting inventory:`, inventoryError);
                throw inventoryError;
              }
            }
            
            // Batch insert barcode logs
            if (barcodeLogsToInsert.length > 0) {
              await supabase
                .from('barcode_logs')
                .insert(barcodeLogsToInsert);
              // Non-critical, so don't check for errors
            }
            
            return { success: true, batchId };
          } catch (error) {
            console.error(`[${operationId}] Batch processing failed:`, error);
            return { success: false, error };
          }
        }));
        
        // Check if all batches were processed successfully
        const failedBatches = batchResults.filter(result => !result.success).length;
        if (failedBatches > 0) {
          console.warn(`[${operationId}] ${failedBatches} batches failed to process`);
        }
        
        // Update stock_in status to completed
        const { error: updateError } = await supabase
          .from('stock_in')
          .update({ status: 'completed' })
          .eq('id', stockInId);
          
        if (updateError) {
          console.error(`[${operationId}] Error updating stock_in status:`, updateError);
          throw updateError;
        }
        
        // Create a notification for admins
        let productName = 'Unknown Product';
        if (batches.length > 0 && batches[0].product) {
          productName = batches[0].product.name;
        }
        
        await supabase
          .from('notifications')
          .insert({
            user_id: data.submittedBy,
            role: 'admin',
            action_type: 'stock_in_batch_created',
            metadata: {
              stock_in_id: stockInId,
              batches_count: data.batches.length,
              total_boxes: data.batches.reduce((sum, batch) => sum + batch.boxes_count, 0),
              product_name: productName,
              operation_id: operationId
            }
          });
          
        console.log(`[${operationId}] Stock in process completed successfully`);
        
        // Invalidate related queries to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
        queryClient.invalidateQueries({ queryKey: ['stock-in'] });
        
        return { stockInId };
      } catch (error) {
        console.error('Stock in submission failed:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Stock-in processed successfully',
        description: `${batches.length} batches have been successfully processed and added to inventory`,
      });
      // Reset state
      setBatches([]);
      setEditingIndex(null);
    },
    onError: (error) => {
      toast({
        title: 'Error processing stock-in',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  });

  return {
    batches,
    addBatch,
    editBatch,
    deleteBatch,
    editingIndex,
    setEditingIndex,
    submitStockIn: submitStockInMutation.mutate,
    isSubmitting: submitStockInMutation.isPending,
    isProcessing
  };
};
