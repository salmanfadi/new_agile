
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchFormData, BatchData, ProcessedBatch, StockInBatchSubmission } from '@/types/batchStockIn';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useBatchStockIn = (userId: string) => {
  const [batches, setBatches] = useState<ProcessedBatch[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
      // Use our existing barcode generation function
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
      try {
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

        if (stockInError) throw stockInError;
        if (!stockInData || !stockInData.id) throw new Error('Failed to create stock-in record');
        
        const stockInId = stockInData.id;
        
        // Log stock in creation
        console.log('Created stock-in record:', stockInId);
        
        // Create batches
        const batchPromises = data.batches.map(async (batch) => {
          try {
            console.log('Processing batch with product_id:', batch.product_id);
            
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
              console.error('Error creating batch record:', batchError);
              throw batchError;
            }
            
            // Check if batchData exists and has an id property
            if (!batchData) {
              console.error('No data returned from batch insertion');
              throw new Error('Failed to create batch record');
            }
            
            // Use type assertion after checking that batchData is not null
            const batchId = (batchData as unknown as { id: string }).id;
            
            if (!batchId) {
              console.error('Invalid batch ID returned');
              throw new Error('Invalid batch ID returned');
            }
            
            console.log('Created batch record:', batchId);
            
            // Create inventory and detail records for each box in the batch
            const detailsToInsert = [];
            const inventoryToInsert = [];
            
            for (let i = 0; i < batch.boxes_count; i++) {
              const barcode = batch.barcodes ? batch.barcodes[i] : uuidv4();
              
              // Each box becomes a stock in detail
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
              
              // Each box also becomes an inventory entry
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
            }
            
            // Insert all box details
            console.log('Inserting', detailsToInsert.length, 'stock in details');
            const { error: detailsError } = await supabase
              .from('stock_in_details')
              .insert(detailsToInsert);
              
            if (detailsError) {
              console.error('Error inserting details:', detailsError);
              throw detailsError;
            }
            
            // Insert all inventory entries
            console.log('Inserting', inventoryToInsert.length, 'inventory entries');
            const { error: inventoryError } = await supabase
              .from('inventory')
              .insert(inventoryToInsert);
              
            if (inventoryError) {
              console.error('Error inserting inventory:', inventoryError);
              throw inventoryError;
            }
            
            // Create barcode log entries for tracking
            const barcodeLogEntries = batch.barcodes?.map(barcode => ({
              barcode: barcode,
              action: 'stock_in',
              user_id: data.submittedBy,
              batch_id: batchId,
              details: {
                stock_in_id: stockInId,
                product_id: batch.product_id,
                quantity: batch.quantity_per_box
              }
            })) || [];
            
            if (barcodeLogEntries.length > 0) {
              console.log('Creating barcode log entries:', barcodeLogEntries.length);
              const { error: barcodeLogError } = await supabase
                .from('barcode_logs')
                .insert(barcodeLogEntries);
                
              if (barcodeLogError) {
                console.error('Error creating barcode logs:', barcodeLogError);
                // Non-critical error, don't throw
              }
            }
            
            return batchId;
          } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
          }
        });
        
        try {
          // Wait for all batch insertions to complete
          await Promise.all(batchPromises);
          
          // Update stock_in status to completed
          const { error: updateError } = await supabase
            .from('stock_in')
            .update({ status: 'completed' })
            .eq('id', stockInId);
            
          if (updateError) {
            console.error('Error updating stock_in status:', updateError);
            throw updateError;
          }
          
          console.log('Stock in process completed successfully');
          
          // Create a notification for admins
          // Get the product name from our local state since we have access to it there
          // rather than trying to access it from the BatchData which doesn't have it
          let productName = 'Unknown Product';
          if (batches.length > 0 && batches[0].product) {
            productName = batches[0].product.name;
          }
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: data.submittedBy,
              role: 'admin',
              action_type: 'stock_in_batch_created',
              metadata: {
                stock_in_id: stockInId,
                batches_count: data.batches.length,
                total_boxes: data.batches.reduce((sum, batch) => sum + batch.boxes_count, 0),
                product_name: productName
              }
            });
            
          if (notificationError) {
            console.error('Failed to create notification:', notificationError);
            // Don't throw here, continue with the success flow
          }
          
          return { stockInId };
        } catch (error) {
          console.error('Batch processing failed:', error);
          throw error;
        }
      } catch (error) {
        console.error('Stock in submission failed:', error);
        throw error;
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
    isSubmitting: submitStockInMutation.isPending
  };
};
