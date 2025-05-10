
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Scan } from 'lucide-react';
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
import { useInventoryData } from '@/hooks/useInventoryData';
import { toast } from '@/hooks/use-toast';
import { InventoryTable } from '@/components/warehouse/InventoryTable';
import { useQueryClient } from '@tanstack/react-query';

const InventoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Use shared inventory hook
  const { 
    inventoryItems, 
    isLoading, 
    error, 
    warehouses, 
    batchIds 
  } = useInventoryData(warehouseFilter, batchFilter, searchTerm);
  
  // Handle barcode scanned
  const handleBarcodeScanned = async (barcode: string) => {
    setIsScannerOpen(false);
    setHighlightedBarcode(barcode);
    
    // Invalidate query to ensure we have the latest data
    await queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
    
    // Find item matching barcode
    const item = inventoryItems?.find(item => item.barcode === barcode);
    
    if (item) {
      toast({
        title: 'Item Found',
        description: `Found ${item.productName} in ${item.warehouseName}`,
      });
    } else {
      toast({
        title: 'Item Not Found',
        description: `No inventory item with barcode ${barcode} was found.`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory" 
        description="View inventory across all warehouses"
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by product name or barcode"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        
        <div className="w-full md:w-1/4">
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
        
        <div className="w-full md:w-1/4">
          <Select
            value={batchFilter}
            onValueChange={setBatchFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Batches</SelectItem>
              {batchIds.map((batchId: string) => (
                <SelectItem key={batchId} value={batchId}>
                  Batch: {batchId.substring(0, 8)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
      </div>
      
      <Card>
        <InventoryTable 
          inventoryItems={inventoryItems} 
          isLoading={isLoading} 
          error={error as Error | null}
          highlightedBarcode={highlightedBarcode}
        />
      </Card>
    </div>
  );
};

export default InventoryView;
