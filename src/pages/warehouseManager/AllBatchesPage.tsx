
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { ProcessedBatch } from '@/types/batchStockIn';
import { Product, Warehouse, WarehouseLocation, Profile } from '@/types/database';

const AllBatchesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);

  // Fetch all processed batches
  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['processed-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processed_batches')
        .select(`
          id,
          product_id,
          warehouse_id,
          location_id,
          boxes_count,
          quantity_per_box,
          color,
          size,
          created_by,
          barcodes,
          created_at,
          stock_in_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    }
  });

  // Fetch additional batch details (products, warehouses, locations)
  const { data: batchDetails } = useQuery({
    queryKey: ['batch-details', batches],
    queryFn: async () => {
      if (!batches || batches.length === 0) return { products: {}, warehouses: {}, profiles: {} };
      
      // Extract unique IDs for products, warehouses, locations
      const productIds = [...new Set(batches.map(batch => batch.product_id))];
      const warehouseIds = [...new Set(batches.map(batch => batch.warehouse_id))];
      const locationIds = [...new Set(batches.map(batch => batch.location_id))];
      const userIds = [...new Set(batches.map(batch => batch.created_by))];
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku')
        .in('id', productIds);
      
      // Fetch warehouses
      const { data: warehousesData } = await supabase
        .from('warehouses')
        .select('id, name, location')
        .in('id', warehouseIds);
        
      // Fetch warehouse locations
      const { data: locationsData } = await supabase
        .from('warehouse_locations')
        .select('id, warehouse_id, zone, floor')
        .in('id', locationIds);
        
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, username')
        .in('id', userIds);
        
      // Map data to objects for easy lookup
      const products = (productsData || []).reduce((acc, product) => ({
        ...acc,
        [product.id]: product
      }), {});
      
      const warehouses = (warehousesData || []).reduce((acc, warehouse) => ({
        ...acc,
        [warehouse.id]: warehouse
      }), {});
      
      const locations = (locationsData || []).reduce((acc, location) => ({
        ...acc,
        [location.id]: location
      }), {});
      
      const profiles = (profilesData || []).reduce((acc, profile) => ({
        ...acc,
        [profile.id]: profile
      }), {});
      
      return { products, warehouses, locations, profiles };
    },
    enabled: batches !== undefined && batches.length > 0
  });

  // Fetch all warehouses for filter dropdown
  const { data: warehousesList } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      return data || [];
    }
  });

  // Transform batch data to include full details
  const transformBatchData = (batch: any): ProcessedBatch => {
    if (!batchDetails) {
      return {
        ...batch,
        product_id: batch.product_id,
        warehouse_id: batch.warehouse_id,
        location_id: batch.location_id,
        boxes_count: batch.boxes_count,
        quantity_per_box: batch.quantity_per_box,
        color: batch.color,
        size: batch.size,
        created_by: batch.created_by,
        barcodes: batch.barcodes || [],
        product: undefined,
        warehouse: undefined,
        warehouseLocation: undefined,
        submitter: undefined,
        created_at: batch.created_at,
        stock_in_id: batch.stock_in_id
      } as unknown as ProcessedBatch;
    }

    const product = batchDetails.products[batch.product_id] as Product;
    const warehouse = batchDetails.warehouses[batch.warehouse_id] as Warehouse;
    const location = batchDetails.locations[batch.location_id];
    const submitter = batchDetails.profiles[batch.created_by] as Profile;
    
    return {
      id: batch.id,
      product_id: batch.product_id,
      warehouse_id: batch.warehouse_id,
      location_id: batch.location_id,
      boxes_count: batch.boxes_count,
      quantity_per_box: batch.quantity_per_box,
      color: batch.color,
      size: batch.size,
      created_by: batch.created_by,
      barcodes: batch.barcodes || [],
      product,
      warehouse,
      warehouseLocation: location,
      submitter,
      created_at: batch.created_at,
      stock_in_id: batch.stock_in_id
    } as unknown as ProcessedBatch;
  };

  // Filter batches based on search term and selected warehouse
  const filteredBatches = React.useMemo(() => {
    if (!batches || !batchDetails) return [];
    
    return batches
      .filter(batch => {
        if (filterWarehouse && batch.warehouse_id !== filterWarehouse) return false;
        
        const product = batchDetails.products[batch.product_id];
        if (!product) return false;
        
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          (batch.barcodes && batch.barcodes.some(barcode => barcode.toLowerCase().includes(searchLower)))
        );
      })
      .map(transformBatchData);
  }, [batches, batchDetails, searchTerm, filterWarehouse]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading batches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-start">
            <div>
              <h3 className="font-medium text-red-800">Error loading batches</h3>
              <p className="text-sm text-red-700 mt-1">
                {error instanceof Error ? error.message : 'Failed to load batch data'}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Processed Batches</h1>
          <p className="text-muted-foreground">
            View all processed stock batches across warehouses
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by product name, SKU, or barcode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="warehouse-filter">Filter by Warehouse</Label>
              <Select
                value={filterWarehouse || ''}
                onValueChange={(value) => setFilterWarehouse(value || null)}
              >
                <SelectTrigger id="warehouse-filter">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Warehouses</SelectItem>
                  {warehousesList?.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredBatches.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-medium text-lg">No batches found</h3>
          <p className="text-muted-foreground mt-1">
            Try changing your search or filter parameters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="font-medium">{batch.product?.name}</div>
                      <div className="text-sm text-muted-foreground">{batch.product?.sku}</div>
                    </TableCell>
                    <TableCell>
                      <div>{batch.warehouse?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {batch.warehouseLocation ? 
                          `Floor ${batch.warehouseLocation.floor}, Zone ${batch.warehouseLocation.zone}` : 
                          'Unknown location'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{batch.boxes_count} boxes</div>
                      <div className="text-sm text-muted-foreground">{batch.quantity_per_box} per box</div>
                    </TableCell>
                    <TableCell>
                      <div>{batch.submitter?.name}</div>
                      <div className="text-sm text-muted-foreground">{batch.submitter?.username}</div>
                    </TableCell>
                    <TableCell>
                      {new Date(batch.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/manager/stock-in/batches/${batch.stock_in_id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {filteredBatches.map((batch, index) => (
              <BatchCard 
                key={batch.id} 
                batch={batch} 
                index={index} 
                showBarcodes={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBatchesPage;
