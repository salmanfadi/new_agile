
import React, { useState, useEffect } from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Warehouse } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StockInStepBoxesProps {
  boxesData: BoxData[];
  updateBox: (index: number, field: keyof BoxData, value: string | number) => void;
  updateBoxLocation: (index: number, warehouseId: string, locationId: string) => void;
  defaultValues: {
    warehouse: string;
    location: string;
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
  updateBoxLocation,
  defaultValues,
  setDefaultValues,
  applyToAllBoxes,
  onBack,
  onContinue
}) => {
  const { warehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasIncompleteBoxes, setHasIncompleteBoxes] = useState(false);
  
  // Get locations for the selected warehouse in default values
  const { locations } = useLocations(defaultValues.warehouse);
  
  // Check for incomplete boxes
  useEffect(() => {
    const incomplete = boxesData.some(box => 
      !box.warehouse_id || 
      !box.location_id || 
      !box.quantity || 
      box.quantity <= 0
    );
    setHasIncompleteBoxes(incomplete);
  }, [boxesData]);
  
  // Select the current warehouse object based on default values
  useEffect(() => {
    if (warehouses && defaultValues.warehouse) {
      const warehouse = warehouses.find(w => w.id === defaultValues.warehouse);
      if (warehouse) {
        setSelectedWarehouse(warehouse);
      }
    }
  }, [warehouses, defaultValues.warehouse]);
  
  // Handle warehouse change
  const handleWarehouseChange = (warehouseId: string) => {
    const newDefaultValues = {
      ...defaultValues,
      warehouse: warehouseId,
      location: '' // Reset location when warehouse changes
    };
    setDefaultValues(newDefaultValues);
    setHasChanges(true);
  };
  
  // Update default values
  const handleDefaultValueChange = (field: string, value: string | number) => {
    setDefaultValues({
      ...defaultValues,
      [field]: value
    });
    setHasChanges(true);
  };
  
  // Apply defaults to all boxes
  const handleApplyToAll = () => {
    if (!defaultValues.warehouse || !defaultValues.location) {
      toast({
        title: "Missing Location",
        description: "Please select both warehouse and location before applying to all boxes.",
        variant: "destructive",
      });
      return;
    }
    
    applyToAllBoxes();
    setHasChanges(false);
    
    toast({
      title: "Applied to All",
      description: "Default values have been applied to all boxes",
    });
  };
  
  const handleContinue = () => {
    if (hasIncompleteBoxes) {
      toast({
        title: "Incomplete Boxes",
        description: "Please ensure all boxes have warehouse, location and quantity filled in.",
        variant: "destructive",
      });
      return;
    }
    
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle className="text-lg">Default Values</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultWarehouse">Warehouse</Label>
                  <Select 
                    value={defaultValues.warehouse} 
                    onValueChange={handleWarehouseChange}
                  >
                    <SelectTrigger id="defaultWarehouse">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultLocation">Location</Label>
                  <Select 
                    value={defaultValues.location} 
                    onValueChange={(value) => handleDefaultValueChange('location', value)}
                    disabled={!defaultValues.warehouse || !locations?.length}
                  >
                    <SelectTrigger id="defaultLocation">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          Floor {location.floor}, Zone {location.zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultQuantity">Quantity</Label>
                  <Input
                    id="defaultQuantity"
                    type="number"
                    min="1"
                    value={defaultValues.quantity}
                    onChange={(e) => handleDefaultValueChange('quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultColor">Color</Label>
                  <Input
                    id="defaultColor"
                    type="text"
                    value={defaultValues.color}
                    onChange={(e) => handleDefaultValueChange('color', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultSize">Size</Label>
                  <Input
                    id="defaultSize"
                    type="text"
                    value={defaultValues.size}
                    onChange={(e) => handleDefaultValueChange('size', e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleApplyToAll} 
                className="w-full"
                disabled={!defaultValues.warehouse || !defaultValues.location || !hasChanges}
              >
                Apply to All Boxes
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle className="text-lg">Process Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTitle className="text-amber-800">Fill in Box Details</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Please provide warehouse, location, and quantity information for each box. 
                  You can use the default values to quickly update all boxes at once.
                </AlertDescription>
              </Alert>
              
              {hasIncompleteBoxes && (
                <Alert variant="destructive">
                  <AlertTitle>Incomplete Boxes</AlertTitle>
                  <AlertDescription>
                    Some boxes are missing required information. Please ensure all boxes have warehouse, location and quantity.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="border rounded p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Boxes</span>
                  <span className="font-semibold">{boxesData.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Boxes Ready</span>
                  <span className="font-semibold">{boxesData.filter(box => box.warehouse_id && box.location_id && box.quantity > 0).length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="bg-muted/50 py-3">
          <CardTitle className="text-lg">Box Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4">
              <table className="w-full border-collapse">
                <thead className="text-left text-sm font-medium text-muted-foreground">
                  <tr className="border-b">
                    <th className="pb-2 pr-4">Box #</th>
                    <th className="pb-2 px-4">Barcode</th>
                    <th className="pb-2 px-4">Warehouse</th>
                    <th className="pb-2 px-4">Location</th>
                    <th className="pb-2 px-4">Qty</th>
                    <th className="pb-2 px-4">Color</th>
                    <th className="pb-2 px-4">Size</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {boxesData.map((box, index) => {
                    // Find the related locations for this specific box's warehouse
                    const boxLocations = useLocations(box.warehouse_id || '').locations;
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 pr-4">{index + 1}</td>
                        <td className="py-3 px-4 font-mono text-xs">{box.barcode}</td>
                        <td className="py-3 px-4 min-w-[150px]">
                          <Select 
                            value={box.warehouse_id || ''}
                            onValueChange={(value) => updateBoxLocation(index, value, '')}
                          >
                            <SelectTrigger className="h-8 w-full min-w-[150px]">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses?.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 min-w-[150px]">
                          <Select 
                            value={box.location_id || ''} 
                            onValueChange={(value) => updateBoxLocation(index, box.warehouse_id || '', value)}
                            disabled={!box.warehouse_id}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {boxLocations?.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  Floor {location.floor}, Zone {location.zone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 min-w-[80px]">
                          <Input
                            type="number"
                            min="1"
                            className="h-8"
                            value={box.quantity || ''}
                            onChange={(e) => updateBox(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="text"
                            className="h-8"
                            value={box.color || ''}
                            onChange={(e) => updateBox(index, 'color', e.target.value)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="text"
                            className="h-8"
                            value={box.size || ''}
                            onChange={(e) => updateBox(index, 'size', e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={hasIncompleteBoxes}>
          Continue to Preview
        </Button>
      </div>
    </div>
  );
};

export default StockInStepBoxes;
