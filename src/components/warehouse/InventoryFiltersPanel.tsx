
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Scan, RefreshCcw, X, ChevronDown } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  isLoadingBatches?: boolean;
  isLoadingWarehouses?: boolean;
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
  onResetFilters,
  isLoadingBatches = false,
  isLoadingWarehouses = false
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [batchPopoverOpen, setBatchPopoverOpen] = useState(false);
  
  const handleBarcodeScanned = (barcode: string) => {
    setIsScannerOpen(false);
    onBarcodeScanned(barcode);
  };

  // Get the selected batch name for display
  const getSelectedBatchName = () => {
    if (!batchFilter) return "All Batches";
    
    const selectedBatch = batchIds.find(b => b.id === batchFilter);
    if (!selectedBatch) return "Unknown Batch";
    
    return `${selectedBatch.displayDate}: ${selectedBatch.source.substring(0, 15)}${selectedBatch.source.length > 15 ? '...' : ''}`;
  };

  // Check if there are any active filters
  const hasActiveFilters = searchTerm || warehouseFilter || batchFilter || statusFilter;

  useEffect(() => {
    // Log filters for debugging
    console.log("Current filters:", { searchTerm, warehouseFilter, batchFilter, statusFilter });
  }, [searchTerm, warehouseFilter, batchFilter, statusFilter]);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="w-full lg:w-1/3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by product, SKU, barcode, source, color or size"
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
            disabled={isLoadingWarehouses}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingWarehouses ? "Loading..." : "All Warehouses"} />
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
          {/* Use Popover for batch selection when there are many batches */}
          <Popover open={batchPopoverOpen} onOpenChange={setBatchPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                role="combobox" 
                className="w-full justify-between"
                disabled={isLoadingBatches}
              >
                {isLoadingBatches ? "Loading..." : getSelectedBatchName()}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <ScrollArea className="h-[300px]">
                <div className="p-1">
                  <div 
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onClick={() => {
                      setBatchFilter('');
                      setBatchPopoverOpen(false);
                    }}
                  >
                    All Batches
                  </div>
                  {batchIds.map((batch) => (
                    <div
                      key={batch.id}
                      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                        batch.id === batchFilter ? "bg-accent text-accent-foreground" : ""
                      }`}
                      onClick={() => {
                        setBatchFilter(batch.id);
                        setBatchPopoverOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{batch.displayDate}</span>
                        <span className="text-xs text-muted-foreground">{batch.source || "Unknown Source"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
          
          <Button variant="ghost" onClick={onRefresh} title="Refresh data" className="h-10 w-10 p-0">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          
          {hasActiveFilters && onResetFilters && (
            <Button variant="ghost" onClick={onResetFilters} title="Clear all filters" className="h-10 w-10 p-0">
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
              Warehouse: {warehouses.find(w => w.id === warehouseFilter)?.name || 'Unknown'}
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
