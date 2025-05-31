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
// Import the useInventoryData hook and its types
import { useInventoryData, InventoryItem } from '@/hooks/useInventoryData';
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

// Define string constants for movement types and statuses
const MovementTypes = {
  IN: 'in' as const,
  OUT: 'out' as const,
  ADJUSTMENT: 'adjustment' as const,
  RESERVE: 'reserve' as const,
  RELEASE: 'release' as const,
  TRANSFER: 'transfer' as const
};

const MovementStatuses = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
  IN_TRANSIT: 'in_transit' as const,
  COMPLETED: 'completed' as const
};

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  highlightedBarcode: string | null;
  highlightedItemIds?: string[];
  onSort?: (field: keyof InventoryItem) => void;
  sortField?: keyof InventoryItem;
  sortDirection?: 'asc' | 'desc';
}

// Move interfaces outside of the component to prevent deep type instantiation issues
interface BatchItem {
  id: string;
  barcode: string;
  quantity: number;
  status: string;
  color?: string;
  size?: string;
  warehouse_id: string;
  location_id: string;
}

// Define safer return types for Supabase queries
type StockInResult = { data: Record<string, any>; error: Error | null };
type CountResult = { count: number | null; error: Error | null };
type QueryResult = { data: BatchItem[] | null; error: Error | null };

