
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { format } from 'date-fns';
import { ReportFilters as ReportFiltersType, DataItem } from '@/types/reports';

// Mock data
const mockProcessingTimeData = [
  { month: 'Jan', stockIn: 3.2, stockOut: 2.1 },
  { month: 'Feb', stockIn: 2.8, stockOut: 1.9 },
  { month: 'Mar', stockIn: 3.5, stockOut: 2.3 },
  { month: 'Apr', stockIn: 2.5, stockOut: 1.8 },
  { month: 'May', stockIn: 2.2, stockOut: 1.6 },
];

// Convert to use 'name' property
const mockProcessingVolumeData: DataItem[] = [
  { name: 'Jan', completed: 183, pending: 12, rejected: 5 },
  { name: 'Feb', completed: 165, pending: 8, rejected: 3 },
  { name: 'Mar', completed: 192, pending: 15, rejected: 7 },
  { name: 'Apr', completed: 178, pending: 10, rejected: 4 },
  { name: 'May', completed: 201, pending: 9, rejected: 2 },
];

const mockRecentProcessingData = [
  { id: 'SI-10045', type: 'Stock In', requestedBy: 'John Smith', processedBy: 'Maria Garcia', requestDate: '2025-05-10', processDate: '2025-05-11', status: 'completed', processingTime: '1d 2h' },
  { id: 'SO-20089', type: 'Stock Out', requestedBy: 'Sarah Johnson', processedBy: 'David Lee', requestDate: '2025-05-11', processDate: '2025-05-12', status: 'completed', processingTime: '0d 18h' },
  { id: 'SI-10046', type: 'Stock In', requestedBy: 'Robert Brown', processedBy: 'Emily Wang', requestDate: '2025-05-12', processDate: '2025-05-14', status: 'completed', processingTime: '2d 4h' },
  { id: 'SO-20090', type: 'Stock Out', requestedBy: 'Lisa Chen', processedBy: 'James Wilson', requestDate: '2025-05-13', processDate: '2025-05-13', status: 'completed', processingTime: '0d 7h' },
  { id: 'SI-10047', type: 'Stock In', requestedBy: 'Thomas Martin', processedBy: null, requestDate: '2025-05-16', processDate: null, status: 'pending', processingTime: '-' },
];

const StockProcessingReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: new Date(2025, 0, 1),
      to: new Date(2025, 4, 31)
    },
    warehouse: 'all',
    product: 'all',
    status: 'all',
    user: 'all',
  });

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting CSV with filters:', filters);
  };

  const handleExportPdf = () => {
    console.log('Exporting PDF with filters:', filters);
  };

  return (
    <ReportLayout 
      title="Stock Processing Report" 
      description="Analysis of stock processing efficiency and performance metrics"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="mb-6">
        <ReportFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showDateRange 
          showWarehouse 
          showUser 
          showStatus 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Avg. Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.8 days</div>
            <p className="text-sm text-muted-foreground mt-1">For all stock requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">919</div>
            <p className="text-sm text-muted-foreground mt-1">Total stock requests processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">95.3%</div>
            <p className="text-sm text-muted-foreground mt-1">Of all submitted requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockProcessingTimeData.map(item => ({
            name: item.month,
            stockIn: item.stockIn,
            stockOut: item.stockOut
          }))}
          keys={['stockIn', 'stockOut']}
          title="Average Processing Time (Days)"
          xAxisKey="name"
          xAxisLabel="Month"
          yAxisLabel="Days"
        />
        
        <BarChart
          data={mockProcessingVolumeData}
          keys={['completed', 'pending', 'rejected']}
          title="Processing Volume by Status"
          xAxisLabel="Month"
          yAxisLabel="Requests"
        />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Processing Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Process Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processing Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentProcessingData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.requestedBy}</TableCell>
                  <TableCell>{item.processedBy || 'Pending'}</TableCell>
                  <TableCell>{format(new Date(item.requestDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{item.processDate ? format(new Date(item.processDate), 'MMM dd, yyyy') : 'Pending'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'completed' ? 'success' : 
                      item.status === 'pending' ? 'outline' : 
                      'destructive'
                    }>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.processingTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default StockProcessingReport;
