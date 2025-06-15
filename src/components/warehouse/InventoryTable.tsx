import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { InventoryItem } from '@/hooks/useInventoryData';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ArrowUp, ArrowDown, MapPin } from 'lucide-react';

// Updated to remove warehouseName as it will now be part of the location details
type SortableField = 'barcode' | 'productName' | 'locationDetails' | 'quantity' | 'status';

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  highlightedBarcode: string | null;
  highlightedItemIds?: string[];
  onSort?: (field: SortableField) => void;
  sortField?: SortableField;
  sortDirection?: 'asc' | 'desc';
  onViewLocations?: (item: InventoryItem) => void;
  showBatchDetails?: boolean;
  expandedProducts?: Record<string, boolean>;
  batchData?: Record<string, any[]>;
  onToggleExpand?: (productId: string) => void;
}

interface LocationDetail {
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  zone: string;
  floor: string;
  quantity: number;
}

interface SelectedLocationState {
  isOpen: boolean;
  details: LocationDetail[];
  productName: string;
  productSku: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventoryItems = [],
  isLoading = false,
  error = null,
  highlightedBarcode = null,
  highlightedItemIds = [],
  onSort,
  sortField = 'productName',
  sortDirection = 'asc',
  onViewLocations,
  showBatchDetails = false,
  expandedProducts = {},
  batchData = {},
  onToggleExpand,
}) => {
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  
  const [selectedLocationDetails, setSelectedLocationDetails] = useState<SelectedLocationState>({
    isOpen: false,
    details: [],
    productName: '',
    productSku: ''
  });

  const handleViewLocations = useCallback((item: InventoryItem) => {
    // Always show the modal, even if there are no location details
    let locationDetails: LocationDetail[] = [];
    
    // Process location details if they exist
    if (item.allLocationDetails && Array.isArray(item.allLocationDetails)) {
      // Filter out any null or undefined entries and ensure all fields have valid values
      locationDetails = item.allLocationDetails
        .filter(loc => loc !== null && loc !== undefined)
        .map(loc => ({
          warehouseId: loc.warehouseId || '',
          warehouseName: loc.warehouseName || 'Unknown',
          locationId: loc.locationId || 'N/A',
          zone: loc.zone || 'N/A',
          floor: loc.floor || 'N/A',
          quantity: typeof loc.quantity === 'number' ? loc.quantity : 0
        }));
    }
    
    // If we still have no location details, create a default one to ensure the modal shows something
    if (locationDetails.length === 0) {
      locationDetails = [{
        warehouseId: '',
        warehouseName: 'Default Warehouse',
        locationId: 'Default Location',
        zone: 'N/A',
        floor: 'N/A',
        quantity: 0
      }];
    }
    
    console.log('Opening location modal with details:', locationDetails);
    console.log('Item data:', item);
    console.log('Item allLocationDetails:', item.allLocationDetails);
    
    // Set the state to open the modal
    setSelectedLocationDetails({
      isOpen: true,
      details: locationDetails,
      productName: item.productName || 'Unknown Product',
      productSku: item.productSku || 'N/A'
    });
  }, []);

  const closeLocationModal = useCallback(() => {
    setSelectedLocationDetails(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  useEffect(() => {
    if (highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedBarcode]);

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Error loading inventory data: {error.message}</p>
      </div>
    );
  }

  if (!isLoading && (!inventoryItems || inventoryItems.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>No inventory items found</p>
      </div>
    );
  }

  const renderSortIndicator = (field: SortableField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-3 w-3 ml-1 inline" /> : 
      <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="animate-pulse">
        <TableCell><div className="h-4 bg-muted rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-muted rounded"></div></TableCell>
        <TableCell><div className="h-4 bg-muted rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-muted rounded w-1/4"></div></TableCell>
        <TableCell><div className="h-4 bg-muted rounded w-1/2"></div></TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="relative overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort?.('barcode')}
            >
              Barcode {renderSortIndicator('barcode')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort?.('productName')}
            >
              Product {renderSortIndicator('productName')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort?.('locationDetails')}
            >
              Location {renderSortIndicator('locationDetails')}
            </TableHead>
            <TableHead 
              className="cursor-pointer text-right"
              onClick={() => onSort?.('quantity')}
            >
              Qty {renderSortIndicator('quantity')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort?.('status')}
            >
              Status {renderSortIndicator('status')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            renderSkeletonRows()
          ) : (
            inventoryItems.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow
                  data-item-id={item.id}
                  className={`${highlightedBarcode === item.barcode || highlightedItemIds.includes(item.id) ? 'bg-primary/10' : ''} ${showBatchDetails ? 'cursor-pointer' : ''}`}
                  onClick={showBatchDetails && onToggleExpand ? () => onToggleExpand(item.id) : undefined}
                >
                  <TableCell className="font-mono text-xs">
                    {item.barcode}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.productSku && <span>SKU: {item.productSku}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleViewLocations(item)}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      View Locations
                    </Button>
                    {item.allLocationDetails && item.allLocationDetails.length > 0 && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {item.allLocationDetails.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
                
                {/* Batch Details Row - Only shown when expanded */}
                {showBatchDetails && expandedProducts && expandedProducts[item.id] && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-4">
                        <h4 className="text-sm font-medium mb-2">Batch Details for {item.productName}</h4>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/6">Batch ID</TableHead>
                                <TableHead className="w-1/6">Quantity</TableHead>
                                <TableHead className="w-1/4">Warehouse</TableHead>
                                <TableHead className="w-1/4">Location</TableHead>
                                <TableHead className="w-1/6">Created Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batchData && batchData[item.id] ? (
                                batchData[item.id].length > 0 ? (
                                  batchData[item.id].map((batch) => (
                                    <TableRow key={batch.id}>
                                      <TableCell className="font-mono text-xs">
                                        {batch.batch_id ? batch.batch_id.substring(0, 8) + '...' : 'N/A'}
                                      </TableCell>
                                      <TableCell>{batch.quantity || 0}</TableCell>
                                      <TableCell>{batch.warehouses?.name || 'Unknown'}</TableCell>
                                      <TableCell>
                                        {batch.warehouse_locations?.name || 'Unknown'}
                                        {batch.warehouse_locations ? (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            (Floor {batch.warehouse_locations.floor}, Zone {batch.warehouse_locations.zone})
                                          </span>
                                        ) : null}
                                      </TableCell>
                                      <TableCell>
                                        {batch.processed_batches?.created_at 
                                          ? new Date(batch.processed_batches.created_at).toLocaleDateString() 
                                          : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                      No batch data available for this product
                                    </TableCell>
                                  </TableRow>
                                )
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-4">
                                    <div className="flex items-center justify-center space-x-2">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                      <span>Loading batch data...</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>

      {selectedLocationDetails.isOpen && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) closeLocationModal();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedLocationDetails.productName} ({selectedLocationDetails.productSku}) Locations</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLocationDetails.details.length > 0 ? (
                    selectedLocationDetails.details.map((location, index) => (
                      <TableRow key={`${location.locationId}-${index}`}>
                        <TableCell>{location.warehouseName}</TableCell>
                        <TableCell>{location.locationId}</TableCell>
                        <TableCell>{location.floor}</TableCell>
                        <TableCell>{location.zone}</TableCell>
                        <TableCell className="text-right">{location.quantity}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No location details available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InventoryTable;
