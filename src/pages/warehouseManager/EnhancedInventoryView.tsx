import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useProcessedBatchesWithItems } from '@/hooks/useProcessedBatchesWithItems';
import { ProcessedBatchesTable } from '@/components/warehouse/ProcessedBatchesTable';
import { InventoryTableContainer } from '@/components/warehouse/InventoryTableContainer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const EnhancedInventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const navigate = useNavigate();

  // Fetch processed batches data
  const processedBatchesQuery = useProcessedBatchesWithItems({
    limit: 10,
    page: currentPage,
    searchTerm: searchTerm || undefined,
    status: statusFilter || undefined,
    warehouseId: warehouseFilter || undefined
  });

  const batches = processedBatchesQuery.data?.batches || [];
  const batchCount = processedBatchesQuery.data?.count || 0;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleWarehouseFilter = (warehouseId: string) => {
    setWarehouseFilter(warehouseId);
    setCurrentPage(1);
  };

  const handleExportData = () => {
    console.log('Exporting data...');
  };

  const handleViewDetails = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    setSelectedBatch(batch);
    setShowDetails(true);
  };

  // Show loading state while data is being fetched
  if (processedBatchesQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-gray-600">Loading inventory data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats from available data
  const totalBatches = batchCount;
  const completedBatches = batches.filter(b => b.status === 'completed').length;
  const processingBatches = batches.filter(b => b.status === 'processing').length;
  const failedBatches = batches.filter(b => b.status === 'failed').length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Inventory Management</h1>
          <p className="text-gray-600">Manage and monitor warehouse inventory operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <div className="text-xs text-gray-500">All processed batches</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedBatches}</div>
            <div className="text-xs text-gray-500">Successfully processed</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingBatches}</div>
            <div className="text-xs text-gray-500">Currently processing</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedBatches}</div>
            <div className="text-xs text-gray-500">Require attention</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batches">Batch View</TabsTrigger>
          <TabsTrigger value="inventory">Live Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Batch Activity</CardTitle>
                <CardDescription>Latest processed batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batches.slice(0, 5).map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Package className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{batch.product?.name || 'Unknown Product'}</p>
                          <p className="text-sm text-gray-500">{batch.totalBoxes} items</p>
                        </div>
                      </div>
                      <Badge variant={batch.status === 'completed' ? 'default' : 'secondary'}>
                        {batch.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common warehouse operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Process New Stock In
                </Button>
                <Button className="w-full justify-start" onClick={() => navigate('/manager/inventory/search')}>
                  <Search className="w-4 h-4 mr-2" />
                  Search Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch View</CardTitle>
              <CardDescription>
                View and inspect all processed inventory batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessedBatchesTable
                filters={{
                  searchTerm,
                  status: statusFilter,
                  warehouseId: warehouseFilter
                }}
                page={currentPage}
                pageSize={10}
                onPageChange={setCurrentPage}
                onViewDetails={handleViewDetails}
              />
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Batch Details</DialogTitle>
                    <DialogDescription>
                      {selectedBatch && (
                        <div>
                          <div className="mb-2">
                            <strong>Product:</strong> {selectedBatch.product?.name || 'Unknown'}<br />
                            <strong>Status:</strong> {selectedBatch.status}<br />
                            <strong>Total Boxes:</strong> {selectedBatch.totalBoxes}<br />
                            <strong>Total Quantity:</strong> {selectedBatch.totalQuantity}<br />
                            <strong>Warehouse:</strong> {selectedBatch.warehouseName || 'N/A'}<br />
                            <strong>Location:</strong> {selectedBatch.locationDetails || 'N/A'}<br />
                            <strong>Processed By:</strong> {selectedBatch.processorName || 'N/A'}<br />
                          </div>
                          <strong>Items in Batch:</strong>
                        </div>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedBatch && (
                    <div>
                      <table className="min-w-full text-xs mt-2 border">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1">Barcode</th>
                            <th className="border px-2 py-1">Quantity</th>
                            <th className="border px-2 py-1">Color</th>
                            <th className="border px-2 py-1">Size</th>
                            <th className="border px-2 py-1">Status</th>
                            <th className="border px-2 py-1">Warehouse</th>
                            <th className="border px-2 py-1">Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBatch.items.map((item) => (
                            <tr key={item.id}>
                              <td className="border px-2 py-1">{item.barcode}</td>
                              <td className="border px-2 py-1">{item.quantity}</td>
                              <td className="border px-2 py-1">{item.color || '-'}</td>
                              <td className="border px-2 py-1">{item.size || '-'}</td>
                              <td className="border px-2 py-1">{item.status}</td>
                              <td className="border px-2 py-1">{item.warehouseName || '-'}</td>
                              <td className="border px-2 py-1">{item.locationDetails || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Inventory Status</CardTitle>
              <CardDescription>
                Real-time view of current inventory levels across all locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTableContainer 
                warehouseFilter=""
                batchFilter=""
                statusFilter=""
                searchTerm=""
                highlightedBarcode=""
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedInventoryView;
