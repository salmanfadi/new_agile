import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Box, AlertCircle } from 'lucide-react';
import { ProcessedBatch } from '@/types/batchStockIn';

// Update the BatchCard component to show validation errors:
export const BatchCard: React.FC<{
  batch: ProcessedBatch;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  showBarcodes?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}> = ({ 
  batch, 
  index, 
  onEdit, 
  onDelete, 
  showBarcodes = false,
  disabled = false,
  hasError = false
}) => {
  return (
    <Card className={`apple-shadow-sm overflow-hidden ${hasError ? 'border-red-300 bg-red-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Box className="h-5 w-5" />
          Batch #{index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Product: {batch.product?.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Warehouse: {batch.warehouse?.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Location: Floor {batch.warehouseLocation?.floor}, Zone {batch.warehouseLocation?.zone}
        </p>
        <p className="text-sm text-muted-foreground">
          Boxes: {batch.boxes_count}, Quantity per Box: {batch.quantity_per_box}
        </p>
        {batch.color && (
          <p className="text-sm text-muted-foreground">
            Color: {batch.color}
          </p>
        )}
        {batch.size && (
          <p className="text-sm text-muted-foreground">
            Size: {batch.size}
          </p>
        )}
        {showBarcodes && batch.barcodes && batch.barcodes.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium">Barcodes:</p>
            <ul className="list-disc list-inside text-xs">
              {batch.barcodes.map((barcode, i) => (
                <li key={i}>{barcode}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      {hasError && (
        <div className="px-6 py-2 bg-red-100 text-red-800 text-xs flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          One or more barcodes in this batch already exist in inventory
        </div>
      )}

      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          disabled={disabled}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={onDelete}
          disabled={disabled}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
