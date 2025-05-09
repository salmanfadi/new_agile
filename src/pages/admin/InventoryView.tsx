
import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Package, QrCode, BarChart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const AdminInventoryView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [batchFilter, setbatchFilter] = useState("");
  const queryClient = useQueryClient();
  
  // Fetch inventory data
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['admin-inventory-data', statusFilter],
    queryFn: async () => {
      console.log('Fetching inventory data');
      let query = supabase
        .from('inventory')
        .select(`
          id,
          product:product_id(name, description, sku, category),
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
        
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
      
      return data.map(item => ({
        id: item.id,
        productName: item.product?.name || 'Unknown Product',
        productSku: item.product?.sku || 'N/A',
        productCategory: item.product?.category || 'Uncategorized',
        warehouseName: item.warehouse?.name || 'Unknown Warehouse',
        warehouseLocation: item.warehouse?.location || '',
        locationDetails: item.location ? `Floor ${item.location.floor}, Zone ${item.location.zone}` : 'Unknown Location',
        barcode: item.barcode,
        quantity: item.quantity,
        color: item.color || '-',
        size: item.size || '-',
        status: item.status || 'available',
        batchId: item.batch_id || null,
        lastUpdated: new Date(item.updated_at).toLocaleString(),
      }));
    }
  });

  // Set up real-time subscription for inventory changes
  useEffect(() => {
    // Create and subscribe to the Supabase channel
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
        })
      .subscribe();

    // Clean up channel subscription when component unmounts
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);
  
  // Filter inventory based on search term
  const filteredInventory = searchTerm
    ? inventoryItems.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : inventoryItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="View and manage current inventory across all warehouses"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Button asChild variant="outline">
            <Link to="/admin/barcodes">
              <QrCode className="mr-2 h-4 w-4" />
              Barcode Management
            </Link>
          </Button>
          
          <Button asChild>
            <Link to="/admin/stock-in/batch">
              <BarChart className="mr-2 h-4 w-4" />
              Batch Processing
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            placeholder="Search by product, SKU, category, warehouse, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectGroup>
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
              {searchTerm || statusFilter ? 'No inventory items match your search criteria.' : 'No inventory items found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50">
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.productSku}</TableCell>
                      <TableCell>{item.productCategory}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{item.barcode}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.locationDetails}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.color !== '-' || item.size !== '-' ? (
                          <div className="text-xs">
                            {item.color !== '-' && <span className="mr-1">Color: {item.color}</span>}
                            {item.size !== '-' && <span>Size: {item.size}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-500">{item.lastUpdated}</TableCell>
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
