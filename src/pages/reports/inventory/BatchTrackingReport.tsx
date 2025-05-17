
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProcessedBatch } from '@/types/database';
import { ReportFilters as ReportFiltersType } from '@/types/reports';
import { format } from 'date-fns';

// Mock data - in production this would come from useBatchTrackingReport hook
const mockBatchesByStatusData = [
  { name: 'Completed', value: 56 },
  { name: 'Processing', value: 24 },
  { name: 'Pending', value: 18 },
  { name: 'Rejected', value: 8 }
];

const mockBatchesBySourceData = [
  { name: 'Supplier A', value: 28 },
  { name: 'Supplier B', value: 22 },
  { name: 'Returns', value: 14 },
  { name: 'Internal', value: 12 },
  { name: 'Other', value: 10 }
];

const mockQuantityTrendData = [
  { date: '2025-01-01', quantity: 2450 },
  { date: '2025-02-01', quantity: 3200 },
  { date: '2025-03-01', quantity: 2800 },
  { date: '2025-04-01', quantity: 3600 },
  { date: '2025-05-01', quantity: 4200 }
];

const mockProcessedBatches: ProcessedBatch[] = [
  {
    id: '1',
    stock_in_id: 'si-001',
    processed_by: 'user-001',
    processed_at: '2025-05-01T10:30:00Z',
    product_id: 'prod-001',
    total_quantity: 500,
    total_boxes: 20,
    warehouse_id: 'wh-001',
    status: 'completed',
    notes: 'Processed on time',
    source: 'Supplier A',
    created_at: '2025-05-01T09:00:00Z',
    products: { name: 'Premium Widgets', sku: 'PW-001' },
    warehouses: { name: 'Main Warehouse' },
    profiles: { name: 'John Doe' },
    processed_by_name: 'John Doe',
    processed_at_formatted: '5/1/2025',
    created_at_formatted: '5/1/2025',
    product_name: 'Premium Widgets'
  },
  {
    id: '2',
    stock_in_id: 'si-002',
    processed_by: 'user-002',
    processed_at: '2025-05-02T14:15:00Z',
    product_id: 'prod-002',
    total_quantity: 350,
    total_boxes: 14,
    warehouse_id: 'wh-001',
    status: 'completed',
    notes: 'Quality check done',
    source: 'Supplier B',
    created_at: '2025-05-02T13:00:00Z',
    products: { name: 'Standard Gadgets', sku: 'SG-001' },
    warehouses: { name: 'Main Warehouse' },
    profiles: { name: 'Jane Smith' },
    processed_by_name: 'Jane Smith',
    processed_at_formatted: '5/2/2025',
    created_at_formatted: '5/2/2025',
    product_name: 'Standard Gadgets'
  },
  {
    id: '3',
    stock_in_id: 'si-003',
    processed_by: 'user-001',
    processed_at: '2025-05-03T09:45:00Z',
    product_id: 'prod-003',
    total_quantity: 600,
    total_boxes: 24,
    warehouse_id: 'wh-002',
    status: 'completed',
    notes: 'Express processing',
    source: 'Internal',
    created_at: '2025-05-03T08:30:00Z',
    products: { name: 'Luxury Items', sku: 'LI-001' },
    warehouses: { name: 'Secondary Warehouse' },
    profiles: { name: 'John Doe' },
    processed_by_name: 'John Doe',
    processed_at_formatted: '5/3/2025',
    created_at_formatted: '5/3/2025',
    product_name: 'Luxury Items'
  },
  {
    id: '4',
    stock_in_id: 'si-004',
    processed_by: 'user-003',
    processed_at: '2025-05-04T11:20:00Z',
    product_id: 'prod-001',
    total_quantity: 450,
    total_boxes: 18,
    warehouse_id: 'wh-001',
    status: 'completed',
    notes: 'Batch verified',
    source: 'Supplier A',
    created_at: '2025-05-04T10:00:00Z',
    products: { name: 'Premium Widgets', sku: 'PW-001' },
    warehouses: { name: 'Main Warehouse' },
    profiles: { name: 'Robert Johnson' },
    processed_by_name: 'Robert Johnson',
    processed_at_formatted: '5/4/2025',
    created_at_formatted: '5/4/2025',
    product_name: 'Premium Widgets'
  }
];

const BatchTrackingReport: React.FC = () => {
  // In a real implementation, these states and data would come from the useBatchTrackingReport hook
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: new Date('2025-05-01'),
      to: new Date('2025-05-31')
    }
  });
  
  const handleExportCsv = () => {
    console.log('Export to CSV');
    // In production, this would use a utility function to export the data
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
    // In production, this would use a utility function to export the data
  };

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    // In production, this would trigger a data refresh
  };

  return (
    <ReportLayout
      title="Batch Tracking Report"
      description="Track and analyze batches processed over time"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showDateRange
        showWarehouse
        showProduct
        showStatus
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">106</div>
            <p className="text-sm text-muted-foreground mt-1">Processed in date range</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">16,250</div>
            <p className="text-sm text-muted-foreground mt-1">Units processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.4</div>
            <p className="text-sm text-muted-foreground mt-1">Batches per day</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PieChart 
          data={mockBatchesByStatusData}
          title="Batches by Status"
        />
        
        <PieChart 
          data={mockBatchesBySourceData}
          title="Batches by Source"
        />
      </div>

      <div className="mb-6">
        <LineChart
          data={mockQuantityTrendData}
          keys={['quantity']}
          title="Processed Quantity Trend"
          xAxisKey="date"
          xAxisLabel="Date"
          yAxisLabel="Quantity"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Processed Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Boxes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProcessedBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {batch.processed_at ? format(new Date(batch.processed_at), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>{batch.product_name}</TableCell>
                    <TableCell>{batch.source}</TableCell>
                    <TableCell>{batch.warehouses?.name}</TableCell>
                    <TableCell className="text-right">{batch.total_quantity}</TableCell>
                    <TableCell className="text-right">{batch.total_boxes}</TableCell>
                    <TableCell>
                      <Badge variant={
                        batch.status === 'completed' ? 'success' :
                        batch.status === 'processing' ? 'warning' :
                        batch.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.processed_by_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default BatchTrackingReport;
