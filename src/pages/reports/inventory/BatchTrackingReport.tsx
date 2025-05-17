
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { format } from 'date-fns';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBatchTrackingReport } from '@/hooks/reports/useBatchTrackingReport';
import { ReportFilters as ReportFiltersType, DataItem } from '@/types/reports';

// Mock data for charts
const mockProductDistribution = [
  { name: 'Product A', value: 35 },
  { name: 'Product B', value: 25 },
  { name: 'Product C', value: 20 },
  { name: 'Product D', value: 15 },
  { name: 'Product E', value: 5 }
];

const mockStatusDistribution = [
  { name: 'Completed', value: 65 },
  { name: 'Processing', value: 20 },
  { name: 'Pending', value: 10 },
  { name: 'Rejected', value: 5 }
];

const mockTimeData = [
  { 
    name: 'Week 1', 
    min: 1.2,
    avg: 2.5,
    max: 4.3
  },
  { 
    name: 'Week 2', 
    min: 1.0,
    avg: 2.2,
    max: 3.8
  },
  { 
    name: 'Week 3', 
    min: 1.5,
    avg: 2.8,
    max: 4.5
  },
  { 
    name: 'Week 4', 
    min: 0.8,
    avg: 2.0,
    max: 3.5
  },
];

// Convert to use 'name' property for DataItem compatibility
const mockTrendData: DataItem[] = [
  { 
    name: '2025-01', 
    completed: 42,
    processing: 5,
    pending: 8,
    rejected: 3
  },
  { 
    name: '2025-02', 
    completed: 38,
    processing: 7,
    pending: 5,
    rejected: 2
  },
  { 
    name: '2025-03', 
    completed: 45,
    processing: 6,
    pending: 9,
    rejected: 4
  },
  { 
    name: '2025-04', 
    completed: 50,
    processing: 8,
    pending: 7,
    rejected: 1
  },
  { 
    name: '2025-05', 
    completed: 48,
    processing: 9,
    pending: 8,
    rejected: 2
  }
];

const BatchTrackingReport: React.FC = () => {
  const { data, loading, error, filters, updateFilters, resetFilters } = useBatchTrackingReport();
  
  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    updateFilters(newFilters);
  };
  
  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting batch tracking data to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Exporting batch tracking data to PDF');
  };

  return (
    <ReportLayout 
      title="Batch Tracking Report" 
      description="Detailed tracking and analysis of batch processing"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
      loading={loading} // Changed from isLoading to loading
    >
      <div className="mb-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showDateRange
          showWarehouse
          showProduct
          showStatus
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalBatches}</div>
            <p className="text-sm text-muted-foreground mt-1">Processed in selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalQuantity.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">Items across all batches</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.totalBatches ? 
                `${Math.round((data.byStatus?.completed || 0) / data.totalBatches * 100)}%` : 
                '0%'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Batches successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PieChart
          data={mockProductDistribution}
          title="Batch Distribution by Product"
        />
        
        <PieChart 
          data={mockStatusDistribution}
          title="Batch Distribution by Status"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={mockTimeData}
          keys={['min', 'avg', 'max']}
          title="Processing Time (Days)"
          xAxisLabel="Period"
          yAxisLabel="Days"
        />
        
        <BarChart
          data={mockTrendData}
          keys={['completed', 'processing', 'pending', 'rejected']}
          title="Batch Processing Trends"
          xAxisLabel="Month"
          yAxisLabel="Batches"
        />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Batch Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead>Processing Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.batches.slice(0, 10).map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.id}</TableCell>
                  <TableCell>{batch.productName}</TableCell>
                  <TableCell>{batch.warehouseName}</TableCell>
                  <TableCell>{batch.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={
                      batch.status === 'completed' ? 'success' : 
                      batch.status === 'processing' ? 'outline' :
                      batch.status === 'pending' ? 'outline' :
                      'destructive'
                    }>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(batch.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{batch.processedByName || 'Pending'}</TableCell>
                  <TableCell>{batch.processing_time || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default BatchTrackingReport;
