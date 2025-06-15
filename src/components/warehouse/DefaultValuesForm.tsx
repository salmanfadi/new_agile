
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Define types locally to avoid import conflicts
interface Warehouse {
  id: string;
  name: string;
}

interface Location {
  id: string;
  warehouse_id: string;
  zone: string;
  floor: string;
}

export interface DefaultValues {
  warehouse_id: string;
  location_id: string;
  color: string;
  size: string;
}

interface DefaultValuesFormProps {
  defaultValues?: DefaultValues;
  setDefaultValues?: React.Dispatch<React.SetStateAction<DefaultValues>>;
  applyDefaultsToAll?: () => void;
  warehouses: Warehouse[];
  locations: Location[];
}

export const DefaultValuesForm: React.FC<DefaultValuesFormProps> = ({
  defaultValues,
  setDefaultValues,
  applyDefaultsToAll,
  warehouses = [],
  locations = []
}) => {
  // Provide fallback values if props are not provided
  const values = defaultValues || {
    warehouse_id: '',
    location_id: '',
    color: '',
    size: ''
  };

  const handleValueChange = (field: keyof DefaultValues, value: string) => {
    if (setDefaultValues) {
      setDefaultValues(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const filteredLocations = locations.filter(location => 
    !values.warehouse_id || location.warehouse_id === values.warehouse_id
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default Warehouse</Label>
            <Select
              value={values.warehouse_id}
              onValueChange={(value) => handleValueChange('warehouse_id', value)}
            >
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
            <Label>Default Location</Label>
            <Select
              value={values.location_id}
              onValueChange={(value) => handleValueChange('location_id', value)}
              disabled={!values.warehouse_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {filteredLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    Floor {location.floor} - Zone {location.zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Color</Label>
            <Input
              value={values.color}
              onChange={(e) => handleValueChange('color', e.target.value)}
              placeholder="Enter default color"
            />
          </div>

          <div className="space-y-2">
            <Label>Default Size</Label>
            <Input
              value={values.size}
              onChange={(e) => handleValueChange('size', e.target.value)}
              placeholder="Enter default size"
            />
          </div>
        </div>

        {applyDefaultsToAll && (
          <Button 
            onClick={applyDefaultsToAll}
            className="w-full"
            disabled={!values.warehouse_id || !values.location_id}
          >
            Apply Defaults to All Items
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DefaultValuesForm;
