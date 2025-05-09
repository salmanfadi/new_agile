
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BoxesTable } from '@/components/warehouse/BoxesTable';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Warehouse, Location } from '@/hooks/useWarehouseData';

interface BoxDetailsSectionProps {
  boxesData: BoxData[];
  handleBoxUpdate: (index: number, field: keyof BoxData, value: string | number) => void;
  warehouses?: Warehouse[];
  locations?: Location[];
}

export const BoxDetailsSection: React.FC<BoxDetailsSectionProps> = ({
  boxesData,
  handleBoxUpdate,
  warehouses,
  locations,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Box Details</CardTitle>
        <CardDescription>Specify details for individual boxes</CardDescription>
      </CardHeader>
      <CardContent>
        <BoxesTable
          boxesData={boxesData}
          handleBoxUpdate={handleBoxUpdate}
          warehouses={warehouses}
          locations={locations}
        />
      </CardContent>
    </Card>
  );
};
