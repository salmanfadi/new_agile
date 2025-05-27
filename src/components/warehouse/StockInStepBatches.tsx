<<<<<<< HEAD
import React, { useState } from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
=======
import React, { useState, useEffect } from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
>>>>>>> origin/reserve-stock
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
<<<<<<< HEAD
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
=======
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
>>>>>>> origin/reserve-stock

// Define the types we need
interface WarehouseType {
  id: string;
  name: string;
}

interface LocationType {
  id: string;
  floor: number;
  zone: string;
  warehouse_id?: string;
}

// Define the BatchData interface for the batch creation workflow
export interface BatchData {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  boxCount: number;
<<<<<<< HEAD
  quantityPerBox: number;
  color: string;
  size: string;
  boxes: any[];
=======
  color: string;
  size: string;
  quantityPerBox: number;
  created_at?: string;
  batchBarcode?: string;   // Optional batch barcode generated in preview step
  boxBarcodes?: string[];  // Optional array of box barcodes generated in preview step
  boxes?: BoxData[];       // Optional boxes data for backward compatibility
>>>>>>> origin/reserve-stock
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
<<<<<<< HEAD
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
=======
  defaultValues,
}) => {
  const { warehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const { locations } = useLocations(selectedWarehouse);
  
  const [newBatch, setNewBatch] = useState<{
    warehouse_id: string;
    warehouse_name: string;
    location_id: string;
    location_name: string;
    boxCount: number;
    color: string;
    size: string;
    quantityPerBox: number;
  }>({
    warehouse_id: '',
    warehouse_name: '',
    location_id: '',
    location_name: '',
    boxCount: 1,
    color: defaultValues?.color || '',
    size: defaultValues?.size || '',
    quantityPerBox: defaultValues?.quantity || 1,
  });
  
  // Track total boxes across all batches
  const totalBoxesInBatches = batches.reduce((sum, batch) => sum + batch.boxCount, 0);
  const remainingBoxes = Math.max(0, (stockIn?.boxes || 0) - totalBoxesInBatches);
  
  // Get selected warehouse name
  const getWarehouseName = (id: string) => {
    const warehouse = warehouses?.find(w => w.id === id);
    return warehouse?.name || '';
  };
  
  // Get selected location name
  const getLocationName = (id: string) => {
    const location = locations?.find(l => l.id === id);
    if (location) {
      return `Floor ${location.floor}, Zone ${location.zone}`;
>>>>>>> origin/reserve-stock
    }
    return '';
  };
  
  // Update warehouse selection
  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    setNewBatch(prev => ({
      ...prev,
      warehouse_id: warehouseId,
      warehouse_name: getWarehouseName(warehouseId),
      location_id: '', // Reset location when warehouse changes
      location_name: '',
    }));
  };
  
  // Update location selection
  const handleLocationChange = (locationId: string) => {
    setNewBatch(prev => ({
      ...prev,
      location_id: locationId,
      location_name: getLocationName(locationId),
    }));
  };

<<<<<<< HEAD
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

=======
  // Handle adding a new batch
  const handleAddBatch = () => {
    // Validate inputs
    if (!newBatch.warehouse_id || !newBatch.location_id) {
      toast({
        title: 'Missing Information',
        description: 'Please select both warehouse and location',
        variant: 'destructive',
      });
      return;
    }
    
    if (newBatch.boxCount <= 0) {
      toast({
        title: 'Invalid Box Count',
        description: 'Number of boxes must be greater than zero',
        variant: 'destructive',
      });
      return;
    }
    
    if (newBatch.quantityPerBox <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity per box must be greater than zero',
        variant: 'destructive',
      });
      return;
    }
    
    if (newBatch.boxCount > remainingBoxes) {
      toast({
        title: 'Too Many Boxes',
        description: `You can only add ${remainingBoxes} more boxes to match the original request`,
        variant: 'destructive',
      });
      return;
    }
    
    // Add new batch with generated ID
    const newBatchWithId: BatchData = {
      ...newBatch,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      boxes: [], // Will be populated in the next step
    };
    
    setBatches([...batches, newBatchWithId]);
    
    // Reset form
    setNewBatch({
      warehouse_id: '',
      warehouse_name: '',
      location_id: '',
      location_name: '',
      boxCount: 1,
      color: defaultValues?.color || '',
      size: defaultValues?.size || '',
      quantityPerBox: defaultValues?.quantity || 1,
    });
    
    setSelectedWarehouse('');
    
    toast({
      title: 'Batch Added',
      description: `Added a new batch with ${newBatchWithId.boxCount} boxes`,
    });
  };
  
  // Remove a batch
  const handleRemoveBatch = (batchId: string) => {
    setBatches(batches.filter(batch => batch.id !== batchId));
    toast({
      title: 'Batch Removed',
      description: 'The batch has been removed',
    });
  };
  
