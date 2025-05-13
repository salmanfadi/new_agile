import React from 'react';
import { Box } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Warehouse, Location } from '@/hooks/useWarehouseData';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

interface BoxesTableProps {
  boxesData: BoxData[];
  handleBoxUpdate: (index: number, field: keyof BoxData, value: string | number) => void;
  warehouses?: Warehouse[];
  locations?: Location[];
}

export const BoxesTable: React.FC<BoxesTableProps> = ({
  boxesData,
  handleBoxUpdate,
  warehouses,
  locations
}) => {
  const validateQuantity = (value: number) => {
    if (value <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Quantity',
        description: 'Quantity must be greater than 0',
      });
      return false;
    }
    return true;
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    if (validateQuantity(numValue)) {
      handleBoxUpdate(index, 'quantity', numValue);
    }
  };

  const handleWarehouseChange = (index: number, value: string) => {
    handleBoxUpdate(index, 'warehouse_id', value);
    // Reset location when warehouse changes
    handleBoxUpdate(index, 'location_id', '');
  };

  return (
    <div>
      <h3 className="font-medium mb-3">Box Details</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Box #</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxesData.map((box, index) => (
              <TableRow key={box.id}>
                <TableCell>
                  <span className="flex items-center space-x-1">
                    <Box className="h-4 w-4" />
                    <span>{index + 1}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <Input
                    value={box.barcode}
                    readOnly
                    className="w-48 text-gray-500 bg-gray-100 cursor-not-allowed"
                    tabIndex={-1}
                    aria-label={`Barcode for box ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={box.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    className="w-20"
                    min="1"
                    required
                    aria-label={`Quantity for box ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={box.warehouse_id} 
                    onValueChange={(value) => handleWarehouseChange(index, value)}
                    required
                  >
                    <SelectTrigger className="w-32" aria-label={`Warehouse for box ${index + 1}`}>
                      <SelectValue placeholder="Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                      )) || (
                        <SelectItem value="no-warehouses-available" disabled>None</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={box.location_id} 
                    onValueChange={(value) => handleBoxUpdate(index, 'location_id', value)}
                    disabled={!box.warehouse_id}
                    required
                  >
                    <SelectTrigger className="w-28" aria-label={`Location for box ${index + 1}`}>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.filter(loc => loc.warehouse_id === box.warehouse_id).length > 0 ? (
                        locations?.filter(loc => loc.warehouse_id === box.warehouse_id).map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            F{location.floor}, Z{location.zone}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-locations-available" disabled>
                          {box.warehouse_id ? 'No locations' : 'Select warehouse'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    value={box.color}
                    onChange={(e) => handleBoxUpdate(index, 'color', e.target.value)}
                    className="w-24"
                    aria-label={`Color for box ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={box.size}
                    onChange={(e) => handleBoxUpdate(index, 'size', e.target.value)}
                    className="w-24"
                    aria-label={`Size for box ${index + 1}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
