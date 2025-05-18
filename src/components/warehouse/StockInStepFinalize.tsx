import React from 'react';
import { BatchData } from './StockInStepBatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BarcodePreview from '@/components/warehouse/BarcodePreview';
import { Loader2 } from 'lucide-react';

interface StockInStepFinalizeProps {
  batches: BatchData[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const StockInStepFinalize: React.FC<StockInStepFinalizeProps> = ({ batches, isSubmitting, onSubmit, onBack }) => {
  return (
    <div className="space-y-6">
      {batches.map((batch, idx) => (
        <Card key={idx}>
          <CardHeader className="bg-muted py-3">
            <CardTitle>Batch #{idx + 1}</CardTitle>
            <CardDescription>
              Warehouse {batch.warehouse_id} — Location {batch.location_id}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {batch.boxes.map((box, i) => (
                <div key={i} className="text-center space-y-2">
                  <BarcodePreview value={box.barcode} height={60} width={1} displayValue={false} />
                  <p className="text-xs font-mono break-all">{box.barcode}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting || batches.length === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting
            </>
          ) : (
            'Submit Stock-In'
          )}
        </Button>
      </div>
    </div>
  );
};

export default StockInStepFinalize; 