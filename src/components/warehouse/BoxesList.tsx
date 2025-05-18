
import React from 'react';
import { BoxData } from '@/hooks/useStockInBoxes';
import { BoxDetailsForm } from './BoxDetailsForm';
import { WarehouseLocation } from '@/types/database';

interface BoxesListProps {
  boxes: BoxData[];
  updateBox: (index: number, data: Partial<BoxData>) => void;
  warehouses: any[] | undefined;
  warehouseLocations: WarehouseLocation[];
}

export const BoxesList: React.FC<BoxesListProps> = ({
  boxes,
  updateBox,
  warehouses,
  warehouseLocations
}) => {
  return (
    <div className="space-y-4">
      {boxes.map((box, index) => (
        <BoxDetailsForm
          key={index}
          box={box}
          index={index}
          warehouses={warehouses}
          warehouseLocations={warehouseLocations}
          updateBox={updateBox}
        />
      ))}
    </div>
  );
};

export default BoxesList;
