
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

import { BatchData, BarcodeViewerDialogProps } from '@/types/warehouse';
import { BatchInfo } from './barcode-viewer/BatchInfo';
import { BatchNavigation } from './barcode-viewer/BatchNavigation';
import { BarcodeList } from './barcode-viewer/BarcodeList';
import { BarcodeActions } from './barcode-viewer/BarcodeActions';
import { PdfGenerator } from './barcode-viewer/PdfGenerator';

export const BarcodeViewerDialog: React.FC<BarcodeViewerDialogProps> = ({
  open,
  onOpenChange,
  batch,
  batchData,
  batches = [],
  onBatchChange,
}) => {
  // Use batch or batchData (for backward compatibility)
  const currentBatch = batch || batchData;

  // Helper to get barcodes from either barcodes or boxBarcodes
  const getBarcodes = (batchItem: BatchData | null): string[] => {
    if (!batchItem) return [];
    return batchItem.barcodes || batchItem.boxBarcodes || [];
  };

  // Helper to get quantity per box
  const getQuantityPerBox = (batchItem: BatchData | null): number => {
    if (!batchItem) return 0;
    return batchItem.quantity_per_box || batchItem.quantityPerBox || 0;
  };

  // Helper to get batch number
  const getBatchNumber = (batchItem: BatchData | null): string => {
    if (!batchItem) return '';
    return batchItem.batch_number || batchItem.id;
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = React.useState(0);

  // Update current batch index when currentBatch changes
  React.useEffect(() => {
    if (currentBatch && batches.length > 0) {
      const index = batches.findIndex(batchItem => batchItem.id === currentBatch.id);
      if (index >= 0) {
        setCurrentBatchIndex(index);
      }
    }
  }, [currentBatch, batches]);

  const handlePreviousBatch = () => {
    if (currentBatchIndex > 0) {
      const prevBatch = batches[currentBatchIndex - 1];
      if (onBatchChange && prevBatch) {
        onBatchChange(prevBatch.id);
      }
    }
  };

  const handleNextBatch = () => {
    if (currentBatchIndex < batches.length - 1) {
      const nextBatch = batches[currentBatchIndex + 1];
      if (onBatchChange && nextBatch) {
        onBatchChange(nextBatch.id);
      }
    }
  };

  const generatePdf = (allBatches = false) => {
    if (!currentBatch) return;

    setIsGeneratingPdf(true);

    try {
      const targetBatches = allBatches && batches.length > 0 ? batches : [currentBatch];
      PdfGenerator.generateBarcodesPdf(targetBatches, getBarcodes, getBatchNumber, allBatches);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!currentBatch) return null;

  const hasMultipleBatches = batches.length > 1;
  const totalBatches = batches.length || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              Batch #{getBatchNumber(currentBatch)} - {currentBatch.product_name || currentBatch.product?.name || 'Product'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <BatchInfo batch={currentBatch} getQuantityPerBox={getQuantityPerBox} />

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium">Barcodes</h3>
                {hasMultipleBatches && (
                  <BatchNavigation
                    currentBatchIndex={currentBatchIndex}
                    totalBatches={totalBatches}
                    onPrevious={handlePreviousBatch}
                    onNext={handleNextBatch}
                  />
                )}
              </div>
              <BarcodeActions
                hasMultipleBatches={hasMultipleBatches}
                isGeneratingPdf={isGeneratingPdf}
                onGenerateSingleBatch={() => generatePdf(false)}
                onGenerateAllBatches={() => generatePdf(true)}
              />
            </div>

            <BarcodeList
              batch={currentBatch}
              getBarcodes={getBarcodes}
              getBatchNumber={getBatchNumber}
              hasMultipleBatches={hasMultipleBatches}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
