
import React, { useState, useEffect } from 'react';
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

interface StockInWizardProps {
  stockIn: StockInRequestData;
  userId: string;
  onComplete?: (batchId: string) => void;
  onCancel?: () => void;
}

type StepType = 'details' | 'boxes' | 'preview';

const StockInWizard: React.FC<StockInWizardProps> = ({
  stockIn,
  userId,
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  useEffect(() => {
    // Log the current state to help with debugging
    console.log("Current step:", activeStep);
    console.log("Boxes data:", boxesData);
  }, [activeStep, boxesData]);

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
      setActiveStep('boxes');
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
      
      // 1. Update stock_in to processing status
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'processing',
          processed_by: userId,
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);
      
      if (updateError) {
        console.error("Error updating stock_in:", updateError);
        throw updateError;
      }
      
      console.log("Stock-in status updated to processing");
      
      // Group boxes by warehouse/location to create batches
      const boxesByLocation: Record<string, BoxData[]> = {};
      
      boxesData.forEach(box => {
        const key = `${box.warehouse_id}-${box.location_id}`;
        if (!boxesByLocation[key]) {
          boxesByLocation[key] = [];
        }
        boxesByLocation[key].push(box);
      });
      
      console.log("Boxes grouped by location:", boxesByLocation);
      
      let lastBatchId = '';
      
      // Create a batch for each warehouse/location group
      for (const [locationKey, boxes] of Object.entries(boxesByLocation)) {
        const [warehouseId, locationId] = locationKey.split('-');
        
        // 2. Create processed batch for this location
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
        
        // 3. Process each box in this batch
        for (const box of boxes) {
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
          
          console.log("Created stock_in_detail:", detailData);
          
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
          
          console.log("Created batch_item:", batchItemData);
          
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
          
          console.log("Created inventory entry:", inventoryData);
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
      
      console.log("Stock-in processing completed successfully");
      
      toast({
        title: "Success",
        description: `Successfully processed ${boxesData.length} boxes across ${Object.keys(boxesByLocation).length} locations`,
      });
      
      // Notify the parent component about completion
      if (onComplete && lastBatchId) {
        onComplete(lastBatchId);
      } else {
        navigate('/manager/inventory');
      }
      
    } catch (error) {
      console.error('Error processing stock in:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/manager/stock-in');
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <Tabs 
        value={activeStep} 
        onValueChange={(value) => setActiveStep(value as StepType)}
        className="w-full"
      >
        <div className="px-6 pt-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger 
              value="details" 
              className="py-3 data-[state=active]:text-primary data-[state=active]:font-medium"
              disabled={activeStep !== 'details' && boxesData.length === 0}
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
        
        <TabsContent value="details" className="p-6">
          {isLoading ? (
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
          )}
        </TabsContent>
        
        <TabsContent value="boxes" className="p-6">
          <StockInStepBoxes
            boxesData={boxesData}
            updateBox={updateBox}
            updateBoxLocation={updateBoxLocation}
            defaultValues={defaultValues}
            setDefaultValues={setDefaultValues}
            applyToAllBoxes={applyToAllBoxes}
            onBack={() => setActiveStep('details')}
            onContinue={() => setActiveStep('preview')}
          />
        </TabsContent>
        
        <TabsContent value="preview" className="p-6">
          <StockInStepPreview
            stockIn={stockIn}
            boxesData={boxesData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={() => setActiveStep('boxes')}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default StockInWizard;
