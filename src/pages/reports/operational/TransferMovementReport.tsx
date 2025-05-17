
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

// Mock data
const mockTransferTrendsData = [
  { month: 'Jan', inbound: 45, outbound: 38, internal: 12 },
  { month: 'Feb', inbound: 52, outbound: 41, internal: 15 },
  { month: 'Mar', inbound: 48, outbound: 39, internal: 18 },
  { month: 'Apr', inbound: 58, outbound: 45, internal: 22 },
  { month: 'May', inbound: 64, outbound: 52, internal: 24 },
];

const mockTransfersByWarehouse = [
  { name: 'Warehouse A', sent: 48, received: 37 },
  { name: 'Warehouse B', sent: 65, received: 58 },
  { name: 'Warehouse C', sent: 42, received: 52 },
  { name: 'Warehouse D', sent: 38, received: 46 },
];

const mockRecentTransfers = [
  { id: 'TRN-1001', source: 'Warehouse A', destination: 'Warehouse C', items: 12, requestedBy: 'John Smith', date: '2025-05-10', status: 'completed' },
  { id: 'TRN-1002', source: 'Warehouse B', destination: 'Warehouse D', items: 8, requestedBy: 'Lisa Chen', date: '2025-05-11', status: 'completed' },
  { id: 'TRN-1003', source: 'Warehouse C', destination: 'Warehouse A', items: 15, requestedBy: 'Robert Brown', date: '2025-05-13', status: 'completed' },
  { id: 'TRN-1004', source: 'Warehouse D', destination: 'Warehouse B', items: 6, requestedBy: 'Maria Garcia', date: '2025-05-14', status: 'in-transit' },
  { id: 'TRN-1005', source: 'Warehouse A', destination: 'Warehouse D', items: 10, requestedBy: 'David Lee', date: '2025-05-16', status: 'pending' },
];

const TransferMovementReport: React.FC = () => {
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
      title="Transfer Movement Report" 
      description="Analysis of inventory transfers between warehouses and locations"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="mb-6">
        <ReportFilters 
          showDateRange 
          showWarehouse 
          showStatus 
          showUser
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">419</div>
            <p className="text-sm text-muted-foreground mt-1">Across all warehouses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Items Transferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3,842</div>
            <p className="text-sm text-muted-foreground mt-1">Total inventory items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Avg. Transfer Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.3 days</div>
            <p className="text-sm text-muted-foreground mt-1">From request to completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockTransferTrendsData.map(item => ({
            name: item.month,
            inbound: item.inbound,
            outbound: item.outbound,
            internal: item.internal
          }))}
          keys={['inbound', 'outbound', 'internal']}
          title="Transfer Trends"
          xAxisKey="name"
          xAxisLabel="Month"
          yAxisLabel="Count"
        />
        
        <BarChart
          data={mockTransfersByWarehouse}
          keys={['sent', 'received']}
          title="Transfers by Warehouse"
          xAxisLabel="Warehouse"
          yAxisLabel="Transfers"
        />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.id}</TableCell>
                  <TableCell>{transfer.source}</TableCell>
                  <TableCell>{transfer.destination}</TableCell>
                  <TableCell>{transfer.items}</TableCell>
                  <TableCell>{transfer.requestedBy}</TableCell>
                  <TableCell>{format(new Date(transfer.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={
                      transfer.status === 'completed' ? 'success' : 
                      transfer.status === 'in-transit' ? 'outline' : 
                      'destructive'
                    }>
                      {transfer.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default TransferMovementReport;
