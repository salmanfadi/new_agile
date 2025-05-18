import React, { useState } from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodePreview from '@/components/warehouse/BarcodePreview';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Plus, Trash, Edit, Check, Loader2, Move } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const [activeTab, setActiveTab] = useState<'boxes' | 'batches'>('boxes');
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [massUpdateWarehouse, setMassUpdateWarehouse] = useState<string>("");
  const [massUpdateLocation, setMassUpdateLocation] = useState<string>("");
  const [boxSelection, setBoxSelection] = useState<number[]>([]);
  
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
      if (box.warehouse_id && box.location_id) {
        const key = `${box.warehouse_id}-${box.location_id}`;
        if (!groups[key]) {
          groups[key] = {
            warehouseId: box.warehouse_id,
            locationId: box.location_id,
            boxes: []
          };
        }
        groups[key].boxes.push(box);
      }
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

  // Apply warehouse and location to selected boxes
  const applyLocationToSelected = () => {
    if (!massUpdateWarehouse || !massUpdateLocation || boxSelection.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select warehouse, location and at least one box",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingChanges(true);
    
    // Apply to selected boxes
    boxSelection.forEach(boxIndex => {
      updateBoxLocation(boxIndex, massUpdateWarehouse, massUpdateLocation);
    });
    
    toast({
      title: "Location Updated",
      description: `Updated location for ${boxSelection.length} boxes`,
    });
    
    // Reset selection
    setBoxSelection([]);
    setIsApplyingChanges(false);
  };

  // Toggle box selection for batch assignment
  const toggleBoxSelection = (index: number) => {
    setBoxSelection(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'boxes' | 'batches')} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="boxes">Box Details</TabsTrigger>
          <TabsTrigger value="batches">Batches ({batchGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="boxes" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Default values and Apply to All */}
            <Card className="w-full lg:w-1/3">
              <CardHeader>
                <CardTitle>Default Values</CardTitle>
                <CardDescription>Set default values to apply to boxes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>

              <CardHeader className="pt-2">
                <CardTitle>Batch Assignment</CardTitle>
                <CardDescription>Assign multiple boxes to a location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select
                    value={massUpdateWarehouse}
                    onValueChange={setMassUpdateWarehouse}
                  >
                    <SelectTrigger>
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
                  <Label>Location</Label>
                  <Select
                    value={massUpdateLocation}
                    onValueChange={setMassUpdateLocation}
                    disabled={!massUpdateWarehouse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={massUpdateWarehouse ? "Select location" : "Select warehouse first"} />
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
                <div className="pt-2">
                  <Badge variant="outline" className="mb-2">
                    {boxSelection.length} boxes selected
                  </Badge>
                  <Button
                    onClick={applyLocationToSelected}
                    className="w-full"
                    disabled={!massUpdateWarehouse || !massUpdateLocation || boxSelection.length === 0 || isApplyingChanges}
                  >
                    {isApplyingChanges ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Move className="mr-2 h-4 w-4" />
                        Apply to Selected Boxes
                      </>
                    )}
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
              
              <div className="grid grid-cols-8 gap-2 mb-4">
                {boxesData.map((_, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all ${
                      activeBoxIndex === index ? 'ring-2 ring-primary' : ''
                    } ${boxSelection.includes(index) ? 'bg-primary/10' : ''}`}
                    onClick={() => setActiveBoxIndex(index)}
                  >
                    <CardContent className="p-2 text-center">
                      <div 
                        className="flex justify-between items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBoxSelection(index);
                        }}
                      >
                        <span>{index + 1}</span>
                        <Check 
                          className={`h-4 w-4 ${boxSelection.includes(index) ? 'opacity-100 text-primary' : 'opacity-0'}`} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Box {activeBoxIndex + 1} Details</CardTitle>
                  <CardDescription>
                    {boxesData[activeBoxIndex]?.warehouse_id && boxesData[activeBoxIndex]?.location_id ? (
                      <span className="text-xs text-muted-foreground">
                        Location: {getWarehouseName(boxesData[activeBoxIndex]?.warehouse_id)} - 
                        {getLocationName(boxesData[activeBoxIndex]?.warehouse_id, boxesData[activeBoxIndex]?.location_id)}
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600">No location assigned</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location assignment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`box-${activeBoxIndex}-warehouse`}>Warehouse</Label>
                      <Select
                        value={boxesData[activeBoxIndex]?.warehouse_id || ""}
                        onValueChange={(value) => {
                          setSelectedWarehouse(value);
                        }}
                      >
                        <SelectTrigger id={`box-${activeBoxIndex}-warehouse`}>
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
                      <Label htmlFor={`box-${activeBoxIndex}-location`}>Location</Label>
                      <Select
                        value={boxesData[activeBoxIndex]?.location_id || ""}
                        onValueChange={(value) => {
                          updateCurrentBoxLocation(selectedWarehouse || boxesData[activeBoxIndex]?.warehouse_id, value);
                        }}
                        disabled={!selectedWarehouse && !boxesData[activeBoxIndex]?.warehouse_id}
                      >
                        <SelectTrigger id={`box-${activeBoxIndex}-location`}>
                          <SelectValue placeholder={selectedWarehouse || boxesData[activeBoxIndex]?.warehouse_id ? "Select location" : "Select warehouse first"} />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor={`box-${activeBoxIndex}-barcode`}>Barcode</Label>
                    <Input
                      id={`box-${activeBoxIndex}-barcode`}
                      value={boxesData[activeBoxIndex]?.barcode}
                      onChange={(e) => updateBox(activeBoxIndex, 'barcode', e.target.value)}
                      readOnly
                      disabled
                    />
                  </div>
                  
                  <div className="pt-2">
                    <BarcodePreview 
                      value={boxesData[activeBoxIndex]?.barcode} 
                      height={60} 
                      width={1}
                      displayValue={true}
                      className="max-w-full overflow-x-auto"
                    />
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="space-y-2">
                    <Label htmlFor={`box-${activeBoxIndex}-quantity`}>Quantity</Label>
                    <Input
                      id={`box-${activeBoxIndex}-quantity`}
                      type="number"
                      value={boxesData[activeBoxIndex]?.quantity}
                      onChange={(e) => updateBox(activeBoxIndex, 'quantity', parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`box-${activeBoxIndex}-color`}>Color</Label>
                      <Input
                        id={`box-${activeBoxIndex}-color`}
                        value={boxesData[activeBoxIndex]?.color || ''}
                        onChange={(e) => updateBox(activeBoxIndex, 'color', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`box-${activeBoxIndex}-size`}>Size</Label>
                      <Input
                        id={`box-${activeBoxIndex}-size`}
                        value={boxesData[activeBoxIndex]?.size || ''}
                        onChange={(e) => updateBox(activeBoxIndex, 'size', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveBoxIndex(Math.max(0, activeBoxIndex - 1))}
                    disabled={activeBoxIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveBoxIndex(Math.min(boxesData.length - 1, activeBoxIndex + 1))}
                    disabled={activeBoxIndex === boxesData.length - 1}
                    variant="outline"
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="batches">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Batches by Location ({batchGroups.length})</h3>
              <Badge variant="outline">{boxesData.length} Total Boxes</Badge>
            </div>
            
            {batchGroups.length > 0 ? (
              <div className="space-y-4">
                {batchGroups.map((group, groupIndex) => (
                  <Card key={groupIndex}>
                    <CardHeader className="bg-muted py-3 px-4">
                      <CardTitle className="text-base">
                        {getWarehouseName(group.warehouseId)} - {group.locationId ? 
                          getLocationName(group.warehouseId, group.locationId) : 'Unknown Location'}
                      </CardTitle>
                      <CardDescription>
                        {group.boxes.length} {group.boxes.length === 1 ? 'box' : 'boxes'} | 
                        Total Quantity: {group.boxes.reduce((sum, box) => sum + box.quantity, 0)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Box #</th>
                              <th className="text-left py-2">Barcode</th>
                              <th className="text-left py-2">Quantity</th>
                              <th className="text-left py-2">Color</th>
                              <th className="text-left py-2">Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.boxes.map((box, boxIndex) => (
                              <tr key={boxIndex} className="border-b">
                                <td className="py-2">{boxesData.indexOf(box) + 1}</td>
                                <td className="py-2 font-mono text-xs">{box.barcode}</td>
                                <td className="py-2">{box.quantity}</td>
                                <td className="py-2">{box.color || '-'}</td>
                                <td className="py-2">{box.size || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertTitle>No batches created yet</AlertTitle>
                <AlertDescription>
                  Assign warehouses and locations to your boxes to create batches
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onContinue} 
          className="min-w-[140px]"
          disabled={batchGroups.length === 0}
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  );
};

export default StockInStepBoxes;
