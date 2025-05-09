
import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Warehouse } from '@/types/database';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { DataSyncProvider, useDataSync } from '@/context/DataSyncContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const InventoryContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const { subscribeToTable } = useDataSync();
  
  // Subscribe to real-time updates for warehouses
  React.useEffect(() => {
    subscribeToTable('warehouses');
  }, [subscribeToTable]);
  
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
  
  // Use the real-time inventory hook
  const { 
    inventory: filteredInventory,
    isLoading,
    isError,
    totalItems,
    uniqueProducts,
    lowStockItems,
    refresh
  } = useRealtimeInventory({
    warehouseId: warehouseFilter || undefined,
    searchTerm
  });
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory" 
        description="View inventory across all warehouses"
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Items</div>
            <div className="text-3xl font-bold">{totalItems}</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Unique Products</div>
            <div className="text-3xl font-bold">{uniqueProducts}</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Low Stock Items</div>
            <div className="text-3xl font-bold text-amber-500">{lowStockItems}</div>
          </div>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <Input
            placeholder="Search by product name or barcode"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-1/3">
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
        <div className="w-full md:w-1/6">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => refresh()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <div className="mt-2">Loading inventory...</div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-red-500">
                    Error loading inventory data
                  </TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>{item.barcode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.quantity}
                        {item.quantity < 5 && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.warehouse.name}</TableCell>
                    <TableCell>{item.warehouse_location.floor}</TableCell>
                    <TableCell>{item.warehouse_location.zone}</TableCell>
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

// Wrap component with DataSyncProvider to ensure real-time updates
const InventoryView: React.FC = () => {
  return (
    <DataSyncProvider>
      <InventoryContent />
    </DataSyncProvider>
  );
};

export default InventoryView;
