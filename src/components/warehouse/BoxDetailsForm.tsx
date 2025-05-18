
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Warehouse, WarehouseLocation } from '@/types/database';

interface BoxDetailsFormProps {
  box: BoxData;
  index: number;
  warehouses: Warehouse[] | undefined;
  warehouseLocations: WarehouseLocation[];
  updateBox: (index: number, data: Partial<BoxData>) => void;
}

export const BoxDetailsForm: React.FC<BoxDetailsFormProps> = ({
  box,
  index,
  warehouses,
  warehouseLocations,
  updateBox,
}) => {
  return (
    <div className="border rounded-md p-4">
      <h4 className="font-medium mb-2">Box {index + 1}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`box-${index}-warehouse`}>Warehouse</Label>
          <Select
            value={box.warehouse_id || ''}
            onValueChange={(value) => {
              updateBox(index, { warehouse_id: value });
              // Clear location when warehouse changes
              updateBox(index, { location_id: '' });
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
            value={box.location_id || ''}
            onValueChange={(value) => updateBox(index, { location_id: value })}
            disabled={!box.warehouse_id}
          >
            <SelectTrigger id={`box-${index}-location`}>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {warehouseLocations
                .filter(loc => loc.warehouse_id === box.warehouse_id)
                .map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    Floor {location.floor}, Zone {location.zone}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`box-${index}-quantity`}>Quantity</Label>
          <Input
            id={`box-${index}-quantity`}
            type="number"
            min="1"
            value={box.quantity}
            onChange={(e) => updateBox(index, { quantity: parseInt(e.target.value) || 0 })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`box-${index}-barcode`}>Barcode</Label>
          <Input
            id={`box-${index}-barcode`}
            value={box.barcode || ''}
            onChange={(e) => updateBox(index, { barcode: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`box-${index}-color`}>Color (Optional)</Label>
          <Input
            id={`box-${index}-color`}
            value={box.color || ''}
            onChange={(e) => updateBox(index, { color: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`box-${index}-size`}>Size (Optional)</Label>
          <Input
            id={`box-${index}-size`}
            value={box.size || ''}
            onChange={(e) => updateBox(index, { size: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default BoxDetailsForm;
