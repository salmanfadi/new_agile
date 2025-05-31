import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { jsPDF } from 'jspdf';

import { BatchData, BarcodeViewerDialogProps } from '@/types/warehouse';

export const BarcodeViewerDialog: React.FC<BarcodeViewerDialogProps> = ({
  open,
  onOpenChange,
  batchData,
  batches = [],
  onBatchChange,
}) => {
  // Helper to get barcodes from either barcodes or boxBarcodes
  const getBarcodes = (batch: BatchData | null): string[] => {
    if (!batch) return [];
    return batch.barcodes || batch.boxBarcodes || [];
  };

  // Helper to get quantity per box
  const getQuantityPerBox = (batch: BatchData | null): number => {
    if (!batch) return 0;
    return batch.quantity_per_box || batch.quantityPerBox || 0;
  };

  // Helper to get batch number
  const getBatchNumber = (batch: BatchData | null): string => {
    if (!batch) return '';
    return batch.batch_number || batch.id;
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = React.useState(0);

  // Update current batch index when batchData changes
  React.useEffect(() => {
    if (batchData && batches.length > 0) {
      const index = batches.findIndex(batch => batch.id === batchData.id);
      if (index >= 0) {
        setCurrentBatchIndex(index);
      }
    }
  }, [batchData, batches]);

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
    if (!batchData) return;

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;
      let currentPage = 1;
      let barcodeCount = 0;
      const barcodesPerPage = 15;

      const targetBatches = allBatches && batches.length > 0 ? batches : [batchData];

      targetBatches.forEach((targetBatch, batchIndex) => {
        // Add a new page for each batch after the first one
        if (batchIndex > 0) {
          doc.addPage();
          yPos = 20;
          currentPage = 1;
        }

        // Add title
        doc.setFontSize(18);
        doc.text(`${targetBatch.product_name} - Batch #${targetBatch.batch_number}`, margin, yPos);
        yPos += 10;

        // Add batch details
        doc.setFontSize(12);
        yPos += 10;
        doc.text(`Product: ${targetBatch.product_name} (${targetBatch.product_sku})`, margin, yPos);
        yPos += 7;
        doc.text(`Warehouse: ${targetBatch.warehouse_name}`, margin, yPos);
        yPos += 7;
        doc.text(`Location: ${targetBatch.location_name}`, margin, yPos);
        yPos += 15;

        // Add barcodes in a grid
        doc.setFontSize(14);
        doc.text('Barcodes:', margin, yPos);
        yPos += 10;

        const barcodes = getBarcodes(targetBatch);
        barcodes.forEach((barcode, index) => {
          // Add new page if needed
          if (barcodeCount > 0 && barcodeCount % barcodesPerPage === 0) {
            doc.addPage();
            currentPage++;
            yPos = 20;

            // Add header to new page
            doc.setFontSize(12);
            doc.text(`Batch #${targetBatch.batch_number} - Page ${currentPage}`, margin, yPos);
            yPos += 15;
          }

          // Add barcode
          doc.setFontSize(10);
          doc.text(`• ${barcode}`, margin + 5, yPos);
          yPos += 5;
          barcodeCount++;
        });
      });

      // Save the PDF
      const filename = allBatches && batches.length > 1
        ? `barcodes-batch-${batches[0].batch_number}-to-${batches[batches.length - 1].batch_number}.pdf`
        : `barcodes-${batchData.batch_number}.pdf`;

      doc.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!batchData) return null;

  const hasMultipleBatches = batches.length > 1;
  const currentBatchNumber = currentBatchIndex + 1;
  const totalBatches = batches.length || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              Batch #{batchData.batch_number} - {batchData.product_name}
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
          {/* Batch Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Product</p>
              <span>{batchData.product_name || 'N/A'} ({batchData.product_sku || 'N/A'})</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Warehouse</p>
              <p>{batchData.warehouse_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p>{batchData.location_name}</p>
            </div>
            {batchData.quantity_per_box && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Qty/Box</p>
                <span>{getQuantityPerBox(batchData)}</span>
              </div>
            )}
            {batchData.color && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Color</p>
                <p>{batchData.color}</p>
              </div>
            )}
            {batchData.size && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Size</p>
                <p>{batchData.size}</p>
              </div>
            )}
          </div>

          {/* Barcodes */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium">Barcodes</h3>
                {hasMultipleBatches && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePreviousBatch}
                      disabled={currentBatchIndex === 0}
                      className="h-6 w-6"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span>Batch {currentBatchNumber} of {totalBatches}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextBatch}
                      disabled={currentBatchIndex >= totalBatches - 1}
                      className="h-6 w-6"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-x-2">
                {hasMultipleBatches && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePdf(false)}
                    disabled={isGeneratingPdf}
                    className="mr-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isGeneratingPdf ? 'Generating...' : 'This Batch'}
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => generatePdf(true)}
                  disabled={isGeneratingPdf}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {hasMultipleBatches
                    ? (isGeneratingPdf ? 'Generating...' : 'All Batches')
                    : (isGeneratingPdf ? 'Generating...' : 'Download PDF')}
                </Button>
              </div>
            </div>

            <ScrollArea className="border rounded-md flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">#</TableHead>
                    <TableHead>Barcode</TableHead>
                    {hasMultipleBatches && (
                      <TableHead className="text-right">Batch Number</TableHead>
                    )}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>{/* Barcode value would go here */}</TableCell>
                    {hasMultipleBatches && (
                      <TableCell className="text-right">
                        <span>{getBatchNumber(batchData)}</span>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
