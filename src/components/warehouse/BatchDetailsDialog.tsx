
import React from 'react';
import { BatchDetailView } from './BatchDetailView';

interface BatchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  onPrintBarcodes?: () => void;
}

export const BatchDetailsDialog: React.FC<BatchDetailsDialogProps> = ({
  open,
  onOpenChange,
  batchId,
  onPrintBarcodes,
}) => {
  return <BatchDetailView 
    open={open}
    onOpenChange={onOpenChange}
    batchId={batchId}
    onPrintBarcodes={onPrintBarcodes}
  />;
};

export default BatchDetailsDialog;
