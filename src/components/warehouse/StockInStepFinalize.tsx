import React, { useEffect, useState } from 'react';
import { BatchData } from './StockInStepBatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import BarcodePreview from '@/components/warehouse/BarcodePreview';
import { Loader2, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { generateUniqueBarcode } from '@/utils/barcodeUtils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BoxData } from '@/hooks/useStockInBoxes';

interface StockInStepFinalizeProps {
  batches: BatchData[];
  stockIn: StockInRequestData;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  processingStatus?: {
    inProgress: boolean;
    currentBatch: number;
    totalBatches: number;
    message: string;
  };
}

const StockInStepFinalize: React.FC<StockInStepFinalizeProps> = ({ 
  batches, 
  stockIn, 
  isSubmitting, 
  onSubmit, 
  onBack,
  processingStatus 
}) => {
  // Generate batch barcodes on component mount
  const [processedBatches, setProcessedBatches] = useState<(BatchData & { batchBarcode: string, boxBarcodes: string[] })[]>([]);
  
  useEffect(() => {
    const processBatches = async () => {
      const processed = await Promise.all(batches.map(async (batch) => {
        // Generate a unique batch barcode
        const batchPrefix = stockIn.product?.sku ? 
          stockIn.product.sku.substring(0, 3).toUpperCase() : 'BAT';
        
        // Create a batch ID using UUID
        const batchBarcode = `${batchPrefix}-${uuidv4().substring(0, 8)}`;
        
        // Generate box barcodes for each box in the batch
        const boxBarcodes: string[] = [];
        for (let i = 0; i < batch.boxCount; i++) {
          // Generate box barcode with sequential numbers
          const boxBarcode = `${batchBarcode}-${(i + 1).toString().padStart(3, '0')}`;
          boxBarcodes.push(boxBarcode);
        }
        
        return {
          ...batch,
          batchBarcode,
          boxBarcodes
        };
      }));
      
      setProcessedBatches(processed);
    };
    
    processBatches();
  }, [batches, stockIn]);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preview & Submit</CardTitle>
          <CardDescription>
            Review the batches and box barcodes before finalizing the stock-in process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ready to Submit</AlertTitle>
            <AlertDescription>
              You are about to process {processedBatches.reduce((sum, batch) => sum + batch.boxCount, 0)} boxes across {processedBatches.length} batches.
              Once submitted, this action cannot be undone.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-6">
            {processedBatches.map((batch, idx) => (
              <Card key={idx} className="border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Batch #{idx + 1}
                        <Badge variant="outline" className="ml-2">{batch.batchBarcode}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {batch.boxCount} boxes at {batch.warehouse_name} — {batch.location_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-1 text-sm mb-4">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Warehouse:</span>
                      <span className="font-medium">{batch.warehouse_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{batch.location_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Boxes:</span>
                      <span className="font-medium">{batch.boxCount}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Quantity per Box:</span>
                      <span className="font-medium">{batch.quantityPerBox}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{batch.boxCount * batch.quantityPerBox}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium">{batch.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{batch.size || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Box Barcodes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {batch.boxBarcodes.map((barcode, i) => (
                        <div key={i} className="border rounded-md p-3 text-center space-y-2">
                          <BarcodePreview value={barcode} height={60} width={1.5} displayValue={true} />
                          <div className="text-xs text-muted-foreground">Box {i + 1} of {batch.boxCount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Processing status */}
      {processingStatus && processingStatus.inProgress && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing</AlertTitle>
          <AlertDescription>
            Processing batch {processingStatus.currentBatch} of {processingStatus.totalBatches}.
            {processingStatus.message && <div className="mt-1">{processingStatus.message}</div>}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting || processedBatches.length === 0}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Submit Stock-In
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StockInStepFinalize; 