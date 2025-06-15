
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { WarehouseLocationDetails } from '@/types/location';

interface BoxItem {
  id: string;
  barcode: string;
  product_name: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  warehouse_name?: string;
  location?: WarehouseLocationDetails;
}

interface BoxesTableProps {
  boxes: BoxItem[];
  isLoading?: boolean;
  onViewDetails?: (box: BoxItem) => void;
}

export const BoxesTable: React.FC<BoxesTableProps> = ({ 
  boxes, 
  isLoading = false, 
  onViewDetails 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!boxes || boxes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No boxes found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Barcode</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Attributes</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boxes.map((box) => (
            <TableRow key={box.id}>
              <TableCell className="font-mono text-sm">{box.barcode}</TableCell>
              <TableCell className="font-medium">{box.product_name}</TableCell>
              <TableCell>{box.quantity}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {box.color && (
                    <Badge variant="outline" className="text-xs">
                      {box.color}
                    </Badge>
                  )}
                  {box.size && (
                    <Badge variant="outline" className="text-xs">
                      {box.size}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{box.warehouse_name || 'Unknown Warehouse'}</div>
                  <div className="text-muted-foreground">
                    {box.location ? `Floor ${box.location.floor}, Zone ${box.location.zone}` : 'Unknown Location'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    box.status === 'available' ? 'default' :
                    box.status === 'reserved' ? 'secondary' :
                    box.status === 'sold' ? 'destructive' :
                    'outline'
                  }
                >
                  {box.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails?.(box)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BoxesTable;
