
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Check, Printer } from 'lucide-react';

interface BarcodePreviewGridProps {
  boxesData: BoxData[];
  onPrint: (selectedBarcodes: string[]) => void;
}

const BarcodePreviewGrid: React.FC<BarcodePreviewGridProps> = ({ 
  boxesData, 
  onPrint 
}) => {
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Toggle selection of a barcode
  const toggleBarcode = (barcode: string) => {
    if (selectedBarcodes.includes(barcode)) {
      setSelectedBarcodes(selectedBarcodes.filter(b => b !== barcode));
      setSelectAll(false);
    } else {
      setSelectedBarcodes([...selectedBarcodes, barcode]);
      if (selectedBarcodes.length + 1 === boxesData.length) {
        setSelectAll(true);
      }
    }
  };

  // Toggle selection of all barcodes
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedBarcodes([]);
    } else {
      setSelectedBarcodes(boxesData.map(box => box.barcode));
    }
    setSelectAll(!selectAll);
  };

  // Handle print button click
  const handlePrint = () => {
    onPrint(selectedBarcodes);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="select-all" 
            checked={selectAll}
            onCheckedChange={toggleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All Barcodes
          </label>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          disabled={selectedBarcodes.length === 0}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Selected ({selectedBarcodes.length})
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {boxesData.map((box, index) => (
          <Card 
            key={index} 
            className={`overflow-hidden ${selectedBarcodes.includes(box.barcode) ? 'ring-2 ring-primary' : ''}`}
          >
            <CardContent className="p-0">
              <div className="p-3 bg-muted/50 border-b flex justify-between items-center">
                <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {box.barcode}
                </div>
                <Checkbox 
                  checked={selectedBarcodes.includes(box.barcode)}
                  onCheckedChange={() => toggleBarcode(box.barcode)}
                />
              </div>
              <div className="p-4 flex flex-col items-center">
                {/* Simplified barcode representation */}
                <div className="h-12 w-full bg-contain bg-no-repeat bg-center" 
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;base64,${btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="40">
                        ${Array.from({length: 20}, (_, i) => 
                          `<rect x="${i * 5}" y="0" width="${Math.random() > 0.5 ? 3 : 2}" height="40" fill="black" />`
                        ).join('')}
                      </svg>
                    `)}")` 
                  }}
                />
                <div className="mt-2 text-xs text-center">Box #{index + 1}</div>
                <div className="mt-1 text-xs text-center text-muted-foreground">
                  Qty: {box.quantity}
                  {box.color && `, ${box.color}`}
                  {box.size && `, ${box.size}`}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BarcodePreviewGrid;
