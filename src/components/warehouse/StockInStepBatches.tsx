import React, { useState, useEffect } from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
import { generateBarcodeString } from '@/utils/barcodeUtils';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';

export interface BatchData {
  id: string; // temp uuid before save
  warehouse_id: string;
  location_id: string;
  boxes: BoxData[];
}

interface StockInStepBatchesProps {
  remainingBoxes: number;
  onAddBatch: (batch: BatchData) => void;
  onContinue: () => void;
  onBack: () => void;
  productName?: string;
  productSku?: string | null;
}

const StockInStepBatches: React.FC<StockInStepBatchesProps> = ({
  remainingBoxes,
  onAddBatch,
  onContinue,
  onBack,
  productName = '',
  productSku = null,
}) => {
  const { warehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const { locations } = useLocations(selectedWarehouse);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [boxesCount, setBoxesCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Log component state
  useEffect(() => {
    console.log('StockInStepBatches state:', {
      remainingBoxes,
      selectedWarehouse,
      selectedLocation,
      boxesCount,
      isGenerating
    });
  }, [remainingBoxes, selectedWarehouse, selectedLocation, boxesCount, isGenerating]);

  const handleAddBatch = async () => {
    console.log('Starting batch generation with:', {
      productName,
      productSku,
      selectedWarehouse,
      selectedLocation,
      boxesCount,
      remainingBoxes
    });

    if (!selectedWarehouse || !selectedLocation || boxesCount <= 0) {
      console.error('Invalid batch data:', { 
        hasWarehouse: !!selectedWarehouse, 
        hasLocation: !!selectedLocation, 
        boxesCount 
      });
      return;
    }
    
    if (boxesCount > remainingBoxes) {
      console.error('Too many boxes:', { boxesCount, remainingBoxes });
      return;
    }

    if (!productName) {
      console.error('Missing product name for barcode generation');
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log('Starting barcode generation:', {
        productPrefix: productName.substring(0, 3),
        productSku,
        boxesCount
      });
      
      // Generate barcodes in parallel
      const barcodePromises = Array.from({ length: boxesCount }, (_, i) => {
        const prefix = productName.substring(0, 3).toUpperCase();
        console.log(`Generating barcode ${i + 1}/${boxesCount} with prefix ${prefix}`);
        return generateBarcodeString(prefix, productSku ?? undefined, i + 1);
      });

      const barcodes = await Promise.all(barcodePromises);
      
      console.log('Generated barcodes:', barcodes);
      
      const boxes: BoxData[] = barcodes.map((barcode, idx) => ({
        id: `box-${Date.now()}-${idx}`,
        barcode,
        quantity: 1,
        color: '',
        size: '',
        warehouse_id: selectedWarehouse,
        location_id: selectedLocation,
        warehouse: selectedWarehouse,
        location: selectedLocation,
      }));
      
      console.log('Created box data:', boxes);
      
      const newBatch: BatchData = {
        id: `tmp-${Date.now()}`,
        warehouse_id: selectedWarehouse,
        location_id: selectedLocation,
        boxes,
      };

      console.log('Adding new batch:', newBatch);
      onAddBatch(newBatch);
      
      // reset for next batch
      setSelectedLocation('');
      setBoxesCount(1);
      
      console.log('Batch added successfully');
    } catch (error) {
      console.error('Error generating batch:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
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
              onValueChange={setSelectedLocation}
              disabled={!selectedWarehouse}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    Floor {location.floor} - Zone {location.zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Number of Boxes</Label>
            <Input
              type="number"
              min={1}
              max={remainingBoxes}
              value={boxesCount}
              onChange={(e) => setBoxesCount(Math.min(parseInt(e.target.value) || 1, remainingBoxes))}
            />
            <p className="text-sm text-muted-foreground">
              {remainingBoxes} boxes remaining to allocate
            </p>
          </div>
          
          <Button
            onClick={handleAddBatch}
            disabled={
              !selectedWarehouse || 
              !selectedLocation || 
              boxesCount <= 0 || 
              boxesCount > remainingBoxes ||
              isGenerating
            }
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Add Batch
              </>
            )}
          </Button>
        </CardContent>
      </Card>

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