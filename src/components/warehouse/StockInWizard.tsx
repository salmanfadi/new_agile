
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StockInWizardProps {
  stockInId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface BatchData {
  id: string;
  batch_number: string;
  product_name: string;
  warehouse_name: string;
  location_name: string;
  total_boxes: number;
  total_quantity: number;
  status: string;
}

const StockInWizard: React.FC<StockInWizardProps> = ({
  stockInId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    'Review Batches',
    'Process Items',
    'Finalize'
  ];

  useEffect(() => {
    fetchBatches();
  }, [stockInId]);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const { data: batchData, error } = await supabase
        .from('processed_batches')
        .select(`
          *,
          product:products(name)
        `)
        .eq('stock_in_id', stockInId);

      if (error) throw error;

      // Get warehouse and location data separately to avoid query conflicts
      const enrichedBatches = await Promise.all(
        (batchData || []).map(async (batch) => {
          // Get warehouse data
          const { data: warehouse } = await supabase
            .from('warehouses')
            .select('name')
            .eq('id', batch.warehouse_id)
            .single();

          // Get location data
          const { data: location } = await supabase
            .from('warehouse_locations')
            .select('zone, floor')
            .eq('id', batch.location_id)
            .single();

          return {
            ...batch,
            product_name: batch.product?.name || 'Unknown Product',
            warehouse_name: warehouse?.name || 'Unknown Warehouse',
            location_name: location ? `Floor ${location.floor} - Zone ${location.zone}` : 'Unknown Location'
          };
        })
      );

      setBatches(enrichedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch batch data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsProcessing(true);
      
      // Update stock in status to completed
      const { error } = await supabase
        .from('stock_in')
        .update({ 
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', stockInId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Stock in process completed successfully',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing stock in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete stock in process',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${index <= currentStep 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${index <= currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`ml-4 w-8 h-px ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Review the batches to be processed:</p>
              {batches.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No batches found</p>
              ) : (
                <div className="space-y-3">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{batch.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch #{batch.batch_number} • {batch.warehouse_name} • {batch.location_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{batch.total_boxes} boxes</p>
                        <Badge variant="outline">{batch.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Processing inventory items...</p>
              <div className="space-y-2">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 border rounded-md">
                    <span>{batch.product_name} - {batch.total_boxes} boxes</span>
                    <Badge className="bg-green-500">Processed</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Ready to finalize the stock in process.</p>
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Summary:</h4>
                <ul className="space-y-1 text-sm">
                  <li>Total Batches: {batches.length}</li>
                  <li>Total Boxes: {batches.reduce((sum, batch) => sum + batch.total_boxes, 0)}</li>
                  <li>Total Items: {batches.reduce((sum, batch) => sum + batch.total_quantity, 0)}</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext}
              disabled={isProcessing}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={isProcessing}
            >
              {isProcessing ? 'Completing...' : 'Complete Process'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockInWizard;
