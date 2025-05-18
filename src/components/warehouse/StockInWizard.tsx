
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StockInStepDetails from './StockInStepDetails';
import StockInStepBoxes from './StockInStepBoxes';
import StockInStepPreview from './StockInStepPreview';
import { BoxData } from '@/hooks/useStockInBoxes';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface StockInWizard2Props {
  stockIn: StockInRequestData;
  userId: string;
  onComplete?: (batchId: string) => void;
  onCancel?: () => void;
}

type StepType = 'details' | 'boxes' | 'preview';

const StockInWizard: React.FC<StockInWizard2Props> = ({
  stockIn,
  userId,
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<StepType>('details');
  const [boxesData, setBoxesData] = useState<BoxData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [confirmedBoxes, setConfirmedBoxes] = useState<number>(stockIn.boxes || 0);
  const [defaultValues, setDefaultValues] = useState({
    quantity: 1,
    color: '',
    size: '',
  });
  const [processingStatus, setProcessingStatus] = useState<{
    inProgress: boolean;
    currentBatch: number;
    totalBatches: number;
    message: string;
  }>({
    inProgress: false,
    currentBatch: 0,
    totalBatches: 0,
    message: '',
  });

  useEffect(() => {
    // Log the current state to help with debugging
    console.log("Current step:", activeStep);
    console.log("Boxes data:", boxesData);
  }, [activeStep, boxesData]);

  // Memoize the navigation function to prevent unnecessary rerenders
  const navigateToStep = useCallback((step: StepType) => {
    console.log(`Navigating to step: ${step}`);
    setActiveStep(step);
  }, []);

  // Initialize box data when warehouse and location are selected
  const initializeBoxes = async () => {
    if (!warehouseId || !locationId || !stockIn.product?.id) {
      toast({
        title: "Missing Information",
        description: "Please select warehouse and location first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Initializing boxes with warehouse:", warehouseId, "and location:", locationId);
      
      // Generate initial box data with unique barcodes
      const newBoxes: BoxData[] = [];
      
      for (let i = 0; i < confirmedBoxes; i++) {
        const barcode = await generateBarcodeString(
          stockIn.product?.name?.substring(0, 3), 
          stockIn.product?.sku, 
          i + 1
        );
        
        newBoxes.push({
          id: `box-${i}`,
          barcode,
          quantity: defaultValues.quantity,
          color: defaultValues.color,
          size: defaultValues.size,
          warehouse_id: warehouseId,
          location_id: locationId,
          warehouse: warehouseId,
          location: locationId
        });
      }
      
      setBoxesData(newBoxes);
      navigateToStep('boxes');
      console.log("Boxes initialized, moving to boxes step");
    } catch (error) {
      console.error("Error initializing boxes:", error);
      toast({
        title: "Error",
        description: "Failed to initialize boxes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update an individual box
  const updateBox = (index: number, field: keyof BoxData, value: string | number) => {
    const updatedBoxes = [...boxesData];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      [field]: value,
    };
    setBoxesData(updatedBoxes);
  };

  // Update box location (warehouse and location)
  const updateBoxLocation = (index: number, warehouseId: string, locationId: string) => {
    console.log(`Updating box ${index} location to warehouse: ${warehouseId}, location: ${locationId}`);
    const updatedBoxes = [...boxesData];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      warehouse_id: warehouseId,
      location_id: locationId,
      warehouse: warehouseId,
      location: locationId
    };
    setBoxesData(updatedBoxes);
  };

  // Apply default values to all boxes
  const applyToAllBoxes = () => {
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
  };

  // Group boxes by warehouse/location to create batches
  const getBoxesByLocation = () => {
    const boxesByLocation: Record<string, BoxData[]> = {};
    
    boxesData.forEach(box => {
      if (box.warehouse_id && box.location_id) {
        const key = `${box.warehouse_id}-${box.location_id}`;
        if (!boxesByLocation[key]) {
          boxesByLocation[key] = [];
        }
        boxesByLocation[key].push(box);
      }
    });
    
    return boxesByLocation;
  };

  // Submit the processed stock in
  const handleSubmit = async () => {
    if (!stockIn.id || !userId) {
      toast({
        title: "Error",
        description: "Missing stock in information or user ID",
        variant: "destructive",
      });
      return;
    }
    
    if (boxesData.length === 0) {
      toast({
        title: "No Boxes",
        description: "Please add at least one box before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all boxes have required data
    const invalidBoxes = boxesData.filter(box => 
      !box.warehouse_id || !box.location_id || box.quantity <= 0 || !box.barcode
    );
    
    if (invalidBoxes.length > 0) {
      toast({
        title: "Invalid Data",
        description: `${invalidBoxes.length} boxes have missing or invalid data`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting stock in processing...");
      
      // Group boxes by warehouse/location to create batches
      const boxesByLocation = getBoxesByLocation();
      const locationKeys = Object.keys(boxesByLocation);
      
      console.log(`Processing ${locationKeys.length} batches`);
      setProcessingStatus({
        inProgress: true,
        currentBatch: 0,
        totalBatches: locationKeys.length,
        message: 'Initializing processing...'
      });
      
      // 1. Update stock_in to processing status
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({ 
          status: 'processing',
          processed_by: userId,
          processing_started_at: new Date().toISOString()
        })
        .eq('id', stockIn.id);
      
      if (updateError) {
        console.error("Error updating stock_in:", updateError);
        throw updateError;
      }
      
      console.log("Stock-in status updated to processing");
      
      let lastBatchId = '';
      let totalProcessedBoxes = 0;
      
      // Process each batch sequentially
      for (let batchIndex = 0; batchIndex < locationKeys.length; batchIndex++) {
        const locationKey = locationKeys[batchIndex];
        const [warehouseId, locationId] = locationKey.split('-');
        const boxes = boxesByLocation[locationKey];
        
        setProcessingStatus({
          inProgress: true,
          currentBatch: batchIndex + 1,
          totalBatches: locationKeys.length,
          message: `Processing batch ${batchIndex + 1}/${locationKeys.length} (${boxes.length} boxes)`
        });
        
        // Create processed batch for this location
        const { data: batchData, error: batchError } = await supabase
          .from('processed_batches')
          .insert({
            stock_in_id: stockIn.id,
            processed_by: userId,
            status: 'completed',
            source: stockIn.source,
            notes: stockIn.notes,
            total_boxes: boxes.length,
            total_quantity: boxes.reduce((sum, box) => sum + (box.quantity || 0), 0),
            product_id: stockIn.product?.id,
            warehouse_id: warehouseId,
            processed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (batchError) {
          console.error("Error creating processed batch:", batchError);
          throw batchError;
        }
        
        console.log(`Created batch for ${locationKey}:`, batchData);
        const batchId = batchData.id;
        lastBatchId = batchId;
        
        // Process each box in this batch
        for (let boxIndex = 0; boxIndex < boxes.length; boxIndex++) {
          const box = boxes[boxIndex];
          totalProcessedBoxes++;
          
          setProcessingStatus({
            inProgress: true,
            currentBatch: batchIndex + 1,
            totalBatches: locationKeys.length,
            message: `Batch ${batchIndex + 1}/${locationKeys.length}: Processing box ${boxIndex + 1}/${boxes.length}`
          });
          
          console.log(`Processing box with barcode ${box.barcode}`);
          
          // Create stock_in_detail record
          const { data: detailData, error: detailError } = await supabase
            .from('stock_in_details')
            .insert({
              stock_in_id: stockIn.id,
              warehouse_id: box.warehouse_id,
              location_id: box.location_id,
              barcode: box.barcode,
              quantity: box.quantity,
              color: box.color,
              size: box.size,
              product_id: stockIn.product?.id,
              status: 'completed',
            })
            .select()
            .single();
          
          if (detailError) {
            console.error("Error creating stock_in_detail:", detailError);
            throw detailError;
          }
          
          // Create batch_item record
          const { data: batchItemData, error: batchItemError } = await supabase
            .from('batch_items')
            .insert({
              batch_id: batchId,
              barcode: box.barcode,
              quantity: box.quantity,
              color: box.color,
              size: box.size,
              warehouse_id: box.warehouse_id,
              location_id: box.location_id,
              status: 'available'
            })
            .select();
          
          if (batchItemError) {
            console.error("Error creating batch_item:", batchItemError);
            throw batchItemError;
          }
          
          // Create inventory entry
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .insert({
              product_id: stockIn.product?.id || '',
              warehouse_id: box.warehouse_id,
              location_id: box.location_id,
              quantity: box.quantity,
              barcode: box.barcode,
              color: box.color,
              size: box.size,
              batch_id: batchId,
              stock_in_id: stockIn.id,
              stock_in_detail_id: detailData.id,
              status: 'available'
            })
            .select();
          
          if (inventoryError) {
            console.error("Error creating inventory entry:", inventoryError);
            throw inventoryError;
          }
        }
      }
      
      // 4. Update stock_in to completed status
      const { error: finalUpdateError } = await supabase
        .from('stock_in')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);
      
      if (finalUpdateError) {
        console.error("Error finalizing stock_in:", finalUpdateError);
        throw finalUpdateError;
      }
      
      setProcessingStatus({
        inProgress: true,
        currentBatch: locationKeys.length,
        totalBatches: locationKeys.length,
        message: 'Finalizing...'
      });
      
      // Invalidate all relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      
      console.log("Stock-in processing completed successfully");
      
      toast({
        title: "Success",
        description: `Successfully processed ${totalProcessedBoxes} boxes across ${locationKeys.length} locations`,
      });
      
      // Notify the parent component about completion
      if (onComplete && lastBatchId) {
        onComplete(lastBatchId);
      }
      
    } catch (error) {
      console.error('Error processing stock in:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/manager/stock-in');
    }
  };

  const renderProcessingStatus = () => {
    if (!processingStatus.inProgress) return null;
    
    const progress = Math.round((processingStatus.currentBatch / processingStatus.totalBatches) * 100);
    
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
          ></div>
        </div>
        
        <p className="mt-2 text-sm text-blue-700">{processingStatus.message}</p>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <div className="px-6 pt-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger 
            value="details" 
            className="py-3 data-[state=active]:text-primary data-[state=active]:font-medium"
            disabled={activeStep !== 'details' && boxesData.length === 0}
            onClick={() => navigateToStep('details')}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-medium">
                1
              </span>
              <span>Verify Details</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="boxes" 
            className="py-3"
            disabled={activeStep === 'details' || boxesData.length === 0}
            onClick={() => navigateToStep('boxes')}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-medium">
                2
              </span>
              <span>Box Details</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="py-3"
            disabled={activeStep === 'details' || boxesData.length === 0}
            onClick={() => navigateToStep('preview')}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-medium">
                3
              </span>
              <span>Preview & Submit</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="p-6">
        {renderProcessingStatus()}
        
        {activeStep === 'details' && (
          isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p>Initializing boxes...</p>
            </div>
          ) : (
            <StockInStepDetails
              stockIn={stockIn}
              warehouseId={warehouseId}
              setWarehouseId={setWarehouseId}
              locationId={locationId}
              setLocationId={setLocationId}
              confirmedBoxes={confirmedBoxes}
              setConfirmedBoxes={setConfirmedBoxes}
              onContinue={initializeBoxes}
              onCancel={handleCancel}
            />
          )
        )}
        
        {activeStep === 'boxes' && (
          <StockInStepBoxes
            boxesData={boxesData}
            updateBox={updateBox}
            updateBoxLocation={updateBoxLocation}
            defaultValues={defaultValues}
            setDefaultValues={setDefaultValues}
            applyToAllBoxes={applyToAllBoxes}
            onBack={() => navigateToStep('details')}
            onContinue={() => navigateToStep('preview')}
          />
        )}
        
        {activeStep === 'preview' && (
          <StockInStepPreview
            stockIn={stockIn}
            boxesData={boxesData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={() => navigateToStep('boxes')}
          />
        )}
      </div>
    </Card>
  );
};

export default StockInWizard;
