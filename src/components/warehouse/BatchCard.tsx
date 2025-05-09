
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProcessedBatch } from '@/types/batchStockIn';
import { Pencil, Trash2, EyeOff, Eye } from 'lucide-react';

interface BatchCardProps {
  batch: ProcessedBatch;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  showBarcodes?: boolean;
  disabled?: boolean;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  index,
  onEdit,
  onDelete,
  showBarcodes = false,
  disabled = false
}) => {
  const [showAllBarcodes, setShowAllBarcodes] = useState(false);

  const displayBarcodes = batch.barcodes || [];
  const initialDisplayCount = 3;
  const hasMoreBarcodes = displayBarcodes.length > initialDisplayCount;
  
  const barcodesToShow = showAllBarcodes 
    ? displayBarcodes 
    : displayBarcodes.slice(0, initialDisplayCount);

  return (
    <Card className="apple-shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-lg">Batch {index + 1}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {batch.product?.name || 'Unknown Product'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{batch.boxes_count} boxes</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {batch.quantity_per_box} items per box
            </p>
          </div>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Warehouse</p>
            <p className="text-sm">{batch.warehouse?.name || 'Unknown Warehouse'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
            <p className="text-sm">
              {batch.warehouseLocation 
                ? `Floor ${batch.warehouseLocation.floor}, Zone ${batch.warehouseLocation.zone}` 
                : 'Unknown Location'}
            </p>
          </div>

          {batch.color && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Color</p>
              <p className="text-sm">{batch.color}</p>
            </div>
          )}

          {batch.size && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Size</p>
              <p className="text-sm">{batch.size}</p>
            </div>
          )}
        </div>

        {showBarcodes && batch.barcodes && batch.barcodes.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Barcodes</p>
              {hasMoreBarcodes && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setShowAllBarcodes(!showAllBarcodes)}
                  disabled={disabled}
                >
                  {showAllBarcodes ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show All ({displayBarcodes.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="mt-1 space-y-1">
              {barcodesToShow.map((barcode, idx) => (
                <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded">
                  {barcode}
                </div>
              ))}
              {!showAllBarcodes && hasMoreBarcodes && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  + {displayBarcodes.length - initialDisplayCount} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex justify-end gap-2">
        <Button 
          size="sm" 
          variant="outline"
          className="h-8" 
          onClick={onEdit}
          disabled={disabled}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onDelete}
          disabled={disabled}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
