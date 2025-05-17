
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Filter, ArrowLeft, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/warehouse/LoadingState';
import { ErrorState } from '@/components/warehouse/ErrorState';
import { supabase } from '@/lib/supabase';
import { ProcessedBatch } from '@/types/batchStockIn';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BatchCard } from '@/components/warehouse/BatchCard';

const AllBatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  
  // Fetch all warehouses for the filter
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name');
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch all processed batches with filters
  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['all-batches', searchQuery, warehouseFilter],
    queryFn: async () => {
      let query = supabase
        .from('processed_batches')
        .select(`
          id, 
          product_id, 
          warehouse_id, 
          source, 
          notes,
          status, 
          total_boxes, 
          total_quantity,
          processed_at,
          processed_by,
          stock_in_id,
          products:product_id (id, name, sku),
          warehouses:warehouse_id (id, name, location),
          profiles:processed_by (id, name, username)
        `)
        .order('processed_at', { ascending: false });
      
      // Apply warehouse filter if selected
      if (warehouseFilter !== 'all') {
        query = query.eq('warehouse_id', warehouseFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Apply search filter client-side
      let filteredData = data || [];
      
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(batch => 
          batch.products?.name?.toLowerCase().includes(lowerQuery) ||
          batch.products?.sku?.toLowerCase().includes(lowerQuery) ||
          batch.warehouses?.name?.toLowerCase().includes(lowerQuery) ||
          batch.profiles?.name?.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Get batch items for each batch
      const batchIds = filteredData.map(batch => batch.id);
      
      if (batchIds.length === 0) {
        return [];
      }
      
      const { data: batchItems, error: itemsError } = await supabase
        .from('batch_items')
        .select(`
          id,
          batch_id,
          barcode,
          quantity,
          color,
          size,
          warehouse_id,
          location_id,
          status,
          warehouse_locations:location_id (id, floor, zone)
        `)
        .in('batch_id', batchIds);
        
      if (itemsError) throw itemsError;
      
      // Group items by batch_id
      const itemsByBatch = batchItems?.reduce((acc, item) => {
        if (!acc[item.batch_id]) {
          acc[item.batch_id] = [];
        }
        acc[item.batch_id].push(item);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      // Map the data to our ProcessedBatch type
      return filteredData.map(batch => {
        const items = itemsByBatch[batch.id] || [];
        const barcodes = items.map(item => item.barcode);
        const warehouseLocation = items.length > 0 ? items[0].warehouse_locations : null;
        
        return {
          id: batch.id,
          product_id: batch.product_id,
          warehouse_id: batch.warehouse_id,
          location_id: warehouseLocation?.id,
          boxes_count: batch.total_boxes,
          quantity_per_box: batch.total_quantity / batch.total_boxes,
          barcodes,
          created_by: batch.processed_by,
          product: batch.products,
          warehouse: batch.warehouses,
          warehouseLocation,
          submitter: batch.profiles,
          created_at: batch.processed_at,
          stock_in_id: batch.stock_in_id
        } as ProcessedBatch;
      });
    }
  });

  const handleViewDetails = (batchId: string, stockInId?: string) => {
    if (stockInId) {
      navigate(`/manager/stock-in/batches/${stockInId}`, { state: { batchId } });
    } else {
      // If no stockInId, just navigate to the barcodes view
      navigate(`/manager/inventory/barcodes/${batchId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      
      <PageHeader 
        title="All Processed Batches" 
        description="View and manage all processed inventory batches across warehouses" 
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Processed Batches</CardTitle>
            <CardDescription>
              {batches ? `${batches.length} batches found` : 'Loading batches...'}
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={warehouseFilter}
              onValueChange={setWarehouseFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses?.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <LoadingState message="Loading batch data..." />
          ) : error ? (
            <ErrorState 
              message="Error loading batch data"
              details={error instanceof Error ? error.message : "Unknown error"} 
              onNavigateBack={() => navigate('/manager')}
            />
          ) : (
            <>
              {batches && batches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batches.map((batch, index) => (
                    <div key={batch.id}>
                      <BatchCard 
                        batch={batch}
                        index={index}
                        showBarcodes={false}
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex gap-1"
                          onClick={() => handleViewDetails(batch.id!, batch.stock_in_id)}
                        >
                          <Package className="h-4 w-4" /> View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">No batches found</p>
                  <p className="text-sm mt-1">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllBatchesPage;