>>>>>>> origin/reserve-stock
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Batch</CardTitle>
          <CardDescription>
            Group boxes into batches by warehouse, location and properties. Total boxes: {stockIn?.boxes || 0}, Remaining: {remainingBoxes}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
<<<<<<< HEAD
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
=======
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Warehouse Selection */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse <span className="text-destructive">*</span></Label>
              <Select
                value={newBatch.warehouse_id}
                onValueChange={handleWarehouseChange}
              >
                <SelectTrigger id="warehouse">
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

            {/* Location Selection */}
            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
              <Select
                value={newBatch.location_id}
                onValueChange={handleLocationChange}
                disabled={!newBatch.warehouse_id}
              >
                <SelectTrigger id="location">
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
            
            {/* Box Count */}
            <div className="space-y-2">
              <Label htmlFor="boxCount">Number of Boxes <span className="text-destructive">*</span></Label>
              <Input
                id="boxCount"
                type="number"
                min={1}
                max={remainingBoxes}
                value={newBatch.boxCount}
                onChange={(e) => setNewBatch({...newBatch, boxCount: parseInt(e.target.value) || 0})}
              />
            </div>
            
            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color <span className="text-destructive">*</span></Label>
              <Input
                id="color"
                value={newBatch.color}
                onChange={(e) => setNewBatch({...newBatch, color: e.target.value})}
              />
            </div>
            
            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Size <span className="text-destructive">*</span></Label>
              <Input
                id="size"
                value={newBatch.size}
                onChange={(e) => setNewBatch({...newBatch, size: e.target.value})}
              />
            </div>
            
            {/* Quantity per Box */}
            <div className="space-y-2">
              <Label htmlFor="quantityPerBox">Quantity per Box <span className="text-destructive">*</span></Label>
              <Input
                id="quantityPerBox"
                type="number"
                min={1}
                value={newBatch.quantityPerBox}
                onChange={(e) => setNewBatch({...newBatch, quantityPerBox: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
>>>>>>> origin/reserve-stock
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAddBatch} 
            className="w-full"
            disabled={!newBatch.warehouse_id || !newBatch.location_id || newBatch.boxCount <= 0 || newBatch.quantityPerBox <= 0}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Batch
          </Button>
        </CardFooter>
      </Card>

<<<<<<< HEAD
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
=======
      {remainingBoxes !== (stockIn?.boxes || 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Batch Status</AlertTitle>
          <AlertDescription>
            You have created batches for {totalBoxesInBatches} out of {stockIn?.boxes || 0} boxes.
            {remainingBoxes > 0 ? ` You still need to allocate ${remainingBoxes} more boxes.` : ' All boxes have been allocated.'}
          </AlertDescription>
        </Alert>
      )}
      
      {batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batches ({batches.length})</CardTitle>
            <CardDescription>Review your created batches before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {batches.map((batch, index) => (
              <div key={batch.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Batch {index + 1}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBatch(batch.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Warehouse:</span> {batch.warehouse_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span> {batch.location_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Box Count:</span> {batch.boxCount}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity/Box:</span> {batch.quantityPerBox}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Color:</span> {batch.color || 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span> {batch.size || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
>>>>>>> origin/reserve-stock
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onContinue} 
          disabled={batches.length === 0 || remainingBoxes > 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default StockInStepBatches; 