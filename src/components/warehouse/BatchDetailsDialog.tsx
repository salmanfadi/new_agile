
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BatchDetailView } from './BatchDetailView';
import { useProcessedBatchesWithItems } from '@/hooks/useProcessedBatchesWithItems';

interface BatchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  onPrintBarcodes: () => void;
}

export const BatchDetailsDialog: React.FC<BatchDetailsDialogProps> = ({ 
  open, 
  onOpenChange, 
  batchId, 
  onPrintBarcodes 
}) => {
  const { data, isLoading, error } = useProcessedBatchesWithItems({
    limit: 1,
    searchTerm: batchId
  });

  const batch = data?.batches?.find(b => b.id === batchId);

  if (!batch) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="p-4 text-center">
            {isLoading ? 'Loading...' : 'Batch not found'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <BatchDetailView 
          batch={batch} 
          onClose={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};
