
import React from 'react';
import { ProcessedBatch } from '@/types/batchStockIn';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Warehouse, Package2, MapPin, Boxes, Box, Palette, Ruler, Trash2, Edit } from 'lucide-react';
import BarcodePreview from '@/components/barcode/BarcodePreview';

interface BatchCardProps {
  batch: ProcessedBatch;
  index: number;
  onDelete: (index: number) => void;
  onEdit: (index: number) => void;
  showBarcodes?: boolean;
}

export const BatchCard: React.FC<BatchCardProps> = ({ 
  batch, 
  index, 
  onDelete, 
  onEdit,
  showBarcodes = false
}) => {
  const totalQuantity = batch.boxes_count * batch.quantity_per_box;
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md">
            {batch.product?.name || 'Unknown Product'}
          </CardTitle>
          <Badge variant="outline" className="ml-2">
            Batch #{index + 1}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              <span>{batch.boxes_count} boxes</span>
            </div>
            <div className="flex items-center gap-1">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span>{batch.quantity_per_box} per box</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Package2 className="h-4 w-4 text-muted-foreground" />
            <span>Total Quantity: <strong>{totalQuantity}</strong></span>
          </div>
          
          <div className="flex items-center gap-1 text-sm">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            <span>{batch.warehouse?.name || 'Unknown Warehouse'}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {batch.warehouseLocation ? 
                `Floor ${batch.warehouseLocation.floor}, Zone ${batch.warehouseLocation.zone}` : 
                'Unknown Location'}
            </span>
          </div>
          
          {(batch.color || batch.size) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {batch.color && (
                <div className="flex items-center gap-1">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span>{batch.color}</span>
                </div>
              )}
              {batch.size && (
                <div className="flex items-center gap-1">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span>{batch.size}</span>
                </div>
              )}
            </div>
          )}
          
          {showBarcodes && batch.barcodes && batch.barcodes.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">First box barcode preview:</p>
              <div className="flex justify-center p-2 bg-white rounded">
                <BarcodePreview barcode={batch.barcodes[0]} width={180} height={50} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(index)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="flex-1"
            onClick={() => onDelete(index)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