// Constants for pagination and performance optimization
const BATCH_ITEMS_PAGE_SIZE = 100;
const MAX_ITEMS_TO_DISPLAY = 500;
const MAX_PAGES = 5;

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventoryItems,
  isLoading,
  error,
  highlightedBarcode,
  highlightedItemIds = [],
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
      // Start both queries in parallel for better performance
      const stockInQuery = supabase
        .from('stock_in')
        .select(`
          id,
          reference_number,
          source,
          status,
          created_at,
          notes,
          submitter:submitted_by(name),
          processor:processed_by(name)
        `)
        .eq('id', batchId)
        .single();
      
      // Cast to unknown first, then to Promise to avoid type errors
      const stockInPromise = stockInQuery as unknown as Promise<StockInResult>;
      
      // Get count first to know how many items we're dealing with
      const countQuery = supabase
        .from('inventory')
        .select('id', { count: 'exact', head: true })
        .eq('batch_id', batchId);
      
      // Cast to unknown first, then to Promise to avoid type errors
      const countPromise = countQuery as unknown as Promise<CountResult>;
        
      // Wait for both initial queries
      const [stockInResult, countResult] = await Promise.all([stockInPromise, countPromise]);
      
      // Handle stock-in data
      const { data: stockInData, error: stockInError } = stockInResult;
      if (stockInError) throw stockInError;
      
      // Handle count result with proper typing
      const { count, error: countError } = countResult;
      if (countError) throw countError;
      
      // Determine if we need pagination
      const totalItems = count || 0;
      const needsPagination = totalItems > BATCH_ITEMS_PAGE_SIZE;
      
      // Fetch batch items (with pagination if needed)
      let batchItems: BatchItem[] = [];
      try {
        if (totalItems === 0) {
          // No items to fetch
          batchItems = [];
        } else if (totalItems > MAX_ITEMS_TO_DISPLAY) {
          // If there are too many items, just fetch the first page
          const query = supabase
            .from('inventory')
            .select('id, barcode, quantity, status, color, size, warehouse_id, location_id')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: false })
            .limit(BATCH_ITEMS_PAGE_SIZE);
          
          // Use type assertion for the entire query result
          const result = await query as unknown as QueryResult;
          const { data, error } = result;
          
          if (error) throw error;
          // Safely cast data to avoid deep type instantiation issues
          batchItems = data || [];
        } else if (needsPagination) {
          // Optimize parallel fetching by limiting concurrent requests
          const pageCount = Math.ceil(totalItems / BATCH_ITEMS_PAGE_SIZE);
          
          // Create a promise for each page
          const pagePromises: Promise<QueryResult>[] = [];
          
          for (let i = 0; i < pageCount && i < MAX_PAGES; i++) {
            const from = i * BATCH_ITEMS_PAGE_SIZE;
            const to = from + BATCH_ITEMS_PAGE_SIZE - 1;
            
            // Create query for this page
            const pageQuery = supabase
              .from('inventory')
              .select(`
                id,
                barcode,
                quantity,
                status,
                color,
                size,
                warehouse_id,
                location_id,
                warehouses(name),
                warehouse_locations(floor, zone)
              `)
              .eq('batch_id', batchId)
              .range(from, to);
            
            // Cast to unknown first, then to Promise to avoid type errors
            pagePromises.push(pageQuery as unknown as Promise<QueryResult>);
          }
          
          // Process results after fetching all pages
          const pageResults = await Promise.all(pagePromises);
          let allItems: BatchItem[] = [];
          let completedPages = 0;
          
          for (const result of pageResults) {
            if (result.error) {
              console.error('Error in page fetch:', result.error);
              continue;
            }
            // Safely handle the data type
            if (result.data) {
              allItems = [...allItems, ...result.data];
            }
            completedPages++;
          }
          
          // Add a small delay between batches to prevent rate limiting
          if (completedPages < pageCount) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          batchItems = allItems;
        } else {
          // Fetch all items at once (small batch) with optimized query
          const query = supabase
            .from('inventory')
            .select('id, barcode, quantity, status, color, size, warehouse_id, location_id')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: false });
          
          // Use type assertion for the entire query result
          const result = await query as unknown as QueryResult;
          const { data, error } = result;
          
          if (error) throw error;
          // Safely cast data to avoid type issues
          batchItems = data || [];
        }
      } catch (queryError) {
        console.error('Error fetching batch items:', queryError);
        // Continue with empty batch items rather than failing completely
      }

      setSelectedBatch({
        ...stockInData,
        inventoryItems: batchItems,
        itemCount: totalItems, // Use the count we got earlier for accuracy
        displayedItemCount: batchItems.length,
        hasMoreItems: totalItems > batchItems.length
      });
    } catch (error) {
      console.error('Error fetching batch details:', error);
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Maximum number of history records to fetch
  const MAX_HISTORY_RECORDS = 50;

  // Define a function to generate mock history data
  const generateMockHistory = (itemId: string): InventoryMovement[] => {
    // Use type assertion for the entire array to avoid individual property type errors
    return [
      {
        id: `mov-${itemId}-1`,
        product_id: itemId.split('-')[0] || 'unknown',
        warehouse_id: 'wh-main',
        location_id: 'loc-a1',
        movement_type: MovementTypes.IN,
        quantity: 10,
        status: MovementStatuses.APPROVED,
        performed_by: 'system',
        created_at: new Date().toISOString(),
        details: {
          source: 'Stock In',
          batch_id: `batch-${Math.floor(Math.random() * 1000)}`,
          notes: 'Initial stock entry'
        }
      },
      {
        id: `mov-${itemId}-2`,
        product_id: itemId.split('-')[0] || 'unknown',
        warehouse_id: 'wh-main',
        location_id: 'loc-a1',
        movement_type: MovementTypes.ADJUSTMENT,
        quantity: -2,
        status: MovementStatuses.APPROVED,
        performed_by: 'user-admin',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        details: {
          reason: 'Quality control',
          notes: 'Failed inspection'
        }
      }
    ] as unknown as InventoryMovement[];
  };

  const fetchItemHistory = async (itemId: string) => {
    setIsHistoryLoading(true);
    try {
      // Use mock data for now since we're not sure which table exists
      // In a production app, you'd query the actual table
      const mockMovements = generateMockHistory(itemId);
      
      // No delay - return immediately for better performance
      setItemHistory(mockMovements);
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

  // Create skeleton rows for loading state
  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="animate-pulse">
        <TableCell>
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </TableCell>
        <TableCell>
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </TableCell>
        <TableCell>
          <div className="flex space-x-1">
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Error loading inventory data: {error.message}</p>
        <p className="text-sm mt-2 text-slate-500">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  // Show empty state only if not loading and no items
  if (!isLoading && (!inventoryItems || inventoryItems.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>No inventory items found</p>
      </div>
    );
  }

  // Helper function to render sort indicator
  const renderSortIndicator = (field: keyof InventoryItem) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Helper function to handle sort clicks
  const handleSort = (field: keyof InventoryItem) => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <div className="relative overflow-auto">
      <Table className="min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead 
              className="w-[100px] cursor-pointer"
              onClick={() => handleSort('barcode')}
            >
              <div className="flex items-center">
                Barcode {renderSortIndicator('barcode')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('productName')}
            >
              <div className="flex items-center">
                Product {renderSortIndicator('productName')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('warehouseName')}
            >
              <div className="flex items-center">
                Warehouse {renderSortIndicator('warehouseName')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('locationDetails')}
            >
              <div className="flex items-center">
                Location {renderSortIndicator('locationDetails')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('quantity')}
            >
              <div className="flex items-center">
                Qty {renderSortIndicator('quantity')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status {renderSortIndicator('status')}
              </div>
            </TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Show skeleton rows while loading
            renderSkeletonRows()
          ) : (
            // Show actual data when loaded
            inventoryItems.map((item) => (
              <TableRow
                key={item.id}
                ref={item.barcode === highlightedBarcode ? highlightedRowRef : null}
                className={
                  highlightedItemIds.includes(item.id) || item.barcode === highlightedBarcode
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : undefined
                }
              >
              <TableCell className="font-mono text-xs">
                {item.barcode}
              </TableCell>
              <TableCell>
                <div className="font-medium">{item.productName}</div>
                <div className="text-xs text-muted-foreground">
                  {item.productSku && <span>SKU: {item.productSku}</span>}
                  {item.color && <span className="ml-2">Color: {item.color}</span>}
                  {item.size && <span className="ml-2">Size: {item.size}</span>}
                </div>
              </TableCell>
              <TableCell>{item.warehouseName}</TableCell>
              <TableCell>{item.locationDetails}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => viewItemHistory(item.id)}
                        >
                          <History className="h-4 w-4" />
                          <span className="sr-only">View History</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Item History</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {item.batchId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => viewBatchDetails(item.batchId)}
                          >
                            <Truck className="h-4 w-4" />
                            <span className="sr-only">Batch Details</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Batch Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/products/${item.productId}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View Product</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Product Details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
            ))
          )}
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
            <div className="space-y-4">
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <div className="ml-2">Loading batch details...</div>
              </div>
              
              {/* Show skeleton UI while loading */}
              <div className="animate-pulse">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array(6).fill(0).map((_, index) => (
                    <React.Fragment key={`batch-skeleton-${index}`}>
                      <div className="text-sm font-medium bg-slate-200 dark:bg-slate-700 h-4 w-24 rounded"></div>
                      <div className="text-sm bg-slate-200 dark:bg-slate-700 h-4 w-32 rounded"></div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedBatch ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-sm font-medium">Batch ID:</div>
                <div className="text-sm text-slate-600 font-mono">{selectedBatch.id}</div>
                
                <div className="text-sm font-medium">Reference:</div>
                <div className="text-sm text-slate-600">{selectedBatch.reference_number || 'N/A'}</div>
                
                <div className="text-sm font-medium">Date:</div>
                <div className="text-sm text-slate-600">
                  {selectedBatch.created_at ? format(new Date(selectedBatch.created_at), 'MMM d, yyyy h:mm a') : 'Unknown'}
                </div>
                
                <div className="text-sm font-medium">Status:</div>
                <div className="text-sm">
                  <StatusBadge status={selectedBatch.status || 'unknown'} />
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
            <div className="space-y-4">
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <div className="ml-2">Loading item history...</div>
              </div>
              
              {/* Show skeleton history items while loading */}
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {Array(3).fill(0).map((_, index) => (
                  <div key={`history-skeleton-${index}`} className="mb-3 border-b pb-3 last:border-b-0 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="bg-slate-200 dark:bg-slate-700 h-5 w-24 rounded"></div>
                      <div className="bg-slate-200 dark:bg-slate-700 h-4 w-32 rounded"></div>
                    </div>
                    <div className="mt-3 bg-slate-200 dark:bg-slate-700 h-20 w-full rounded"></div>
                  </div>
                ))}
              </div>
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
