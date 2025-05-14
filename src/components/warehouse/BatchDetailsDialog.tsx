
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';
import { useBatchItems, BatchItemType } from '@/hooks/useProcessedBatches';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatBarcodeForDisplay } from '@/utils/barcodeUtils';

interface BatchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  onPrintBarcodes: () => void;
}

export const BatchDetailsDialog: React.FC<BatchDetailsDialogProps> = ({
  open,
  onOpenChange,
  batchId,
  onPrintBarcodes,
}) => {
  const isMobile = useIsMobile();
  const { data: batchItems, isLoading } = useBatchItems(batchId);

  if (!batchId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "max-w-[95vw] h-[85vh] p-4" : "max-w-4xl"}>
        <DialogHeader>
          <DialogTitle>Batch Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className={isMobile ? "h-[calc(85vh-10rem)]" : "max-h-[70vh]"}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">Batch ID</h3>
                <p className="font-mono text-xs">{batchId}</p>
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={onPrintBarcodes}
                className="flex items-center gap-1"
              >
                <Printer className="h-4 w-4" />
                Print All Barcodes
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Items in Batch ({batchItems?.length || 0})</h3>
              
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : batchItems && batchItems.length > 0 ? (
                <div className="grid gap-3">
                  {batchItems.map((item: BatchItemType) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Barcode</p>
                            <p className="font-mono">{formatBarcodeForDisplay(item.barcode)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p>{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Warehouse</p>
                            <p>{item.warehouses?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p>Floor {item.locations?.floor}, Zone {item.locations?.zone}</p>
                          </div>
                          
                          {item.color && (
                            <div>
                              <p className="text-xs text-gray-500">Color</p>
                              <p>{item.color}</p>
                            </div>
                          )}
                          
                          {item.size && (
                            <div>
                              <p className="text-xs text-gray-500">Size</p>
                              <p>{item.size}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No items found in this batch</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
