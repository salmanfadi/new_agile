import React, { useState } from 'react';
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

  const handleAddBatch = async () => {
    if (!selectedWarehouse || !selectedLocation || boxesCount <= 0) return;
    setIsGenerating(true);
    try {
      // generate barcodes parallel
      const barcodes = await Promise.all(
        Array.from({ length: boxesCount }, (_, i) =>
          generateBarcodeString(productName.substring(0, 3), productSku ?? undefined, i + 1)
        )
      );
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
      onAddBatch({
        id: `tmp-${Date.now()}`,
        warehouse_id: selectedWarehouse,
        location_id: selectedLocation,
        boxes,
      });
      // reset for next batch
      setSelectedLocation('');
      setBoxesCount(1);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={selectedWarehouse} onValueChange={(v) => setSelectedWarehouse(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
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
                <SelectValue placeholder={selectedWarehouse ? 'Select location' : 'Select warehouse first'} />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    Floor {loc.floor} - Zone {loc.zone}
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
              onChange={(e) => setBoxesCount(parseInt(e.target.value) || 1)}
            />
            <p className="text-sm text-muted-foreground">Remaining: {remainingBoxes} boxes</p>
          </div>
          <Button
            onClick={handleAddBatch}
            disabled={
              !selectedWarehouse || !selectedLocation || boxesCount <= 0 || boxesCount > remainingBoxes ||
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
        <Button onClick={onContinue} disabled={remainingBoxes > 0}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default StockInStepBatches; 