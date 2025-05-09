
import React, { useState, useEffect } from 'react';
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
  product: { name: string };
  warehouse: { name: string };
  warehouse_location: { floor: number; zone: string };
}

const InventoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const queryClient = useQueryClient();
  
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
  
  // Fetch inventory with product and location details
  const inventoryQuery = useQuery({
    queryKey: ['inventory', warehouseFilter],
    queryFn: async () => {
      console.log('Fetching inventory data with filter:', warehouseFilter);
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
      
      const { data, error } = await query.order('updated_at', { ascending: false });
        
      if (error) throw error;
      return data as unknown as ExtendedInventory[];
    }
  });

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
          queryClient.invalidateQueries({ queryKey: ['inventory', warehouseFilter] });
        })
      .subscribe();

    // Clean up subscription
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, warehouseFilter]);
  
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
        <div className="w-full md:w-1/2">
          <Input
            placeholder="Search by product name or barcode"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-1/2">
          <Select
            value={warehouseFilter}
            onValueChange={(value) => setWarehouseFilter(value)}
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
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <div className="mt-2">Loading inventory...</div>
                  </TableCell>
                </TableRow>
              ) : inventoryQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-red-500">
                    Error loading inventory data
                  </TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>{item.barcode}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.warehouse.name}</TableCell>
                    <TableCell>{item.warehouse_location.floor}</TableCell>
                    <TableCell>{item.warehouse_location.zone}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell>{item.color || '-'}</TableCell>
                    <TableCell>{item.size || '-'}</TableCell>
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
