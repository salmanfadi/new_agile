
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Scan, RefreshCcw, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Badge } from '@/components/ui/badge';

interface InventoryFiltersPanelProps {
  onBarcodeScanned: (barcode: string) => void;
  onRefresh: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  warehouseFilter: string;
  setWarehouseFilter: (id: string) => void;
  batchFilter: string;
  setBatchFilter: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  warehouses: any[];
  batchIds: any[];
  availableStatuses: { value: string, label: string }[];
  onResetFilters?: () => void;
}

export const InventoryFiltersPanel: React.FC<InventoryFiltersPanelProps> = ({
  onBarcodeScanned,
  onRefresh,
  searchTerm,
  setSearchTerm,
  warehouseFilter,
  setWarehouseFilter,
  batchFilter,
  setBatchFilter,
  statusFilter,
  setStatusFilter,
  warehouses,
  batchIds,
  availableStatuses,
  onResetFilters
}) => {
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  
  const handleBarcodeScanned = (barcode: string) => {
    setIsScannerOpen(false);
    onBarcodeScanned(barcode);
  };

  // Check if there are any active filters
  const hasActiveFilters = searchTerm || warehouseFilter || batchFilter || statusFilter;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="w-full lg:w-1/3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by product, barcode or source"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0" 
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="w-full lg:w-1/6">
          <Select
            value={warehouseFilter}
            onValueChange={setWarehouseFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Warehouses</SelectItem>
              {warehouses?.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full lg:w-1/6">
          <Select
            value={batchFilter}
            onValueChange={setBatchFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Batches</SelectItem>
              {batchIds.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.source ? `${batch.source.substring(0, 8)}...` : `Batch: ${batch.id.substring(0, 8)}...`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full lg:w-1/6">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full lg:w-auto flex gap-2">
          <Sheet open={isScannerOpen} onOpenChange={setIsScannerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Scan className="mr-2 h-4 w-4" />
                Scan Barcode
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Scan Barcode</SheetTitle>
                <SheetDescription>
                  Scan a barcode to find the corresponding inventory item
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <BarcodeScanner
                  allowManualEntry={true}
                  allowCameraScanning={true}
                  onBarcodeScanned={handleBarcodeScanned}
                />
              </div>
            </SheetContent>
          </Sheet>
          
          <Button variant="ghost" onClick={onRefresh} title="Refresh data">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          
          {hasActiveFilters && onResetFilters && (
            <Button variant="ghost" onClick={onResetFilters} title="Clear all filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Display active filters as badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchTerm}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
            </Badge>
          )}
          
          {warehouseFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Warehouse: {warehouses.find(w => w.id === warehouseFilter)?.name || warehouseFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setWarehouseFilter('')} />
            </Badge>
          )}
          
          {batchFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Batch: {batchIds.find(b => b.id === batchFilter)?.source || batchFilter.substring(0, 8)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setBatchFilter('')} />
            </Badge>
          )}
          
          {statusFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {availableStatuses.find(s => s.value === statusFilter)?.label || statusFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('')} />
            </Badge>
          )}
          
          {onResetFilters && (
            <Button variant="link" size="sm" className="text-xs" onClick={onResetFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </>
  );
};
