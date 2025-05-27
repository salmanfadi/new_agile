import React, { useState } from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export interface BatchData {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  boxCount: number;
  quantityPerBox: number;
  color: string;
  size: string;
  boxes: any[];
}

interface StockInStepBatchesProps {
  onBack: () => void;
  onContinue: () => void;
  batches: BatchData[];
  setBatches: React.Dispatch<React.SetStateAction<BatchData[]>>;
  stockIn: StockInRequestData;
  defaultValues: {
    quantity: number;
    color: string;
    size: string;
  };
}

const StockInStepBatches: React.FC<StockInStepBatchesProps> = ({
  onBack,
  onContinue,
  batches,
  setBatches,
  stockIn,
  defaultValues
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [boxCount, setBoxCount] = useState<number>(1);
  const [quantityPerBox, setQuantityPerBox] = useState<number>(defaultValues.quantity);
  const [color, setColor] = useState<string>(defaultValues.color);
  const [size, setSize] = useState<string>(defaultValues.size);
  
  const { warehouses } = useWarehouses();
  const { locations, isLoading: isLoadingLocations } = useLocations(selectedWarehouse);

  const handleBoxCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    // Only update if the value is within bounds
    if (value >= 0 && value <= remainingBoxes) {
      setBoxCount(value);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    setSelectedLocation(''); // Reset location when warehouse changes
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const handleAddBatch = () => {
    if (!selectedWarehouse || !selectedLocation || boxCount <= 0 || quantityPerBox <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate box count
    if (boxCount > remainingBoxes) {
      toast({
        title: "Invalid Box Count",
        description: `Cannot add more than ${remainingBoxes} boxes`,
        variant: "destructive"
      });
      return;
    }

    const warehouse = warehouses?.find(w => w.id === selectedWarehouse);
    const location = locations?.find(l => l.id === selectedLocation);

    if (!warehouse || !location) {
      toast({
        title: "Invalid Selection",
        description: "Please select valid warehouse and location",
        variant: "destructive"
      });
      return;
    }

    const newBatch: BatchData = {
      id: `batch-${Date.now()}`,
      warehouse_id: selectedWarehouse,
      warehouse_name: warehouse.name,
      location_id: selectedLocation,
      location_name: `Zone ${location.zone}, Floor ${location.floor}`,
      boxCount: boxCount, // Use the exact box count entered by user
      quantityPerBox,
      color,
      size,
      boxes: []
    };

    setBatches(prev => [...prev, newBatch]);

    // Reset form
    setSelectedLocation('');
    setBoxCount(1);
    setQuantityPerBox(defaultValues.quantity);
    setColor(defaultValues.color);
    setSize(defaultValues.size);
    
    toast({
      title: "Batch Added",
      description: `Added batch of ${boxCount} boxes to ${warehouse.name}`,
    });
  };

  const totalBoxesInBatches = batches.reduce((sum, batch) => sum + batch.boxCount, 0);
  const remainingBoxes = stockIn.boxes - totalBoxesInBatches;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={selectedWarehouse} onValueChange={handleWarehouseChange}>
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
              value={selectedLocation} 
              onValueChange={handleLocationChange}
              disabled={!selectedWarehouse || isLoadingLocations}
            >
              <SelectTrigger>
                <SelectValue placeholder={!selectedWarehouse ? "Select warehouse first" : "Select location"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingLocations ? (
                  <SelectItem value="loading" disabled>
                    Loading locations...
                  </SelectItem>
                ) : locations && locations.length > 0 ? (
                  locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      Zone {location.zone}, Floor {location.floor}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-locations" disabled>
                    {selectedWarehouse ? "No locations found" : "Select a warehouse first"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedWarehouse && locations && locations.length === 0 && !isLoadingLocations && (
              <p className="text-sm text-muted-foreground mt-1">
                No locations available for this warehouse
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Number of Boxes</Label>
            <Input
              type="number"
              min={1}
              max={remainingBoxes}
              value={boxCount}
              onChange={handleBoxCountChange}
            />
            <p className="text-sm text-muted-foreground">
              {remainingBoxes} boxes remaining to allocate
            </p>
          </div>

          <div className="space-y-2">
            <Label>Quantity per Box</Label>
            <Input
              type="number"
              min={1}
              value={quantityPerBox}
              onChange={(e) => setQuantityPerBox(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <Button
            onClick={handleAddBatch}
            disabled={!selectedWarehouse || !selectedLocation || boxCount <= 0 || quantityPerBox <= 0}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Batch
          </Button>
        </CardContent>
      </Card>

      {batches.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Created Batches</h3>
          {batches.map((batch, index) => (
            <Card key={batch.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Warehouse</Label>
                    <p>{batch.warehouse_name}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p>{batch.location_name}</p>
                  </div>
                  <div>
                    <Label>Boxes</Label>
                    <p>{batch.boxCount}</p>
                  </div>
                  <div>
                    <Label>Quantity per Box</Label>
                    <p>{batch.quantityPerBox}</p>
                  </div>
                  {batch.color && (
                    <div>
                      <Label>Color</Label>
                      <p>{batch.color}</p>
                    </div>
                  )}
                  {batch.size && (
                    <div>
                      <Label>Size</Label>
                      <p>{batch.size}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onContinue} 
          disabled={remainingBoxes > 0}
          className="min-w-[140px]"
        >
          {remainingBoxes > 0 ? 
            `${remainingBoxes} boxes remaining` : 
            'Continue to Preview'
          }
        </Button>
      </div>
    </div>
  );
};

export default StockInStepBatches; 