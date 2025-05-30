import React, { useState, useRef } from 'react';
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
import { supabase } from '@/lib/supabaseClient';
import EnhancedBatchDetailsDialog from '@/components/warehouse/EnhancedBatchDetailsDialog';

// Define types for Supabase responses
interface BarcodeData {
  item_id: string;
  barcode: string;
}

interface WarehouseData {
  id: string;
  name: string;
}

interface LocationData {
  id: string;
  floor?: string | number;
  zone?: string;
}

interface BatchItemData {
  id: string;
  quantity?: number;
  status?: string;
  color?: string;
  size?: string;
  warehouse_id?: string;
  location_id?: string;
}

interface ProcessedBatchData {
  id: string;
  status?: string;
  total_boxes?: number;
  total_quantity?: number;
  warehouse_id?: string;
  location_id?: string;
  processed_at?: string;
  batch_items?: BatchItemData[];
  products?: {
    id: string;
    name: string;
  };
  processor?: {
    id: string;
    name: string;
  };
}

// Define the types for batch items
interface BatchItem {
  id: string;
  barcode: string;
  productName?: string;
  quantity: number;
  status: string;
  warehouseName?: string;
  locationDetails?: string;
  color?: string;
  size?: string;
  warehouse_id?: string;
  warehouse_locations?: {
    floor?: string | number;
    zone?: string;
  };
}

// Define the type for a batch
interface Batch {
  id: string;
  status: string;
  items: BatchItem[];
  name?: string;
  totalBoxes?: number;
  totalQuantity?: number;
  warehouseName?: string;
  locationDetails?: string;
  processorName?: string;
  processedAt?: string;
  product?: {
    name: string;
  };
}

const EnhancedInventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const barcodeContainerRef = useRef<HTMLDivElement>(null);

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

  const handleViewDetails = async (batchId: string) => {
    try {
      // First try to find the batch in the already loaded batches
      const existingBatch = batches.find(b => b.id === batchId);
      
      if (existingBatch && existingBatch.items?.length > 0) {
        // If we already have the batch with items, use it
        setSelectedBatch(existingBatch);
        setShowDetails(true);
        return;
      }
      
      // Otherwise, fetch the batch details from the database
      const { data: batch, error } = await supabase
        .from('processed_batches')
        .select(`
          *,
          batch_items (id, quantity, status, color, size, warehouse_id, location_id),
          products:product_id (id, name),
          processor:profiles (id, name)
        `)
        .eq('id', batchId)
        .single<ProcessedBatchData>();
      
      if (error) {
        console.error('Error fetching batch details:', error);
        return;
      }
      
      if (batch) {
        // Fetch barcodes for each batch item
        const batchItemIds = batch.batch_items?.map(item => item.id) || [];
        const barcodes: Record<string, string> = {};
        
        if (batchItemIds.length > 0) {
          // Generate barcodes for items if they don't exist
          // Since we don't have a direct barcodes table, we'll generate them based on item ID
          batchItemIds.forEach(itemId => {
            if (itemId) {
              barcodes[itemId] = `BATCH-${itemId.substring(0, 8)}`;
            }
          });
        }
        
        // Fetch warehouse and location details
        const warehouseIds = [...new Set(batch.batch_items?.map(item => item.warehouse_id).filter(Boolean) || [])];
        const locationIds = [...new Set(batch.batch_items?.map(item => item.location_id).filter(Boolean) || [])];
        
        const warehouses: Record<string, string> = {};
        const locations: Record<string, { floor?: string; zone?: string }> = {};
        
        if (warehouseIds.length > 0) {
          const { data: warehouseData } = await supabase
            .from('warehouses')
            .select('id, name')
            .in('id', warehouseIds);
            
          if (warehouseData) {
            (warehouseData as unknown as WarehouseData[]).forEach(item => {
              if (item && item.id && item.name) {
                warehouses[item.id] = item.name;
              }
            });
          }
        }
        
        if (locationIds.length > 0) {
          const { data: locationData } = await supabase
            .from('warehouse_locations')
            .select('id, floor, zone')
            .in('id', locationIds);
            
          if (locationData) {
            (locationData as unknown as LocationData[]).forEach(item => {
              if (item && item.id) {
                locations[item.id] = { 
                  floor: item.floor !== undefined ? String(item.floor) : undefined, 
                  zone: item.zone || undefined 
                };
              }
            });
          }
        }
        
        // Transform the batch data to match the Batch type
        const batchWithItems: Batch = {
          id: batch.id,
          status: batch.status || 'unknown',
          totalBoxes: batch.total_boxes || 0,
          totalQuantity: batch.total_quantity || 0,
          warehouseName: batch.warehouse_id ? (warehouses[batch.warehouse_id] || String(batch.warehouse_id)) : undefined,
          locationDetails: batch.location_id ? `Location ID: ${batch.location_id}` : undefined,
          processorName: batch.processor?.name,
          processedAt: batch.processed_at,
          product: batch.products ? { name: batch.products.name } : undefined,
          items: (batch.batch_items || []).map(item => {
            // Ensure we have a valid item
            if (!item || !item.id) {
              return {
                id: `unknown-${Math.random().toString(36).substring(2, 9)}`,
                barcode: 'UNKNOWN',
                quantity: 0,
                status: 'unknown'
              };
            }
            
            // Get location details if available
            const locationDetail = item.location_id && locations[item.location_id] 
              ? `Floor: ${String(locations[item.location_id].floor || 'N/A')}, Zone: ${locations[item.location_id].zone || 'N/A'}`
              : 'No location details';
              
            return {
              id: item.id,
              barcode: (item.id && barcodes[item.id]) || `BATCH-${item.id.substring(0, 8)}`,
              productName: batch.products?.name,
              quantity: item.quantity || 0,
              status: item.status || 'unknown',
              warehouseName: item.warehouse_id ? (warehouses[item.warehouse_id] || String(item.warehouse_id)) : undefined,
              locationDetails: locationDetail,
              color: item.color,
              size: item.size,
              warehouse_id: item.warehouse_id,
              warehouse_locations: item.location_id ? locations[item.location_id] : undefined
            };
          })
        };
        
        setSelectedBatch(batchWithItems);
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Error fetching batch details:', err);
    }
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
              <EnhancedBatchDetailsDialog 
                open={showDetails} 
                onOpenChange={setShowDetails} 
                batchId={selectedBatch?.id || null}
                selectedBatch={selectedBatch}
              />
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