
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BoxesIcon, RefreshCw, Search, Plus, Printer, Filter, ArrowUpDown
} from 'lucide-react';
import { useProcessedBatchesWithItems } from '@/hooks/useProcessedBatchesWithItems';
import { BatchProgressCard } from '@/components/warehouse/BatchProgressCard';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const BatchManagementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  
  // Fetch batches using our improved hook
  const { batches, count, isLoading, refetch } = useProcessedBatchesWithItems({
    page,
    limit: pageSize,
    warehouseId: warehouseFilter || undefined,
    searchTerm: searchTerm || undefined
  });
  
  const handleRefresh = () => {
    toast({
      title: 'Refreshing data',
      description: 'Getting the latest batch information...'
    });
    queryClient.invalidateQueries({ queryKey: ['processed-batches-with-items'] });
  };
  
  const handleViewDetails = (batchId: string) => {
    navigate(`/manager/batch/${batchId}`);
  };
  
  const handlePrintBarcodes = (batchId: string) => {
    navigate(`/manager/inventory/barcodes/${batchId}`);
  };
  
  const handleCreateBatch = () => {
    // Navigate to batch creation page
    navigate('/manager/stock-in');
  };
  
  // Sort batches
  const sortedBatches = [...batches].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name':
        return (a.productName || '').localeCompare(b.productName || '');
      default:
        return 0;
    }
  });
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Batch Management" 
        description="View and manage all processed inventory batches"
      />
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select 
            value={warehouseFilter} 
            onValueChange={setWarehouseFilter}
          >
            <SelectTrigger className="w-full md:w-40">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{warehouseFilter ? "Warehouse" : "All Warehouses"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Warehouses</SelectItem>
              <SelectItem value="warehouse-1">Warehouse 1</SelectItem>
              <SelectItem value="warehouse-2">Warehouse 2</SelectItem>
              <SelectItem value="warehouse-3">Warehouse 3</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={sortOrder} 
            onValueChange={(value: 'newest' | 'oldest' | 'name') => setSortOrder(value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span>
                  {sortOrder === 'newest' ? 'Newest First' : 
                   sortOrder === 'oldest' ? 'Oldest First' : 
                   'Product Name'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Product Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleRefresh} className="flex-1 md:flex-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateBatch} className="flex-1 md:flex-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>
      
      {/* Batches Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse">
                <div className="h-full bg-gray-100 dark:bg-gray-800"></div>
              </Card>
            ))}
          </div>
        ) : sortedBatches.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <BoxesIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Batches Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || warehouseFilter
                  ? "No batches match your search criteria"
                  : "You haven't created any batches yet"}
              </p>
              <Button onClick={handleCreateBatch}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBatches.map(batch => (
                <BatchProgressCard
                  key={batch.id}
                  id={batch.id}
                  productName={batch.productName || 'Unknown Product'}
                  productSku={batch.productSku || undefined}
                  processorName={batch.processorName || undefined}
                  totalBoxes={batch.totalBoxes}
                  progress={batch.progress.percentage}
                  createdAt={batch.createdAt}
                  warehouseName={batch.warehouseName || undefined}
                  status={batch.status}
                  onViewDetails={handleViewDetails}
                  onPrintBarcodes={handlePrintBarcodes}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {count > pageSize && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(count / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(prev => (prev * pageSize < count ? prev + 1 : prev))}
                    disabled={page * pageSize >= count}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BatchManagementPage;
