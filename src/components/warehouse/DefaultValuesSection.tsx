
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DefaultValuesForm } from '@/components/warehouse/DefaultValuesForm';
import { DefaultValues } from '@/hooks/useStockInBoxes';
import { Warehouse, Location } from '@/hooks/useWarehouseData';

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
