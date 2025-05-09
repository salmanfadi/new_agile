import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  applyDefaultsToAll: () => void;
  warehouses?: Warehouse[];
  locations?: Location[];
}

export const DefaultValuesForm: React.FC<DefaultValuesFormProps> = ({
  defaultValues,
  setDefaultValues,
  applyDefaultsToAll,
  warehouses,
  locations
}) => {
  // Filter locations based on selected warehouse
  const filteredLocations = locations?.filter(loc => 
    loc.warehouse_id === defaultValues.warehouse
  ) || [];

  // Reset location when warehouse changes
  const handleWarehouseChange = (warehouseId: string) => {
    setDefaultValues(prev => ({ 
      ...prev, 
      warehouse: warehouseId,
      location: '' // Reset location when warehouse changes
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="default_warehouse">Warehouse</Label>
          <Select 
            value={defaultValues.warehouse} 
            onValueChange={handleWarehouseChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses?.map(warehouse => (
                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
              )) || (
                <SelectItem value="no-warehouses-available" disabled>No warehouses available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="default_location">Location</Label>
          <Select 
            value={defaultValues.location} 
            onValueChange={(value) => setDefaultValues(prev => ({ ...prev, location: value }))}
            disabled={!defaultValues.warehouse || filteredLocations.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {filteredLocations.length > 0 ? (
                filteredLocations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    Floor {location.floor}, Zone {location.zone}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-locations-available" disabled>
                  {defaultValues.warehouse ? 'No locations for this warehouse' : 'Select warehouse first'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="default_quantity">Quantity per Box</Label>
          <Input 
            id="default_quantity"
            type="number"
            value={defaultValues.quantity || ''}
            onChange={(e) => setDefaultValues(prev => ({ 
              ...prev, 
              quantity: parseInt(e.target.value) || 0 
            }))}
            min="0"
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="default_color">Color (Optional)</Label>
          <Input 
            id="default_color"
            value={defaultValues.color}
            onChange={(e) => setDefaultValues(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>
        
        <div>
          <Label htmlFor="default_size">Size (Optional)</Label>
          <Input 
            id="default_size"
            value={defaultValues.size}
            onChange={(e) => setDefaultValues(prev => ({ ...prev, size: e.target.value }))}
          />
        </div>
      </div>
      <Button 
        type="button" 
        onClick={applyDefaultsToAll}
        className="mt-2"
        disabled={!defaultValues.warehouse || !defaultValues.location}
      >
        Apply to All Boxes
      </Button>
    </div>
  );
};
