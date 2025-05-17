
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - in production this would come from a hook like useTransferMovementReport
const mockTransferTrendData = [
  { date: '2025-01', initiated: 45, completed: 38, rejected: 4 },
  { date: '2025-02', initiated: 52, completed: 43, rejected: 6 },
  { date: '2025-03', initiated: 48, completed: 44, rejected: 3 },
  { date: '2025-04', initiated: 60, completed: 51, rejected: 5 },
  { date: '2025-05', initiated: 58, completed: 49, rejected: 7 },
];

const mockTransferByWarehouseData = [
  { name: 'Warehouse A → B', count: 45, volume: 5600 },
  { name: 'Warehouse B → C', count: 38, volume: 4200 },
  { name: 'Warehouse C → A', count: 32, volume: 3800 },
  { name: 'Warehouse D → A', count: 28, volume: 3200 },
  { name: 'Warehouse B → D', count: 22, volume: 2600 },
];

const mockTransferStatusData = [
  { name: 'Completed', value: 225 },
  { name: 'Pending', value: 45 },
  { name: 'Processing', value: 28 },
  { name: 'Rejected', value: 25 }
];

const TransferMovementReport: React.FC = () => {
  // Mock functions for export (would be implemented with actual data in production)
  const handleExportCsv = () => {
    console.log('Export to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
  };

  return (
    <ReportLayout
      title="Transfer & Movement Report"
      description="Analysis of inventory transfers between warehouses and locations"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">323</div>
            <p className="text-sm text-muted-foreground mt-1">Last 5 months</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">225</div>
            <p className="text-sm text-muted-foreground mt-1">69.7% completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">73</div>
            <p className="text-sm text-muted-foreground mt-1">22.6% of all transfers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">25</div>
            <p className="text-sm text-muted-foreground mt-1">7.7% rejection rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockTransferTrendData}
          keys={['initiated', 'completed', 'rejected']}
          title="Transfer Trend"
          xAxisKey="date"
          xAxisLabel="Month"
          yAxisLabel="Count"
        />

        <PieChart 
          data={mockTransferStatusData}
          title="Transfer Status Distribution"
        />
      </div>

      <div className="mb-6">
        <BarChart
          data={mockTransferByWarehouseData}
          keys={['count', 'volume']}
          title="Top Transfer Routes"
          xAxisLabel="Route"
          yAxisLabel="Count / Volume"
          height={400}
        />
      </div>
    </ReportLayout>
  );
};

export default TransferMovementReport;
