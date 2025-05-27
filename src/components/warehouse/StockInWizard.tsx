// StockInWizard2.tsx - handles both Edge Function and local processing
import React, { FC, useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as generateUUID } from 'uuid';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

// Import step components
import StockInStepReview from './StockInStepReview';
import StockInStepBatches from './StockInStepBatches';
import StockInStepFinalize from './StockInStepFinalize';

// Import Supabase client
import { supabase } from '../../lib/supabase';

// Get Supabase URL from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Define types
// Use type from imported StockInRequestData if available
interface StockIn {
  id: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  boxes: number;
  submitter: {
    name: string;
    username: string;
    id: string;
  };
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  // Add other properties as needed
}

interface BoxData {
  id: string;
  barcode: string;
  warehouse_id: string;
  warehouse: string; // Adding the warehouse property
  warehouse_name?: string;
  location_id: string;
  location: string; // Adding the location property
  location_name?: string;
  quantity: number;
  color: string;
  size: string;
}

interface BatchData {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  boxCount: number;
  quantityPerBox: number;
  color: string;
  size: string;
  boxes: BoxData[];
  batchBarcode?: string;
  boxBarcodes?: string[];
}

// Helper function to generate UUID if uuid package is not available
const generateUUIDFallback = () => {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

interface StockInWizard2Props {
  stockIn: StockIn;
  userId: string;
  onComplete?: (batchId: string) => void;
  onCancel?: () => void;
}

type StepType = 'review' | 'batches' | 'finalize';

const LOCATION_SEPARATOR = '||';

export interface DefaultValuesType {
  quantity: number;
  color: string;
  size: string;
}

interface ProcessingStatusType {
  inProgress: boolean;
  currentBatch: number;
  totalBatches: number;
  message: string;
}

const StockInWizard: React.FC<StockInWizard2Props> = ({
  stockIn,
  userId,
  onComplete,
  onCancel,
}) => {
  // State initialization
  const [activeStep, setActiveStep] = useState<StepType>('review');
  const [boxesData, setBoxesData] = useState<BoxData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [remainingBoxes, setRemainingBoxes] = useState<number>(stockIn.boxes || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [confirmedBoxes, setConfirmedBoxes] = useState<number>(stockIn.boxes || 0);
  // In-memory cache for barcodes to prevent duplicates during the same session
  const [usedBarcodes] = useState<Set<string>>(new Set());
  const [defaultValues, setDefaultValues] = useState<DefaultValuesType>({
    quantity: 1,
    color: '',
    size: '',
  });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType>({
    inProgress: false,
    currentBatch: 0,
    totalBatches: 0,
    message: '',
  });
  const [runId] = useState(() => generateUUID());
  const [useEdgeFunction, setUseEdgeFunction] = useState(true);
  const [processingMode, setProcessingMode] = useState<'edge' | 'local'>('edge');

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Log the current state to help with debugging
    console.log("Current step:", activeStep);
    console.log("Boxes data:", boxesData);
  }, [activeStep, boxesData]);

  // Memoize the navigation function to prevent unnecessary rerenders
  const navigateToStep = useCallback((step: StepType) => {
    console.log(`Navigating to step: ${step} from ${activeStep}`);
    setActiveStep(step);
  }, [activeStep]);
  
  // Handle warehouse and location selection
  const handleWarehouseLocationChange = useCallback((warehouseId: string, locationId: string) => {
    setWarehouseId(warehouseId);
    setLocationId(locationId);
    
    // Clear existing boxes when location changes
    setBoxesData([]);
  }, []);

  // Simple navigation to next step without initializing boxes
  const proceedToBoxDetails = async (): Promise<void> => {
    try {
      // Just navigate to the batches step without creating boxes upfront
      navigateToStep('batches');
    } catch (error) {
      console.error("Error proceeding to box details:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update an individual box
  const updateBox = useCallback((index: number, field: keyof BoxData, value: string | number): void => {
    const updatedBoxes = [...boxesData];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      [field]: value,
    };
    setBoxesData(updatedBoxes);
  }, [boxesData]);

  // Update box location (warehouse and location)
  const updateBoxLocation = useCallback((index: number, warehouseId: string, locationId: string): void => {
    console.log(`Updating box ${index} location to warehouse: ${warehouseId}, location: ${locationId}`);
    const updatedBoxes = [...boxesData];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      warehouse_id: warehouseId,
      location_id: locationId
    };
    setBoxesData(updatedBoxes);
  }, [boxesData]);

  // Apply default values to all boxes
  const applyToAllBoxes = useCallback((): void => {
    const updatedBoxes = boxesData.map(box => ({
      ...box,
      quantity: defaultValues.quantity,
      color: defaultValues.color,
      size: defaultValues.size,
    }));
    setBoxesData(updatedBoxes);

    toast({
      title: "Applied to All",
      description: "Default values have been applied to all boxes",
    });
  }, [boxesData, defaultValues.quantity, defaultValues.color, defaultValues.size, toast]);

  // Group boxes by warehouse/location to create batches
  const getBoxesByLocation = useCallback((): Record<string, BoxData[]> => {
    const boxesByLocation: Record<string, BoxData[]> = {};

    boxesData.forEach((box) => {
      if (box.warehouse_id && box.location_id) {
        const key = `${box.warehouse_id}${LOCATION_SEPARATOR}${box.location_id}`;
        if (!boxesByLocation[key]) {
          boxesByLocation[key] = [];
        }
        boxesByLocation[key].push(box);
      }
    });

    return boxesByLocation;
  }, [boxesData]);

  // Submit the processed stock in via Edge Function
  const handleSubmit = async (): Promise<void> => {
    if (!stockIn.id || !userId) {
      toast({
        title: "Error",
        description: "Missing stock in information or user ID",
        variant: "destructive",
      });
      return;
    }

    if (batches.length === 0) {
      toast({
        title: "No Batches",
        description: "Please create at least one batch before submitting",
        variant: "destructive",
      });
      return;
    }

    // Validate all batches have required data
    const invalidBatches = batches.filter(batch => 
      !batch.warehouse_id || !batch.location_id || batch.boxCount <= 0 || batch.quantityPerBox <= 0
    );

    if (invalidBatches.length > 0) {
      toast({
        title: "Invalid Data",
        description: `${invalidBatches.length} batches have missing or invalid data`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Try Edge Function first
    if (useEdgeFunction) {
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to process via Edge Function...`);
          setProcessingMode('edge');

          // Authentication is handled automatically by the supabase.functions.invoke method

          // Format payload using the new batch structure
          const payload = {
            run_id: runId,
            stock_in_id: stockIn.id,
            user_id: userId,
            product_id: stockIn.product?.id,
            batches: batches.map((b) => ({
              warehouse_id: b.warehouse_id,
              warehouse_name: b.warehouse_name,
              location_id: b.location_id,
              location_name: b.location_name,
              boxCount: b.boxCount,
              quantityPerBox: b.quantityPerBox,
              color: b.color || '',
              size: b.size || '',
              batchBarcode: b.batchBarcode || undefined, // Only include if available
              boxBarcodes: b.boxBarcodes || undefined,  // Only include if available
            })),
          };

          console.log('Sending payload to Edge Function:', payload);

          // Get user information from the Supabase client
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.error('Error getting user:', userError);
            throw new Error('Failed to get user information');
          }

          // Add the requesting user ID to the payload
          const requestBody = {
            ...payload,
            _requesting_user_id: userData.user?.id
          };
          
          // Authentication is handled automatically by Supabase functions
          console.log('Sending request to Edge Function via Supabase client');
          
          console.log('Sending request to Edge Function with user ID:', userData.user?.id);
          
          // Use the direct Supabase URL for the Edge Function
          const functionUrl = `${supabaseUrl}/functions/v1/process-stock-in`;
          
          let result;
          try {
            // For the Edge Function, we need to use a different approach for auth
            // Instead of directly calling the function URL, use the built-in Supabase Edge Function call
            console.log('Calling Edge Function via Supabase client');
            
            const { data, error: functionError } = await supabase.functions.invoke(
              'stock-in-process',
              {
                body: requestBody
              }
            );
            console.log('Edge Function response data:', data);
            
            if (functionError) {
              console.error('Edge function error:', functionError);
              
              // If it's an auth error, don't retry
              if (functionError.message?.includes('authentication') || 
                  functionError.message?.includes('auth') || 
                  functionError.message?.includes('401') || 
                  functionError.message?.includes('403')) {
                throw new Error(`Authentication failed for Edge Function: ${functionError.message}`);
              }
              
              throw new Error(`Edge Function error: ${functionError.message}`);
            }
            
            // Successfully processed via Edge Function
            console.log('Edge Function response:', data);
            
            // Set the result to the data from the function
            const responseData = data;

            console.log("Edge function response:", responseData);
            result = responseData;
          } catch (error) {
            console.error('Error calling Edge Function:', error);
            throw error;
          }

          if (!result.batch_ids?.length) {
            console.error('Edge function returned no batch IDs:', result);
            throw new Error('No batch IDs returned from edge function');
          }

          // Success! Invalidate queries and notify
          queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
          queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-data'] });

          toast({ 
            title: 'Success', 
            description: 'Stock-In processed successfully via Edge Function' 
          });

          if (onComplete && result.batch_ids?.length) {
            onComplete(result.batch_ids[0]);
          }
          
          setIsSubmitting(false);
          return;
          
        } catch (error) {
          console.warn(`Edge Function attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          // If we have more retries, wait before trying again
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          
          // If we're out of retries, fall back to local processing
          console.warn("Edge Function failed after retries, falling back to local processing:", error);
          setUseEdgeFunction(false);
          setProcessingMode('local');
          toast({
            title: "Notice",
            description: "Using local processing mode after Edge Function failed",
            variant: "default"
          });
          break;
        }
      }
    }

    // Local processing fallback
    try {
      console.log("Starting local stock-in processing...");
      setProcessingMode('local');
      
      console.log(`Processing ${batches.length} batches locally`);
      setProcessingStatus({
        inProgress: true,
        currentBatch: 0,
        totalBatches: batches.length,
        message: 'Initializing local processing...'
      });

      // Update stock in status
      // Only include columns that definitely exist in the schema
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'processing', // Use allowed status value
          updated_at: new Date().toISOString()
          // No other columns, to avoid schema errors
        })
        .eq('id', stockIn.id);
      
      if (updateError) throw updateError;

      let lastBatchId = '';
      let totalProcessedBoxes = 0;

      // Process each batch sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const { warehouse_id, location_id, boxCount, quantityPerBox, color, size, batchBarcode } = batch;
        
        setProcessingStatus({
          inProgress: true,
          currentBatch: batchIndex + 1,
          totalBatches: batches.length,
          message: `Processing batch ${batchIndex + 1}/${batches.length} (${boxCount} boxes)`
        });

        // Generate batch number if not available
        const batch_number = batchBarcode || generateUUID();
        
        // Create processed batch
        const { data: batchData, error: batchError } = await supabase
          .from('processed_batches')
          .insert({
            batch_number: batch_number,
            stock_in_id: stockIn.id,
            processed_by: userId,
            status: 'completed',
            total_boxes: boxCount,
            total_quantity: boxCount * quantityPerBox,
            quantity_processed: boxCount * quantityPerBox,
            product_id: stockIn.product?.id,
            warehouse_id: warehouse_id,
            location_id: location_id,
            processed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (batchError) throw batchError;
        
        const batchId = batchData.id;
        lastBatchId = batchId;
        
        // Create a Set to track used barcodes in memory for this processing session
        const usedBarcodes = new Set<string>();
        
        // Helper function to check if a barcode already exists in the database
        const checkBarcodeExists = async (barcode: string): Promise<boolean> => {
          try {
            // First check our in-memory cache
            if (usedBarcodes.has(barcode)) {
              console.log(`Barcode ${barcode} found in local cache`);
              return true;
            }
            
            // Check inventory table
            const { data: inventoryItems, error: inventoryError } = await supabase
              .from('inventory')
              .select('id, barcode')
              .eq('barcode', barcode);
              
            if (inventoryError) {
              console.error('Error checking inventory for barcode:', inventoryError);
              throw inventoryError;
            }
            
            if (inventoryItems && inventoryItems.length > 0) {
              console.log(`Barcode ${barcode} found in inventory table`);
              usedBarcodes.add(barcode); // Add to cache
              return true;
            }
            
            // Also check stock_in_details table
            const { data: detailsItems, error: detailsError } = await supabase
              .from('stock_in_details')
              .select('id, barcode')
              .eq('barcode', barcode);
              
            if (detailsError) {
              console.error('Error checking stock_in_details for barcode:', detailsError);
              throw detailsError;
            }
            
            if (detailsItems && detailsItems.length > 0) {
              console.log(`Barcode ${barcode} found in stock_in_details table`);
              usedBarcodes.add(barcode); // Add to cache
              return true;
            }
            
            console.log(`Barcode ${barcode} is unique and available`);
            return false;
          } catch (error) {
            console.error('Error checking barcode existence:', error);
            return false; // Default to false on error to allow generation of a new barcode
          }
        };
        
        // Helper function to generate a unique batch barcode base
        // Helper function to generate a unique batch barcode base
        const generateUniqueBatchBarcodeBase = async (): Promise<string> => {
          const maxAttempts = 5;
          
          for (let i = 0; i < maxAttempts; i++) {
            // Generate a unique batch identifier
            const batchUuid = generateUUID();
            const barcodeBase = `${batchUuid}`;
            
            // Check if any barcode with this base already exists in inventory
            const { data: inventoryData, error: invError } = await supabase
              .from('inventory')
              .select('id')
              .like('barcode', `${barcodeBase}-%`)
              .limit(1);
              
            if (invError) {
              console.error('Error checking batch barcode base in inventory:', invError);
              throw invError;
            }
            
            // Also check stock_in_details table
            const { data: detailsData, error: detError } = await supabase
              .from('stock_in_details')
              .select('id')
              .like('barcode', `${barcodeBase}-%`)
              .limit(1);
              
            if (detError) {
              console.error('Error checking batch barcode base in stock_in_details:', detError);
              throw detError;
            }
            
            // If barcode base doesn't exist in either table, it's unique
            if ((!inventoryData || inventoryData.length === 0) && 
                (!detailsData || detailsData.length === 0)) {
              console.log(`Generated unique batch barcode base: ${barcodeBase}`);
              return barcodeBase;
            }
            
            console.log(`Batch barcode base ${barcodeBase} already exists, trying again`);
          }
          
          // If all attempts fail, use timestamp to ensure uniqueness
          const timestamp = Date.now();
          const fallbackBase = `${generateUUID()}-${timestamp}`;
          console.log(`Using fallback batch barcode base: ${fallbackBase}`);
          return fallbackBase;
        };

        // Helper function to generate a unique barcode for a box within a batch
        const generateUniqueBoxBarcode = async (batchBase: string, boxNumber: number): Promise<string> => {
          const boxNumberStr = boxNumber.toString().padStart(3, '0'); // Format as 001, 002, etc.
          const boxBarcode = `${batchBase}-${boxNumberStr}`;
          
          // Check if this specific barcode already exists
          const exists = await checkBarcodeExists(boxBarcode);
          
          if (!exists) {
            console.log(`Generated unique box barcode: ${boxBarcode}`);
            usedBarcodes.add(boxBarcode); // Add to cache
            return boxBarcode;
          }
          
          // If it exists, add a timestamp to make it unique while preserving the batch-box relationship
          const timestamp = Date.now();
          const newBarcode = `${batchBase}-${timestamp}-${boxNumberStr}`;
          
          // Double-check the new barcode
          const newExists = await checkBarcodeExists(newBarcode);
          if (newExists) {
            // Very unlikely, but just in case, add random component
            const random = Math.random().toString(36).substring(2, 8);
            const finalBarcode = `${batchBase}-${timestamp}-${random}-${boxNumberStr}`;
            console.log(`Generated fallback box barcode with random component: ${finalBarcode}`);
            usedBarcodes.add(finalBarcode); // Add to cache
            return finalBarcode;
          }
          
          console.log(`Generated alternative box barcode with timestamp: ${newBarcode}`);
          usedBarcodes.add(newBarcode); // Add to cache
          return newBarcode;
        };
          
        // Generate a unique batch barcode base for all boxes in this batch
        const batchBarcodeBase = await generateUniqueBatchBarcodeBase();
        console.log(`Using batch barcode base ${batchBarcodeBase} for batch ${batchIndex + 1}`);
        
        for (let i = 0; i < batch.boxCount; i++) {
          totalProcessedBoxes++;
          
          // Generate a unique box barcode using the batch base and box number
          const boxNumber = i + 1;
          const boxBarcode = await generateUniqueBoxBarcode(batchBarcodeBase, boxNumber);
          
          console.log(`Processing box ${boxNumber} with barcode ${boxBarcode}`);
          
          try {
            // Create inventory item first
            const { data: inventoryItem, error: inventoryError } = await supabase
              .from('inventory')
              .insert({
                barcode: boxBarcode,
                product_id: stockIn.product?.id,
                warehouse_id: batch.warehouse_id,
                location_id: batch.location_id,
                quantity: batch.quantityPerBox,
                status: 'in_stock',
                color: batch.color || '',
                size: batch.size || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
              
            if (inventoryError) {
              // If it's a unique constraint violation, try with a different barcode
              if (inventoryError.code === '23505') {
                console.warn(`Duplicate barcode detected for ${boxBarcode}. Generating a new one...`);
                
                // Generate a completely unique barcode while preserving batch structure
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 15);
                const newBoxBarcode = `${batchBarcodeBase}-${timestamp}-${random}-${boxNumber}`;
                
                console.log(`Retrying with new barcode: ${newBoxBarcode}`);
                
                // Try again with the new barcode
                const { data: retryItem, error: retryError } = await supabase
                  .from('inventory')
                  .insert({
                    barcode: newBoxBarcode,
                    product_id: stockIn.product?.id,
                    warehouse_id: batch.warehouse_id,
                    location_id: batch.location_id,
                    quantity: batch.quantityPerBox,
                    status: 'in_stock',
                    color: batch.color || '',
                    size: batch.size || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select()
                  .single();
                  
                if (retryError) {
                  console.error('Error retrying inventory insert with new barcode:', retryError);
                  throw retryError;
                }
                
                // Create stock_in_detail with the new barcode
                const { data: retryDetail, error: retryDetailError } = await supabase
                  .from('stock_in_details')
                  .insert({
                    stock_in_id: stockIn.id,
                    product_id: stockIn.product?.id,
                    barcode: newBoxBarcode,
                    quantity: batch.quantityPerBox,
                    color: batch.color || '',
                    size: batch.size || '',
                    status: 'completed', // Using valid enum value: pending, processing, completed, failed
                    batch_number: batch_number, // Use the batch_number from the processed_batches table
                    warehouse_id: batch.warehouse_id,
                    location_id: batch.location_id,
                    processed_at: new Date().toISOString()
                  })
                  .select()
                  .single();
                  
                if (retryDetailError) {
                  console.error('Error creating stock_in_detail with new barcode:', retryDetailError);
                  throw retryDetailError;
                }
                
                console.log(`Successfully processed box ${boxNumber} with regenerated barcode ${newBoxBarcode}`);
              } else {
                console.error(`Error creating inventory item for box ${boxNumber}:`, inventoryError);
                throw inventoryError;
              }
            } else {
              // Create stock_in_detail
              const { data: stockInDetail, error: detailError } = await supabase
                .from('stock_in_details')
                .insert({
                  stock_in_id: stockIn.id,
                  product_id: stockIn.product?.id,
                  barcode: boxBarcode,
                  quantity: batch.quantityPerBox,
                  color: batch.color || '',
                  size: batch.size || '',
                  status: 'completed', // Using valid enum value: pending, processing, completed, failed
                  batch_number: batch_number, // Use the batch_number from the processed_batches table
                  warehouse_id: batch.warehouse_id,
                  location_id: batch.location_id,
                  processed_at: new Date().toISOString()
                })
                .select()
                .single();
              
              if (detailError) {
                console.error(`Error creating stock_in_detail for box ${boxNumber}:`, detailError);
                throw detailError;
              }
              
              console.log(`Successfully processed box ${boxNumber} with barcode ${boxBarcode}`);
            }
          } catch (err) {
            console.error(`Error processing box ${boxNumber}:`, err);
            throw err;
          }
        }
      }
      
      console.log(`Local processing completed: processed ${batches.length} batches with ${totalProcessedBoxes} boxes`);

      // Mark stock_in as completed
      // Only include columns that definitely exist in the schema
      const { error: completeError } = await supabase
        .from('stock_in')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
          // No additional columns to prevent schema errors
        })
        .eq('id', stockIn.id);
      
      if (completeError) throw completeError;

      // Success!
      queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });

      toast({
        title: 'Success',
        description: `Processed ${totalProcessedBoxes} boxes across ${batches.length} batches`
      });

      // Pass the batch info to the onComplete callback if available
      const finalBatchId = batches.length > 0 ? batches[batches.length - 1].id : null;
      if (onComplete && finalBatchId) {
        onComplete(finalBatchId);
      }

      setIsSubmitting(false);
      return;
    } catch (error) {
      console.error('Error processing stock in:', error);
      
      // Better error handling for constraint violations
      let errorMessage = "An unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle PostgreSQL constraint violation errors
        if ('code' in error && error.code === '23505') {
          errorMessage = "Duplicate barcode detected. Please try again with unique barcodes.";
          if ('message' in error) {
            errorMessage += " Details: " + error.message;
          }
        } else if ('message' in error) {
          errorMessage = error.message as string;
        }
      }
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Try to update stock_in to rejected status
      try {
        await supabase
          .from('stock_in')
          .update({ 
            status: 'rejected',
            rejection_reason: error instanceof Error ? error.message : "Processing failed"
          })
          .eq('id', stockIn.id);
      } catch (updateError) {
        console.error("Failed to update status after error:", updateError);
      }
      
    } finally {
      setIsSubmitting(false);
      setProcessingStatus({
        inProgress: false,
        currentBatch: 0,
        totalBatches: 0,
        message: ''
      });
    }
  };

  const handleCancel = useCallback((): void => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/manager/stock-in');
    }
  }, [navigate, onCancel]);

  const renderProcessingStatus = useCallback((): JSX.Element | null => {
    if (!processingStatus.inProgress) return null;
    
    const progress = processingStatus.totalBatches > 0 
      ? Math.round((processingStatus.currentBatch / processingStatus.totalBatches) * 100) 
      : 0;
    
    return (
      <div className="py-4 px-6 bg-blue-50 rounded-lg border border-blue-100 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <h3 className="font-medium text-blue-900">
            Processing {processingStatus.currentBatch} of {processingStatus.totalBatches} batches
          </h3>
        </div>
        
        <div className="w-full bg-blue-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{width: `${progress}%`}}
          />
        </div>
        
        {processingStatus.message && (
          <p className="mt-2 text-sm text-blue-700">{processingStatus.message}</p>
        )}
      </div>
    );
  }, [processingStatus]);

  // When user adds a batch in Step 2
  const handleAddBatch = useCallback((batch: BatchData): void => {
    setBatches((prev) => [...prev, batch]);
    setBoxesData((prev) => [...prev, ...batch.boxes]);
    setRemainingBoxes((prev) => prev - batch.boxes.length);
  }, []);

  // Add function to delete a batch
  const handleDeleteBatch = useCallback((batchIndex: number): void => {
    setBatches(prev => {
      const newBatches = [...prev];
      const deletedBatch = newBatches.splice(batchIndex, 1)[0];
      setRemainingBoxes(prevRemaining => prevRemaining + (deletedBatch?.boxes.length || 0));
      return newBatches;
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Stock In Wizard</h2>
      
      <Tabs value={activeStep} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="review" 
            onClick={() => navigateToStep('review')}
            className="py-3 data-[state=active]:text-primary data-[state=active]:font-medium"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-medium">
                1
              </span>
              <span>Verify Details</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="batches"
            onClick={() => navigateToStep('batches')}
            disabled={activeStep === 'review'}
            className="py-3 data-[state=active]:text-primary data-[state=active]:font-medium"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-medium">
                2
              </span>
              <span>Box Details</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="finalize"
            onClick={() => navigateToStep('finalize')}
            disabled={activeStep === 'review' || batches.length === 0}
            className="py-3 data-[state=active]:text-primary data-[state=active]:font-medium"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-medium">
                3
              </span>
              <span>Preview & Submit</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-6">
          <StockInStepReview
            stockIn={stockIn}
            onContinue={proceedToBoxDetails}
            onCancel={handleCancel}
            warehouseId={warehouseId}
            setWarehouseId={setWarehouseId}
            locationId={locationId}
            setLocationId={setLocationId}
            defaultValues={defaultValues}
            setDefaultValues={setDefaultValues}
            confirmedBoxes={confirmedBoxes}
            setConfirmedBoxes={setConfirmedBoxes}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          <StockInStepBatches
            onBack={() => navigateToStep('review')}
            onContinue={() => navigateToStep('finalize')}
            batches={batches}
            setBatches={setBatches}
            stockIn={stockIn}
            defaultValues={defaultValues}
          />
        </TabsContent>

        <TabsContent value="finalize" className="mt-6">
          <StockInStepFinalize
            batches={batches}
            stockIn={stockIn}
            onSubmit={handleSubmit}
            onBack={() => navigateToStep('batches')}
            isSubmitting={isSubmitting}
            processingStatus={processingStatus}
          />
        </TabsContent>
      </Tabs>
      
      {renderProcessingStatus()}
    </div>
  );
};

export default StockInWizard;