import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProcessedBatchesWithItems } from '@/hooks/useProcessedBatchesWithItems';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import BatchItemsTable from '@/components/warehouse/BatchItemsTable';
import { Skeleton } from '@/components/ui/skeleton';

const BatchManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState('created_at');
  const [currentPage, setCurrentPage] = useState(1);
  
  const navigate = useNavigate();
  
  const { data: batchesData, isLoading, error, refetch } = useProcessedBatchesWithItems({
    limit: 10,
    status,
    sortBy,
    sortOrder,
    searchTerm: searchTerm.length > 2 ? searchTerm : undefined,
    page: currentPage
  });
  
  const batches = batchesData?.batches || [];
  const totalCount = batchesData?.count || 0;
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handleViewBatchDetails = (batchId: string) => {
    navigate(`/admin/inventory/batch/${batchId}`);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Batch Management" 
        description="View and manage inventory batches" 
      />
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
          <Input
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" size="icon" variant="ghost">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </form>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleSortOrder}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4 mr-2" />
            ) : (
              <SortDesc className="h-4 w-4 mr-2" />
            )}
            Sort: {sortOrder.toUpperCase()}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger 
            value="all" 
            onClick={() => setStatus(undefined)}
          >
            All Batches
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            onClick={() => setStatus('completed')}
          >
            Completed
          </TabsTrigger>
          <TabsTrigger 
            value="processing" 
            onClick={() => setStatus('processing')}
          >
            Processing
          </TabsTrigger>
          <TabsTrigger 
            value="failed" 
            onClick={() => setStatus('failed')}
          >
            Failed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  <p>Error loading batches: {(error as Error).message}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No batches found</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {batches.map((batch) => (
                <Card key={batch.id} className="overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {batch.product?.name || 'Unknown Product'}
                          {batch.product?.sku && (
                            <span className="text-xs text-muted-foreground ml-2">
                              SKU: {batch.product.sku}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Batch #{batch.id.substring(0, 8).toUpperCase()} • 
                          Processed by {batch.processorName} • 
                          {new Date(batch.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewBatchDetails(batch.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-4">
                      <div className="flex justify-between">
                        <span>Status: <span className="font-medium capitalize">{batch.status}</span></span>
                        <span>{batch.totalBoxes} boxes / {batch.totalQuantity} items</span>
                      </div>
                      
                      {batch.items.length > 0 && (
                        <div className="overflow-x-auto">
                          <BatchItemsTable 
                            items={batch.items.slice(0, 5)} 
                            simplified={true} 
                          />
                          {batch.items.length > 5 && (
                            <div className="text-center mt-2">
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => handleViewBatchDetails(batch.id)}
                              >
                                View all {batch.items.length} boxes
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {batches.length} of {totalCount} batches
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage * 10 >= totalCount}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  <p>Error loading batches: {(error as Error).message}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No completed batches found</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {batches.map((batch) => (
                <Card key={batch.id} className="overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {batch.product?.name || 'Unknown Product'}
                          {batch.product?.sku && (
                            <span className="text-xs text-muted-foreground ml-2">
                              SKU: {batch.product.sku}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Batch #{batch.id.substring(0, 8).toUpperCase()} • 
                          Processed by {batch.processorName} • 
                          {new Date(batch.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewBatchDetails(batch.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-4">
                      <div className="flex justify-between">
                        <span>Status: <span className="font-medium capitalize">{batch.status}</span></span>
                        <span>{batch.totalBoxes} boxes / {batch.totalQuantity} items</span>
                      </div>
                      
                      {batch.items.length > 0 && (
                        <div className="overflow-x-auto">
                          <BatchItemsTable 
                            items={batch.items.slice(0, 5)} 
                            simplified={true} 
                          />
                          {batch.items.length > 5 && (
                            <div className="text-center mt-2">
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => handleViewBatchDetails(batch.id)}
                              >
                                View all {batch.items.length} boxes
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {batches.length} of {totalCount} batches
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage * 10 >= totalCount}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="processing" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  <p>Error loading batches: {(error as Error).message}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No processing batches found</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {batches.map((batch) => (
                <Card key={batch.id} className="overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {batch.product?.name || 'Unknown Product'}
                          {batch.product?.sku && (
                            <span className="text-xs text-muted-foreground ml-2">
                              SKU: {batch.product.sku}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Batch #{batch.id.substring(0, 8).toUpperCase()} • 
                          Processed by {batch.processorName} • 
                          {new Date(batch.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewBatchDetails(batch.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-4">
                      <div className="flex justify-between">
                        <span>Status: <span className="font-medium capitalize">{batch.status}</span></span>
                        <span>{batch.totalBoxes} boxes / {batch.totalQuantity} items</span>
                      </div>
                      
                      {batch.items.length > 0 && (
                        <div className="overflow-x-auto">
                          <BatchItemsTable 
                            items={batch.items.slice(0, 5)} 
                            simplified={true} 
                          />
                          {batch.items.length > 5 && (
                            <div className="text-center mt-2">
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => handleViewBatchDetails(batch.id)}
                              >
                                View all {batch.items.length} boxes
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {batches.length} of {totalCount} batches
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage * 10 >= totalCount}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="failed" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  <p>Error loading batches: {(error as Error).message}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No failed batches found</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {batches.map((batch) => (
                <Card key={batch.id} className="overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {batch.product?.name || 'Unknown Product'}
                          {batch.product?.sku && (
                            <span className="text-xs text-muted-foreground ml-2">
                              SKU: {batch.product.sku}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Batch #{batch.id.substring(0, 8).toUpperCase()} • 
                          Processed by {batch.processorName} • 
                          {new Date(batch.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewBatchDetails(batch.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-4">
                      <div className="flex justify-between">
                        <span>Status: <span className="font-medium capitalize">{batch.status}</span></span>
                        <span>{batch.totalBoxes} boxes / {batch.totalQuantity} items</span>
                      </div>
                      
                      {batch.items.length > 0 && (
                        <div className="overflow-x-auto">
                          <BatchItemsTable 
                            items={batch.items.slice(0, 5)} 
                            simplified={true} 
                          />
                          {batch.items.length > 5 && (
                            <div className="text-center mt-2">
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => handleViewBatchDetails(batch.id)}
                              >
                                View all {batch.items.length} boxes
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {batches.length} of {totalCount} batches
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage * 10 >= totalCount}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BatchManagementPage;
