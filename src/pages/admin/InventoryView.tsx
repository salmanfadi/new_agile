
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
import { ArrowLeft, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import { StatusBadge } from '@/components/ui/StatusBadge';

const AdminInventoryView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Fetch inventory data
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['admin-inventory-data'],
    queryFn: async () => {
      console.log('Fetching inventory data');
      const { data, error } = await supabase
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
          status
        `)
        .order('updated_at', { ascending: false });
        
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
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : inventoryItems;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="View and manage current inventory across all warehouses"
      />
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="w-1/3">
          <Input
            placeholder="Search by product, warehouse, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
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
              {searchTerm ? 'No inventory items match your search criteria.' : 'No inventory items found.'}
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
                    <TableHead className="text-right">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.locationDetails}</TableCell>
                      <TableCell>{item.barcode}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
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
