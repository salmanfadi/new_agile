
import React, { useState } from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodePreview from '@/components/warehouse/BarcodePreview';
import { Badge } from '@/components/ui/badge';

interface StockInStepBoxesProps {
  boxesData: BoxData[];
  updateBox: (index: number, field: keyof BoxData, value: string | number) => void;
  defaultValues: {
    quantity: number;
    color: string;
    size: string;
  };
  setDefaultValues: (values: any) => void;
  applyToAllBoxes: () => void;
  onBack: () => void;
  onContinue: () => void;
}

const StockInStepBoxes: React.FC<StockInStepBoxesProps> = ({
  boxesData,
  updateBox,
  defaultValues,
  setDefaultValues,
  applyToAllBoxes,
  onBack,
  onContinue,
}) => {
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);

  // Function to handle defaultValues change
  const handleDefaultChange = (field: keyof typeof defaultValues, value: number | string) => {
    setDefaultValues({
      ...defaultValues,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Default values and Apply to All */}
        <Card className="w-full lg:w-1/3">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Default Values</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-quantity">Quantity per Box</Label>
                <Input
                  id="default-quantity"
                  type="number"
                  value={defaultValues.quantity}
                  onChange={(e) => handleDefaultChange('quantity', parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-color">Color</Label>
                <Input
                  id="default-color"
                  type="text"
                  placeholder="Optional"
                  value={defaultValues.color}
                  onChange={(e) => handleDefaultChange('color', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-size">Size</Label>
                <Input
                  id="default-size"
                  type="text"
                  placeholder="Optional"
                  value={defaultValues.size}
                  onChange={(e) => handleDefaultChange('size', e.target.value)}
                />
              </div>
              
              <Button 
                onClick={applyToAllBoxes} 
                className="w-full mt-4"
              >
                Apply to All Boxes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Box specific details */}
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Box Details</h3>
            <Badge variant="outline">{boxesData.length} Boxes</Badge>
          </div>
          
          <Tabs
            value={activeBoxIndex.toString()}
            onValueChange={(value) => setActiveBoxIndex(parseInt(value))}
            className="w-full"
          >
            <TabsList className="h-auto flex flex-nowrap overflow-x-auto mb-4 max-w-full">
              {boxesData.map((_, index) => (
                <TabsTrigger 
                  key={index} 
                  value={index.toString()}
                  className="px-3 py-1.5"
                >
                  Box {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {boxesData.map((box, index) => (
              <TabsContent key={index} value={index.toString()} className="pt-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`box-${index}-barcode`}>Barcode</Label>
                        <Input
                          id={`box-${index}-barcode`}
                          value={box.barcode}
                          onChange={(e) => updateBox(index, 'barcode', e.target.value)}
                          readOnly
                          disabled
                        />
                      </div>
                      
                      <div className="pt-2">
                        <BarcodePreview 
                          value={box.barcode} 
                          height={60} 
                          width={1}
                          displayValue={true}
                          className="max-w-full overflow-x-auto"
                        />
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="space-y-2">
                        <Label htmlFor={`box-${index}-quantity`}>Quantity</Label>
                        <Input
                          id={`box-${index}-quantity`}
                          type="number"
                          value={box.quantity}
                          onChange={(e) => updateBox(index, 'quantity', parseInt(e.target.value) || 0)}
                          min={1}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`box-${index}-color`}>Color</Label>
                          <Input
                            id={`box-${index}-color`}
                            value={box.color || ''}
                            onChange={(e) => updateBox(index, 'color', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`box-${index}-size`}>Size</Label>
                          <Input
                            id={`box-${index}-size`}
                            value={box.size || ''}
                            onChange={(e) => updateBox(index, 'size', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveBoxIndex(Math.max(0, index - 1))}
                    disabled={index === 0}
                  >
                    Previous Box
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveBoxIndex(Math.min(boxesData.length - 1, index + 1))}
                    disabled={index === boxesData.length - 1}
                    variant="outline"
                  >
                    Next Box
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          Continue to Preview
        </Button>
      </div>
    </div>
  );
};

export default StockInStepBoxes;
