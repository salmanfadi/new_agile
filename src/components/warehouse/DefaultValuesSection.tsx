
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DefaultValuesForm, DefaultValues } from '@/components/warehouse/DefaultValuesForm';

// Use the same types as DefaultValuesForm to avoid conflicts
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

interface DefaultValuesSectionProps {
  defaultValues: DefaultValues;
  setDefaultValues: React.Dispatch<React.SetStateAction<DefaultValues>>;
  applyDefaultsToAll: () => void;
  warehouses?: Warehouse[];
  locations?: Location[];
}

export const DefaultValuesSection: React.FC<DefaultValuesSectionProps> = ({
  defaultValues,
  setDefaultValues,
  applyDefaultsToAll,
  warehouses,
  locations,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Values</CardTitle>
        <CardDescription>Set default values for all boxes</CardDescription>
      </CardHeader>
      <CardContent>
        <DefaultValuesForm
          defaultValues={defaultValues}
          setDefaultValues={setDefaultValues}
          applyDefaultsToAll={applyDefaultsToAll}
          warehouses={warehouses}
          locations={locations}
        />
      </CardContent>
    </Card>
  );
};
