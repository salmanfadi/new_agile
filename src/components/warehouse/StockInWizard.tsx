
import React, { useState } from 'react';
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
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [confirmedBoxes, setConfirmedBoxes] = useState<number>(stockIn.boxes || 0);
  const [defaultValues, setDefaultValues] = useState({
    quantity: 1,
    color: '',
    size: '',
  });

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
    } catch (error) {
      console.error("Error initializing boxes:", error);
      toast({
        title: "Error",
        description: "Failed to initialize boxes. Please try again.",
        variant: "destructive",
      });
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
      // 1. Update stock_in to processing status
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'processing',
          processed_by: userId,
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);
      
      if (updateError) throw updateError;
      
      // 2. Create processed batch
      const { data: batchData, error: batchError } = await supabase
        .from('processed_batches')
        .insert({
          stock_in_id: stockIn.id,
          processed_by: userId,
          status: 'completed',
          source: stockIn.source,
          notes: stockIn.notes,
          total_boxes: boxesData.length,
          total_quantity: boxesData.reduce((sum, box) => sum + (box.quantity || 0), 0),
          product_id: stockIn.product?.id,
          warehouse_id: warehouseId,
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (batchError) throw batchError;
      
      const batchId = batchData.id;
      
      // 3. Process each box
      for (const box of boxesData) {
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
        
        if (detailError) throw detailError;
        
        // Create batch_item record
        await supabase
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
        
        // Create inventory entry
        await supabase
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
          });
      }
      
      // 4. Update stock_in to completed status
      await supabase
        .from('stock_in')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);
      
      toast({
        title: "Success",
        description: `Successfully processed ${boxesData.length} boxes`,
      });
      
      // Notify the parent component about completion
      if (onComplete) {
        onComplete(batchId);
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
        </TabsContent>
        
        <TabsContent value="boxes" className="p-6">
          <StockInStepBoxes
            boxesData={boxesData}
            updateBox={updateBox}
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
