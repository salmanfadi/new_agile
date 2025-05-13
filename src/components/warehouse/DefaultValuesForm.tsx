import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DefaultValues } from '@/hooks/useStockInBoxes';
import { Warehouse, Location } from '@/hooks/useWarehouseData';

interface DefaultValuesFormProps {
  defaultValues: DefaultValues;
  setDefaultValues: React.Dispatch<React.SetStateAction<DefaultValues>>;
  warehouses?: Warehouse[];
  locations?: Location[];
  onApplyToAll: () => void;
}

export const DefaultValuesForm: React.FC<DefaultValuesFormProps> = ({
  defaultValues,
  setDefaultValues,
  warehouses,
  locations,
  onApplyToAll
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select
              value={defaultValues.warehouse}
              onValueChange={(value) => setDefaultValues(prev => ({ ...prev, warehouse: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map(warehouse => (
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
              value={defaultValues.location}
              onValueChange={(value) => setDefaultValues(prev => ({ ...prev, location: value }))}
              disabled={!defaultValues.warehouse}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.filter(loc => loc.warehouse_id === defaultValues.warehouse).map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    F{location.floor}, Z{location.zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              value={defaultValues.quantity}
              onChange={(e) => setDefaultValues(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              value={defaultValues.color}
              onChange={(e) => setDefaultValues(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Size</Label>
            <Input
              value={defaultValues.size}
              onChange={(e) => setDefaultValues(prev => ({ ...prev, size: e.target.value }))}
            />
          </div>
        </div>
        <Button
          onClick={onApplyToAll}
          disabled={!defaultValues.warehouse || !defaultValues.location}
          className="w-full"
        >
          Apply to All Boxes
        </Button>
      </CardContent>
    </Card>
  );
};
