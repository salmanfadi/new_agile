
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Printer, Download } from 'lucide-react';
import BarcodePreview from './BarcodePreview';
import jsPDF from 'jspdf';
import { BatchItemType } from '@/hooks/useProcessedBatches';

interface BarcodePrinterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcodes: string[];
  batchItems?: BatchItemType[];
}

const BarcodePrinter: React.FC<BarcodePrinterProps> = ({ 
  open, 
  onOpenChange, 
  barcodes,
  batchItems = []
}) => {
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const margin = 10;
    const labelWidth = 60;
    const labelHeight = 30;
    const labelsPerRow = Math.floor((210 - margin * 2) / labelWidth);
    const labelsPerCol = Math.floor((297 - margin * 2) / labelHeight);
    
    barcodes.forEach((barcode, index) => {
      // Calculate position for current barcode label
      const row = Math.floor(index / labelsPerRow);
      const col = index % labelsPerRow;
      const x = margin + col * labelWidth;
      const y = margin + row * labelHeight;
      
      // Position for new page if needed
      if (row >= labelsPerCol) {
        doc.addPage();
        doc.setPage(Math.floor(row / labelsPerCol) + 1);
      }
      
      // Place barcode info
      doc.setFontSize(8);
      doc.text(barcode, x + 5, y + 5);
      
      // Get matching batch item for additional info
      const batchItem = batchItems.find(item => item.barcode === barcode);
      if (batchItem) {
        const infoText = `Qty: ${batchItem.quantity}, Color: ${batchItem.color || 'N/A'}`;
        doc.text(infoText, x + 5, y + 10);
      }
      
      // Add placeholder for barcode image
      doc.rect(x + 5, y + 12, 50, 15);
      doc.setFontSize(6);
      doc.text('Barcode image would render here in full implementation', x + 7, y + 20);
    });
    
    doc.save('barcodes.pdf');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Print Barcodes</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="preview">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="print">Print Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {barcodes.slice(0, 6).map((barcode) => (
                <div key={barcode} className="border p-2 rounded">
                  <div className="text-xs font-mono mb-1">{barcode}</div>
                  <BarcodePreview barcode={barcode} width={150} height={50} />
                  <div className="text-xs mt-1">
                    {batchItems.find(item => item.barcode === barcode)?.quantity || 0} units
                  </div>
                </div>
              ))}
            </div>
            {barcodes.length > 6 && (
              <div className="text-center text-sm text-gray-500">
                + {barcodes.length - 6} more barcodes
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="print" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={generatePDF} className="flex items-center gap-2">
                  <Download size={16} />
                  Download PDF ({barcodes.length} barcodes)
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    /* Print functionality would go here */
                    window.print();
                  }}
                  className="flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print Now
                </Button>
              </div>
              
              <div className="text-sm text-gray-500 mt-2">
                Note: Downloaded PDF will include all selected barcodes formatted for printing on standard A4 paper.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodePrinter;
