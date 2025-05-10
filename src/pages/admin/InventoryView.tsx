
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { RealtimeChannel } from '@supabase/supabase-js';
import { StatusBadge } from '@/components/ui/StatusBadge';
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

// Define interface for inventory item data
interface InventoryItem {
  id: string;
  productName: string;
  warehouseName: string;
  warehouseLocation: string;
  locationDetails: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
  status: string;
  batchId: string | null;
  lastUpdated: string;
}

const AdminInventoryView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [batchFilter, setBatchFilter] = useState<string>("");
  const queryClient = useQueryClient();
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  
  // Fetch batch IDs for filter
  const { data: batchIds = [] } = useQuery({
    queryKey: ['batch-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in_details')
        .select('id')  // Select the id column which is referenced by batch_id
        .order('id');
        
      if (error) {
        console.error('Error fetching batch IDs:', error);
        return [];
      }
      
      return data.map(d => d.id);
    }
  });
  
  // Fetch inventory data
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['admin-inventory-data', batchFilter],
    queryFn: async () => {
      console.log('Fetching inventory data with batch filter:', batchFilter);
      let query = supabase
        .from('inventory')
        .select(`
          id,
          product:product_id(name, description),
          warehouse:warehouse_id(name, location),
          location:location_id(floor, zone),
          barcode,
          quantity,
          color,
          size,
          created_at,
          updated_at,
          status,
          batch_id
        `);
        
      if (batchFilter) {
        query = query.eq('batch_id', batchFilter);
      }
      
      query = query.order('updated_at', { ascending: false });
        
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
      
      return data.map(item => ({
        id: item.id,
        productName: item.product?.name || 'Unknown Product',
        warehouseName: item.warehouse?.name || 'Unknown Warehouse',
        warehouseLocation: item.warehouse?.location || '',
        locationDetails: item.location ? `Floor ${item.location.floor}, Zone ${item.location.zone}` : 'Unknown Location',
        barcode: item.barcode,
        quantity: item.quantity,
        color: item.color || '-',
        size: item.size || '-',
        status: item.status || 'available',
        batchId: item.batch_id,
        lastUpdated: new Date(item.updated_at).toLocaleString(),
      }));
    }
  });

  // Set up real-time subscription for inventory changes
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Inventory change detected:', payload);
          
          // Show toast notification for inventory changes
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Inventory Item',
              description: 'A new item has been added to inventory',
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Inventory Updated',
              description: 'An inventory item has been updated',
            });
          }
          
          // Invalidate the query to refresh inventory data
          queryClient.invalidateQueries({ queryKey: ['admin-inventory-data'] });
          queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
        })
      .subscribe();

    // Clean up channel subscription when component unmounts
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);
  
  // Handle barcode scanned
  const handleBarcodeScanned = async (barcode: string) => {
    setIsScannerOpen(false);
    setHighlightedBarcode(barcode);
    
    // Invalidate query to ensure we have the latest data
    await queryClient.invalidateQueries({ queryKey: ['admin-inventory-data'] });
    
    // Find item matching barcode
    const item = inventoryItems.find(item => item.barcode === barcode);
    
    if (item) {
      toast({
        title: 'Item Found',
        description: `Found ${item.productName} in ${item.warehouseName}`,
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
  
  // Filter inventory based on search term
  const filteredInventory = searchTerm
    ? inventoryItems.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchId && item.batchId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : inventoryItems;

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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Current Inventory
          </CardTitle>
          <CardDescription>
            Total items: {filteredInventory.length}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || batchFilter ? 'No inventory items match your search criteria.' : 'No inventory items found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Batch ID</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow 
                      key={item.id}
                      ref={item.barcode === highlightedBarcode ? highlightedRowRef : null}
                      className={item.barcode === highlightedBarcode ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                    >
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.locationDetails}</TableCell>
                      <TableCell>
                        <span className={item.barcode === highlightedBarcode ? "font-bold text-blue-600" : ""}>
                          {item.barcode}
                        </span>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        {item.batchId ? (
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                            {item.batchId.substring(0, 8)}...
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.lastUpdated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventoryView;
