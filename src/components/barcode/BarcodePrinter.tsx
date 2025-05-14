
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download } from 'lucide-react';
import { BatchItemType } from '@/hooks/useProcessedBatches';
import { formatBarcodeForDisplay } from '@/utils/barcodeUtils';

interface BarcodePrinterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcodes: string[];
  batchItems: BatchItemType[];
}

const BarcodePrinter: React.FC<BarcodePrinterProps> = ({ 
  open, 
  onOpenChange, 
  barcodes,
  batchItems
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  // Find batch items matching selected barcodes
  const selectedItems = batchItems.filter(item => barcodes.includes(item.barcode));
  
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF or image file
    console.log('Downloading barcodes:', barcodes);
    // Mock implementation - just show a success message
    alert('Barcodes have been downloaded');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Print Barcodes ({barcodes.length})</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="print-container space-y-4">
            {selectedItems.map((item) => (
              <div 
                key={item.barcode} 
                className="border rounded-md p-4 print:border-none print:p-0 print:mb-8 page-break-inside-avoid"
              >
                <div className="flex flex-col items-center">
                  {/* Mock barcode image */}
                  <div className="w-full h-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjxwYXRoIGQ9Ik0wIDBoMnYzMEgwem0zIDBoMXYzMEgzem00IDBoM3YzMEg3em01IDBoMXYzMGgtMXptMyAwaDJ2MzBoLTJ6bTQgMGgxdjMwaC0xem0yIDBoM3YzMGgtM3ptNSAwaDJ2MzBoLTJ6bTMgMGgzdjMwaC0zem01IDBoMnYzMGgtMnptMyAwaDR2MzBoLTR6bTYgMGgydjMwaC0yem0zIDBoMXYzMGgtMXptMyAwaDJ2MzBoLTJ6bTQgMGgxdjMwaC0xem0zIDBoM3YzMGgtM3ptNSAwaDJ2MzBoLTJ6bTMgMGg1djMwaC01em03IDBoMnYzMGgtMnptNCAwaDJ2MzBoLTJ6bTQgMGgxdjMwaC0xem0yIDBoNHYzMGgtNHptNiAwaDJ2MzBoLTJ6bTMgMGgxdjMwaC0xem0yIDBoMnYzMGgtMnoiLz48L3N2Zz4=')]" />
                  <div className="mt-2 text-center">
                    <p className="font-mono font-bold">{formatBarcodeForDisplay(item.barcode)}</p>
                    <p className="text-sm text-gray-600">{item.warehouses?.name || 'Unknown'} - {item.locations?.zone || 'Unknown'}</p>
                    <div className="flex justify-center gap-2 text-xs mt-1">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? 'Printing...' : 'Print All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodePrinter;
