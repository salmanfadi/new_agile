
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Package, Search, Scan, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryTable } from '@/components/warehouse/InventoryTable';

const AdminInventoryView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
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
        title="Inventory Management"
        description="View and manage current inventory across all warehouses"
      />
      
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Sheet open={isScannerOpen} onOpenChange={setIsScannerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
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
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by product, warehouse, barcode, or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={batchFilter}
            onValueChange={setBatchFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Batch ID" />
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
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={warehouseFilter}
            onValueChange={setWarehouseFilter}
          >
            <SelectTrigger className="w-[200px]">
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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Current Inventory
          </CardTitle>
          <CardDescription>
            Total items: {inventoryItems.length}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <InventoryTable 
            inventoryItems={inventoryItems} 
            isLoading={isLoading} 
            error={error as Error | null}
            highlightedBarcode={highlightedBarcode}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventoryView;
