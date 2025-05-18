import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StockInStepReview from './StockInStepReview';
import StockInStepBatches, { BatchData } from './StockInStepBatches';
import StockInStepFinalize from './StockInStepFinalize';
import { BoxData } from '@/hooks/useStockInBoxes';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import StockInWizardStep from './StockInWizardStep';

interface StockInWizard2Props {
  stockIn: StockInRequestData;
  userId: string;
  onComplete?: (batchId: string) => void;
  onCancel?: () => void;
}

type StepType = 'review' | 'batches' | 'finalize';

const LOCATION_SEPARATOR = '||';

const StockInWizard: React.FC<StockInWizard2Props> = ({
  stockIn,
  userId,
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<StepType>('review');
  const [boxesData, setBoxesData] = useState<BoxData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [remainingBoxes, setRemainingBoxes] = useState<number>(stockIn.boxes || 0);
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
  const [runId] = useState(() => crypto.randomUUID());
  const [useEdgeFunction, setUseEdgeFunction] = useState(true);
  const [processingMode, setProcessingMode] = useState<'edge' | 'local'>('edge');

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
      
      // Generate barcodes in parallel for faster initialization
      const barcodes = await Promise.all(
        Array.from({ length: confirmedBoxes }, (_, i) =>
          generateBarcodeString(
            stockIn.product?.name?.substring(0, 3),
            stockIn.product?.sku,
            i + 1
          )
        )
      );

      const newBoxes: BoxData[] = barcodes.map((barcode, idx) => ({
        id: `box-${idx}`,
        barcode,
        quantity: defaultValues.quantity,
        color: defaultValues.color,
        size: defaultValues.size,
        warehouse_id: warehouseId,
        location_id: locationId,
        warehouse: warehouseId,
        location: locationId,
      }));

      setBoxesData(newBoxes);
      navigateToStep('batches');
      console.log("Boxes initialized, moving to batches step");
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
  };

  // Submit the processed stock in via Edge Function
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
    
    // Try Edge Function first
    if (useEdgeFunction) {
      try {
        console.log("Attempting Edge Function processing...");
        setProcessingMode('edge');
        
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;

        const payload = {
          run_id: runId,
          stock_in_id: stockIn.id,
          user_id: userId,
          batches: batches.map((b) => ({
            warehouse_id: b.warehouse_id,
            location_id: b.location_id,
            boxes: b.boxes.map((box) => ({
              barcode: box.barcode,
              quantity: box.quantity,
              color: box.color,
              size: box.size,
              product_id: stockIn.product?.id,
            })),
          })),
        };

        const resp = await fetch("/functions/v1/stock_in_process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          throw new Error(await resp.text() || "Edge function returned error");
        }

        const result = await resp.json();
        console.log("Edge function success:", result);

        // Invalidate queries
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
        console.warn("Edge Function failed, falling back to local processing:", error);
        setUseEdgeFunction(false);
        setProcessingMode('local');
        toast({
          title: "Notice",
          description: "Using local processing mode",
          variant: "default"
        });
      }
    }

    // Local processing fallback
    try {
      console.log("Starting local stock-in processing...");
      setProcessingMode('local');

      // Process using original client-side loop
      const boxesByLocation = getBoxesByLocation();
      const locationKeys = Object.keys(boxesByLocation);
      
      console.log(`Processing ${locationKeys.length} batches locally`);
      setProcessingStatus({
        inProgress: true,
        currentBatch: 0,
        totalBatches: locationKeys.length,
        message: 'Initializing local processing...'
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
      
      if (updateError) throw updateError;

      let lastBatchId = '';
      let totalProcessedBoxes = 0;

      // Process each batch sequentially
      for (let batchIndex = 0; batchIndex < locationKeys.length; batchIndex++) {
        const locationKey = locationKeys[batchIndex];
        const [warehouseId, locationId] = locationKey.split(LOCATION_SEPARATOR);
        const boxes = boxesByLocation[locationKey];
        
        setProcessingStatus({
          inProgress: true,
          currentBatch: batchIndex + 1,
          totalBatches: locationKeys.length,
          message: `Processing batch ${batchIndex + 1}/${locationKeys.length} (${boxes.length} boxes)`
        });

        // Create processed batch
        const { data: batchData, error: batchError } = await supabase
          .from('processed_batches')
          .insert({
            stock_in_id: stockIn.id,
            processed_by: userId,
            status: 'completed',
            total_boxes: boxes.length,
            total_quantity: boxes.reduce((sum, box) => sum + (box.quantity || 0), 0),
            product_id: stockIn.product?.id,
            warehouse_id: warehouseId,
            location_id: locationId,
            processed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (batchError) throw batchError;
        
        const batchId = batchData.id;
        lastBatchId = batchId;

        // Process boxes
        for (const box of boxes) {
          totalProcessedBoxes++;
          
          // Create stock_in_detail
          const { error: detailError } = await supabase
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
            });
          
          if (detailError) throw detailError;
          
          // Create batch_item
          const { error: itemError } = await supabase
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
            });
          
          if (itemError) throw itemError;
          
          // Create inventory entry
          const { error: invError } = await supabase
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
              status: 'available'
            });
          
          if (invError) throw invError;
        }
      }

      // Mark stock-in as completed
      const { error: completeError } = await supabase
        .from('stock_in')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);
      
      if (completeError) throw completeError;

      // Success!
      queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });

      toast({
        title: 'Success',
        description: `Processed ${totalProcessedBoxes} boxes across ${locationKeys.length} locations`
      });

      if (onComplete && lastBatchId) {
        onComplete(lastBatchId);
      }

      setIsSubmitting(false);
      return;
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

  // When user adds a batch in Step 2
  const handleAddBatch = (batch: BatchData) => {
    setBatches((prev) => [...prev, batch]);
    setBoxesData((prev) => [...prev, ...batch.boxes]);
    setRemainingBoxes((prev) => prev - batch.boxes.length);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      {/* Processing mode indicator */}
      {isSubmitting && (
        <div className="px-6 pt-4">
          <div className="text-sm text-muted-foreground">
            Processing mode: {processingMode === 'edge' ? 'Edge Function' : 'Local'}
          </div>
        </div>
      )}
      <Tabs
        value={activeStep}
        onValueChange={(val) => navigateToStep(val as StepType)}
        className="w-full flex-1 flex flex-col"
      >
        <div className="px-6 pt-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger 
              value="review" 
              className="py-3 data-[state=active]:text-primary data-[state=active]:font-medium"
              disabled={false}
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
              className="py-3"
              disabled={activeStep === 'review'}
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
              className="py-3"
              disabled={activeStep !== 'finalize'}
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
        
        <div className="p-6 flex-1 overflow-y-auto">
          {renderProcessingStatus()}
          
          {activeStep === 'review' && (
            <StockInStepReview
              stockIn={stockIn}
              onContinue={() => navigateToStep('batches')}
              onCancel={handleCancel}
            />
          )}
          
          {activeStep === 'batches' && (
            <StockInStepBatches
              remainingBoxes={remainingBoxes}
              onAddBatch={handleAddBatch}
              onBack={() => navigateToStep('review')}
              onContinue={() => navigateToStep('finalize')}
              productName={stockIn.product?.name || ''}
              productSku={stockIn.product?.sku}
            />
          )}
          
          {activeStep === 'finalize' && (
            <StockInStepFinalize
              batches={batches}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onBack={() => navigateToStep('batches')}
            />
          )}
        </div>
      </Tabs>
    </Card>
  );
};

export default StockInWizard;
