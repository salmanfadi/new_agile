
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Filter, 
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Grid3X3,
  BoxesIcon
} from 'lucide-react';
import { useProcessedBatchesWithItems } from '@/hooks/useProcessedBatchesWithItems';
import { ProcessedBatchesTable } from '@/components/warehouse/ProcessedBatchesTable';
import { InventoryTableContainer } from '@/components/warehouse/InventoryTableContainer';

import { ProductView } from '@/components/warehouse/ProductView';

const EnhancedInventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Calculate some basic stats
  const totalBatches = batchCount;
  const completedBatches = batches.filter(b => b.status === 'completed').length;
  const processingBatches = batches.filter(b => b.status === 'processing').length;
  const totalItems = batches.reduce((sum, batch) => sum + batch.totalBoxes, 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Inventory View</h1>
          <p className="text-gray-600">Comprehensive view of inventory batches and stock levels</p>
        </div>
        <Button onClick={handleExportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
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
              Processing
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
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-gray-500">Items in batches</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Product View
            </div>
          </TabsTrigger>
          <TabsTrigger value="batches">Processed Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Product Inventory</CardTitle>
              <CardDescription>View all products with detailed batch information</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Processed Batches</CardTitle>
              <CardDescription>View and manage all processed inventory batches</CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessedBatchesTable 
                filters={{
                  searchTerm: searchTerm,
                  status: statusFilter,
                  warehouseId: warehouseFilter
                }}
                page={currentPage}
                pageSize={10}
                onPageChange={setCurrentPage}
                highlightBatchId={null}
              />
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default EnhancedInventoryView;
