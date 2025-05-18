
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Warehouse } from '@/types/database';
import { WarehouseLocation } from '@/types/database';

interface DefaultWarehouseSelectorProps {
  warehouses: Warehouse[] | undefined;
  warehouseLocations: WarehouseLocation[];
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;
  applyToAll: (warehouseId: string, locationId: string) => void;
  isLoadingWarehouses: boolean;
}

export const DefaultWarehouseSelector: React.FC<DefaultWarehouseSelectorProps> = ({
  warehouses,
  warehouseLocations,
  selectedWarehouse,
  setSelectedWarehouse,
  applyToAll,
  isLoadingWarehouses,
}) => {
  return (
    <div className="bg-muted/50 p-4 rounded-md mb-4">
      <h3 className="font-medium mb-2">Default Warehouse and Location</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="default-warehouse">Default Warehouse</Label>
          <Select
            value={selectedWarehouse?.id || ''}
            onValueChange={(value) => {
              const selected = warehouses?.find(w => w.id === value);
              if (selected) {
                setSelectedWarehouse(selected);
              }
            }}
            disabled={isLoadingWarehouses}
          >
            <SelectTrigger id="default-warehouse">
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
          <Label htmlFor="default-location">Default Location</Label>
          <Select
            value=""
            onValueChange={(locationId) => {
              if (selectedWarehouse) {
                applyToAll(selectedWarehouse.id, locationId);
              }
            }}
            disabled={!selectedWarehouse || warehouseLocations.length === 0}
          >
            <SelectTrigger id="default-location">
              <SelectValue placeholder="Apply location to all" />
            </SelectTrigger>
            <SelectContent>
              {warehouseLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  Floor {location.floor}, Zone {location.zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DefaultWarehouseSelector;
