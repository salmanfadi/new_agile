
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Inventory, Warehouse, Product } from '@/types/database';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Search, Filter, Scan } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';

// Define a type for the extended inventory data that comes from the query
interface ExtendedInventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  batch_id: string | null;
  product: { name: string };
  warehouse: { name: string };
  warehouse_location: { floor: number; zone: string };
}

const InventoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const queryClient = useQueryClient();
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  
  // Fetch warehouses for filter
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*');
        
      if (error) throw error;
      return data as Warehouse[];
    }
  });
  
  // Fetch batch IDs for filter
  const { data: batchIds = [] } = useQuery({
    queryKey: ['batch-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in_details')
        .select('batch_id')
        .is('batch_id', 'not.null')
        .order('batch_id')
        .distinct();
        
      if (error) {
        console.error('Error fetching batch IDs:', error);
        return [];
      }
      
      return data.map(d => d.batch_id).filter(Boolean);
    }
  });
  
  // Fetch inventory with product and location details
  const inventoryQuery = useQuery({
    queryKey: ['inventory', warehouseFilter, batchFilter],
    queryFn: async () => {
      console.log('Fetching inventory data with filters:', { warehouseFilter, batchFilter });
      let query = supabase
        .from('inventory')
        .select(`
          *,
          product:product_id(name),
          warehouse:warehouse_id(name),
          warehouse_location:location_id(floor, zone)
        `);
        
      if (warehouseFilter) {
        query = query.eq('warehouse_id', warehouseFilter);
      }
      
      if (batchFilter) {
        query = query.eq('batch_id', batchFilter);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
        
      if (error) throw error;
      return data as unknown as ExtendedInventory[];
    }
  });
  
  // Handle barcode scanned
  const handleBarcodeScanned = async (barcode: string) => {
    setIsScannerOpen(false);
    setHighlightedBarcode(barcode);
    
    // Invalidate query to ensure we have the latest data
    await queryClient.invalidateQueries({ queryKey: ['inventory', warehouseFilter, batchFilter] });
    
    // Find item matching barcode
    const item = inventoryQuery.data?.find(item => item.barcode === barcode);
    
    if (item) {
      toast({
        title: 'Item Found',
        description: `Found ${item.product.name} in ${item.warehouse.name}`,
      });
      
      // Set timeout to allow the query to complete and DOM to update
      setTimeout(() => {
        if (highlightedRowRef.current) {
          highlightedRowRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    } else {
      toast({
        title: 'Item Not Found',
        description: `No inventory item with barcode ${barcode} was found.`,
        variant: 'destructive'
      });
    }
  };

  // Set up real-time subscription for inventory changes
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('inventory-changes-manager')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Inventory change detected in manager view:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Inventory Item',
              description: 'A new item has been added to inventory',
            });
          }
          
          // Refresh inventory data
          queryClient.invalidateQueries({ queryKey: ['inventory', warehouseFilter, batchFilter] });
          queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
        })
      .subscribe();

    // Clean up subscription
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, warehouseFilter, batchFilter]);
  
  const filteredInventory = inventoryQuery.data?.filter(item => {
    return (
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];
  
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
              {warehousesQuery.data?.map((warehouse) => (
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <div className="mt-2">Loading inventory...</div>
                  </TableCell>
                </TableRow>
              ) : inventoryQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-red-500">
                    Error loading inventory data
                  </TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow 
                    key={item.id}
                    ref={item.barcode === highlightedBarcode ? highlightedRowRef : null}
                    className={item.barcode === highlightedBarcode ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                  >
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>
                      <span className={item.barcode === highlightedBarcode ? "font-bold text-blue-600" : ""}>
                        {item.barcode}
                      </span>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.warehouse.name}</TableCell>
                    <TableCell>{item.warehouse_location.floor}</TableCell>
                    <TableCell>{item.warehouse_location.zone}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>{item.color || '-'}</TableCell>
                    <TableCell>{item.size || '-'}</TableCell>
                    <TableCell>
                      {item.batch_id ? (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                          {item.batch_id.substring(0, 8)}...
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default InventoryView;
