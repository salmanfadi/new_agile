
import React, { useRef, useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InventoryItem } from '@/hooks/useInventoryData';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Search, Info, ExternalLink, History, Truck, ArrowDown, ArrowUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { InventoryMovement } from '@/types/inventory';

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  highlightedBarcode: string | null;
  onSort?: (field: keyof InventoryItem) => void;
  sortField?: keyof InventoryItem;
  sortDirection?: 'asc' | 'desc';
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventoryItems,
  isLoading,
  error,
  highlightedBarcode,
  onSort,
  sortField,
  sortDirection,
}) => {
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const navigate = useNavigate();
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [showItemHistory, setShowItemHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [itemHistory, setItemHistory] = useState<InventoryMovement[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    // Scroll to highlighted row when it changes
    if (highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedBarcode]);

  const fetchBatchDetails = async (batchId: string) => {
    setIsBatchLoading(true);
    try {
      // Fetch the stock-in record with related data
      const { data: stockInData, error: stockInError } = await supabase
        .from('stock_in')
        .select(`
          id,
          product_id,
          submitted_by,
          processed_by,
          boxes,
          status,
          created_at,
          source,
          notes,
          products:product_id(name),
          submitter:submitted_by(name, username),
          processor:processed_by(name, username)
        `)
        .eq('id', batchId)
        .single();

      if (stockInError) throw stockInError;

      // Fetch all inventory items in this batch
      const { data: batchItems, error: batchItemsError } = await supabase
        .from('inventory')
        .select('*')
        .eq('batch_id', batchId);

      if (batchItemsError) throw batchItemsError;

      setSelectedBatch({
        ...stockInData,
        inventoryItems: batchItems,
        itemCount: batchItems?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching batch details:', error);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const fetchItemHistory = async (itemId: string) => {
    setIsHistoryLoading(true);
    try {
      // Get the inventory item first to get the barcode
      const { data: inventoryItem } = await supabase
        .from('inventory')
        .select('barcode')
        .eq('id', itemId)
        .single();

      if (!inventoryItem) throw new Error("Item not found");

      // Use inventory_movements with details containing barcode
      const { data: movements, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('*')
        .contains('details', { barcode: inventoryItem.barcode })
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;

      // Convert the data to match the InventoryMovement type
      const typedMovements: InventoryMovement[] = movements?.map(item => {
        // Parse details if it's a string
        let parsedDetails: any = {};
        if (typeof item.details === 'string') {
          try {
            parsedDetails = JSON.parse(item.details);
          } catch (err) {
            parsedDetails = {};
          }
        } else {
          parsedDetails = item.details || {};
        }
        
        return {
          ...item,
          details: parsedDetails
        } as InventoryMovement;
      }) || [];

      setItemHistory(typedMovements);
    } catch (error) {
      console.error('Error fetching item history:', error);
      setItemHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const viewBatchDetails = (batchId: string | null) => {
    if (batchId) {
      setShowBatchDetails(true);
      fetchBatchDetails(batchId);
    }
  };

  const viewItemHistory = (itemId: string) => {
    setSelectedItem(itemId);
    setShowItemHistory(true);
    fetchItemHistory(itemId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <div className="ml-2">Loading inventory data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Error loading inventory data: {error.message}</p>
        <p className="text-sm mt-2 text-slate-500">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (inventoryItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        <p className="mb-2">No inventory items found</p>
        <p className="text-sm text-slate-400">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {onSort ? (
                <div 
                  className="flex items-center cursor-pointer" 
                  onClick={() => onSort('productName')}
                >
                  Product
                  {sortField === 'productName' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              ) : (
                "Product"
              )}
            </TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>
              {onSort ? (
                <div 
                  className="flex items-center cursor-pointer" 
                  onClick={() => onSort('quantity')}
                >
                  Quantity
                  {sortField === 'quantity' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              ) : (
                "Quantity"
              )}
            </TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead className="text-right">
              {onSort ? (
                <div 
                  className="flex items-center cursor-pointer justify-end" 
                  onClick={() => onSort('lastUpdated')}
                >
                  Last Updated
                  {sortField === 'lastUpdated' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              ) : (
                "Last Updated"
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItems.map((item) => (
            <TableRow 
              key={item.id}
              ref={item.barcode === highlightedBarcode ? highlightedRowRef : null}
              className={item.barcode === highlightedBarcode ? "bg-blue-50 dark:bg-blue-900/20" : ""}
            >
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell>
                {item.barcode === highlightedBarcode ? (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    {item.barcode}
                  </Badge>
                ) : (
                  item.barcode
                )}
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.warehouseName}</TableCell>
              <TableCell>{item.locationDetails}</TableCell>
              <TableCell><StatusBadge status={item.status} /></TableCell>
              <TableCell>{item.color || '-'}</TableCell>
              <TableCell>{item.size || '-'}</TableCell>
              <TableCell>
                {/* Modified to handle potentially missing source property */}
                {item.source ? (
                  <Badge variant="outline" className="text-xs">
                    <Truck className="h-3 w-3 mr-1" />
                    {item.source}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {item.batchId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => viewBatchDetails(item.batchId)}
                            className="h-7 w-7 p-0"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>View batch details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewItemHistory(item.id)}
                          className="h-7 w-7 p-0"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>View item history</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {item.lastUpdated}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Batch Details Dialog */}
      <Dialog open={showBatchDetails} onOpenChange={setShowBatchDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              Information about this inventory batch
            </DialogDescription>
          </DialogHeader>
          
          {isBatchLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <div className="ml-2">Loading batch details...</div>
            </div>
          ) : selectedBatch ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Batch ID:</div>
                <div className="text-sm text-slate-600 font-mono">{selectedBatch.id}</div>
                
                <div className="text-sm font-medium">Product:</div>
                <div className="text-sm text-slate-600">{selectedBatch.products?.name || 'Unknown'}</div>
                
                <div className="text-sm font-medium">Created:</div>
                <div className="text-sm text-slate-600">{new Date(selectedBatch.created_at).toLocaleString()}</div>
                
                <div className="text-sm font-medium">Status:</div>
                <div className="text-sm">
                  <StatusBadge status={selectedBatch.status} />
                </div>
                
                <div className="text-sm font-medium">Source:</div>
                <div className="text-sm text-slate-600">{selectedBatch.source}</div>
                
                <div className="text-sm font-medium">Submitted By:</div>
                <div className="text-sm text-slate-600">
                  {selectedBatch.submitter?.name || 'Unknown'}
                </div>
                
                <div className="text-sm font-medium">Processed By:</div>
                <div className="text-sm text-slate-600">
                  {selectedBatch.processor?.name || 'Not processed yet'}
                </div>
                
                <div className="text-sm font-medium">Total Items:</div>
                <div className="text-sm text-slate-600">{selectedBatch.itemCount}</div>
              </div>
              
              {selectedBatch.notes && (
                <div className="mt-4">
                  <div className="text-sm font-medium">Notes:</div>
                  <div className="text-sm text-slate-600 mt-1 p-2 bg-slate-50 rounded-md">
                    {selectedBatch.notes}
                  </div>
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowBatchDetails(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">No batch information available</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Item History Dialog */}
      <Dialog open={showItemHistory} onOpenChange={setShowItemHistory}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Item History</DialogTitle>
            <DialogDescription>
              Activity history for this inventory item
            </DialogDescription>
          </DialogHeader>
          
          {isHistoryLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <div className="ml-2">Loading item history...</div>
            </div>
          ) : itemHistory.length > 0 ? (
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {itemHistory.map((movement, index) => (
                  <div key={index} className="mb-3 border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">
                        {movement.movement_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(movement.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    {movement.details && (
                      <div className="mt-1 text-sm text-slate-600">
                        <pre className="font-mono text-xs bg-slate-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(movement.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowItemHistory(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">No history records found for this item</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
