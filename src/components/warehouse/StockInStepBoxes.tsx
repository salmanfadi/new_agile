
import React, { useState } from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodePreview from '@/components/warehouse/BarcodePreview';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Plus, Trash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BatchGroup {
  warehouseId: string;
  locationId: string;
  boxes: BoxData[];
}

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
  // New props for multiple batches
  updateBoxLocation: (index: number, warehouseId: string, locationId: string) => void;
}

const StockInStepBoxes: React.FC<StockInStepBoxesProps> = ({
  boxesData,
  updateBox,
  defaultValues,
  setDefaultValues,
  applyToAllBoxes,
  onBack,
  onContinue,
  updateBoxLocation,
}) => {
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const { locations, isLoading: isLoadingLocations } = useLocations(selectedWarehouse);

  // Function to handle defaultValues change
  const handleDefaultChange = (field: keyof typeof defaultValues, value: number | string) => {
    setDefaultValues({
      ...defaultValues,
      [field]: value,
    });
  };

  // Group boxes by warehouse and location for batch display
  const groupBoxesByLocation = (): BatchGroup[] => {
    const groups: Record<string, BatchGroup> = {};
    
    boxesData.forEach(box => {
      const key = `${box.warehouse_id}-${box.location_id}`;
      if (!groups[key]) {
        groups[key] = {
          warehouseId: box.warehouse_id,
          locationId: box.location_id,
          boxes: []
        };
      }
      groups[key].boxes.push(box);
    });
    
    return Object.values(groups);
  };
  
  const batchGroups = groupBoxesByLocation();

  // Update warehouse and location for current box
  const updateCurrentBoxLocation = (warehouseId: string, locationId: string) => {
    if (!warehouseId || !locationId) {
      toast({
        title: "Missing Information",
        description: "Please select both warehouse and location",
        variant: "destructive",
      });
      return;
    }
    
    updateBoxLocation(activeBoxIndex, warehouseId, locationId);
    
    // Update selected warehouse for location dropdown
    setSelectedWarehouse(warehouseId);
    
    toast({
      title: "Box Location Updated",
      description: "Box has been assigned to new location",
    });
  };

  // Get warehouse name by ID
  const getWarehouseName = (id: string) => {
    const warehouse = warehouses?.find(w => w.id === id);
    return warehouse?.name || 'Unknown Warehouse';
  };
  
  // Get location name by ID
  const getLocationName = (warehouseId: string, locationId: string) => {
    const location = locations?.find(l => l.id === locationId);
    return location ? `Floor ${location.floor}, Zone ${location.zone}` : 'Unknown Location';
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
                  <CardHeader>
                    <CardTitle className="text-base">Box {index + 1} Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Location assignment */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`box-${index}-warehouse`}>Warehouse</Label>
                          <Select
                            value={box.warehouse_id || ""}
                            onValueChange={(value) => {
                              setSelectedWarehouse(value);
                            }}
                          >
                            <SelectTrigger id={`box-${index}-warehouse`}>
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
                          <Label htmlFor={`box-${index}-location`}>Location</Label>
                          <Select
                            value={box.location_id || ""}
                            onValueChange={(value) => {
                              updateCurrentBoxLocation(selectedWarehouse || box.warehouse_id, value);
                            }}
                            disabled={!selectedWarehouse && !box.warehouse_id}
                          >
                            <SelectTrigger id={`box-${index}-location`}>
                              <SelectValue placeholder={selectedWarehouse || box.warehouse_id ? "Select location" : "Select warehouse first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {locations?.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  Floor {location.floor}, Zone {location.zone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {box.warehouse_id && box.location_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Current: {getWarehouseName(box.warehouse_id)} - 
                              {getLocationName(box.warehouse_id, box.location_id)}
                            </p>
                          )}
                        </div>
                      </div>
                      
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
          
          {/* Show batch groups */}
          {batchGroups.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Batches ({batchGroups.length})</h3>
              <div className="space-y-4">
                {batchGroups.map((group, groupIndex) => (
                  <Card key={groupIndex} className="overflow-hidden">
                    <CardHeader className="bg-muted py-3 px-4">
                      <CardTitle className="text-base">
                        {getWarehouseName(group.warehouseId)} - {group.locationId ? 
                          getLocationName(group.warehouseId, group.locationId) : 'Unknown Location'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.boxes.length} {group.boxes.length === 1 ? 'box' : 'boxes'}
                      </p>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="text-sm">
                        Boxes: {group.boxes.map((_, i) => (
                          <Badge key={i} variant="outline" className="mr-1 mb-1">
                            {boxesData.indexOf(group.boxes[i]) + 1}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} className="min-w-[140px]">
          Continue to Preview
        </Button>
      </div>
    </div>
  );
};

export default StockInStepBoxes;
