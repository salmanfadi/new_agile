
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { ProcessedBatch } from '@/types/batchStockIn';

interface BatchListProps {
  batches: ProcessedBatch[];
  editBatch: (index: number) => void;
  deleteBatch: (index: number) => void;
  handleBatchSubmission: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isProcessing: boolean;
  formSubmitted: boolean;
}

export const BatchList: React.FC<BatchListProps> = ({
  batches,
  editBatch,
  deleteBatch,
  handleBatchSubmission,
  isSubmitting,
  isProcessing,
  formSubmitted
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Batches ({batches.length})</h3>
      
      {batches.length === 0 ? (
        <Card className="apple-shadow-sm">
          <CardContent className="p-6 text-center text-muted-foreground">
            No batches added yet. Use the form to add batches.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
          {batches.map((batch, index) => (
            <BatchCard 
              key={index}
              batch={batch}
              index={index}
              onEdit={() => !isSubmitting && !isProcessing && !formSubmitted && editBatch(index)} 
              onDelete={() => !isSubmitting && !isProcessing && !formSubmitted && deleteBatch(index)} 
              showBarcodes={true}
              disabled={isSubmitting || isProcessing || formSubmitted}
            />
          ))}
          
          <Button 
            onClick={handleBatchSubmission} 
            className="w-full mt-4 apple-shadow-sm" 
            disabled={batches.length === 0 || isSubmitting || isProcessing || formSubmitted}
          >
            {isSubmitting || isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : 'Submit All Batches'}
          </Button>
        </div>
      )}
    </div>
  );
};
