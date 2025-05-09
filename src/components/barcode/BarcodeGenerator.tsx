
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import BarcodePreview from './BarcodePreview';

interface BarcodeGeneratorProps {
  productName: string;
  productSku: string;
  category: string;
  onGenerateBarcode?: (barcode: string) => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  productName,
  productSku,
  category,
  onGenerateBarcode
}) => {
  const [barcode, setBarcode] = useState('');
  const [boxNumber, setBoxNumber] = useState(1);

  const handleGenerate = () => {
    const formattedSku = productSku || productName.substring(0, 6).toUpperCase().replace(/\s+/g, '');
    const newBarcode = generateBarcodeString(
      category || 'MISC',
      formattedSku,
      boxNumber
    );
    
    setBarcode(newBarcode);
    if (onGenerateBarcode) {
      onGenerateBarcode(newBarcode);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Barcode Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="bg-muted px-3 py-1 rounded-md flex items-center space-x-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{category || 'Uncategorized'}</span>
          </div>
          <div className="bg-muted px-3 py-1 rounded-md">
            <span className="text-xs text-muted-foreground">{productSku || 'No SKU'}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="box-number">Box Number</Label>
          <Input
            id="box-number"
            type="number"
            min="1"
            value={boxNumber}
            onChange={(e) => setBoxNumber(Number(e.target.value) || 1)}
          />
        </div>
        
        {barcode && (
          <div className="pt-4">
            <Label>Generated Barcode</Label>
            <div className="p-3 border rounded-md mt-2">
              <div className="flex justify-center mb-2">
                <BarcodePreview barcode={barcode} width={200} height={60} />
              </div>
              <p className="text-center text-sm mt-2">{barcode}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} className="w-full">
          Generate Barcode
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BarcodeGenerator;
