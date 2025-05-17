
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - in production this would come from a hook like useStockProcessingReport
const mockProcessingTimeData = [
  { date: '2025-01', stockIn: 4.2, stockOut: 2.3 },
  { date: '2025-02', stockIn: 3.8, stockOut: 1.9 },
  { date: '2025-03', stockIn: 4.5, stockOut: 2.1 },
  { date: '2025-04', stockIn: 3.2, stockOut: 1.8 },
  { date: '2025-05', stockIn: 2.9, stockOut: 1.7 },
];

const mockRequestsByStatusData = [
  { name: 'Pending', stockIn: 24, stockOut: 12 },
  { name: 'Processing', stockIn: 18, stockOut: 8 },
  { name: 'Completed', stockIn: 65, stockOut: 42 },
  { name: 'Rejected', stockIn: 8, stockOut: 5 },
];

const mockUserPerformanceData = [
  { name: 'John D.', processed: 124, avgTime: 3.2 },
  { name: 'Sarah M.', processed: 98, avgTime: 2.8 },
  { name: 'Robert K.', processed: 145, avgTime: 2.5 },
  { name: 'Emily T.', processed: 87, avgTime: 3.7 },
  { name: 'Michael P.', processed: 110, avgTime: 3.1 },
];

const StockProcessingReport: React.FC = () => {
  // Mock functions for export (would be implemented with actual data in production)
  const handleExportCsv = () => {
    console.log('Export to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
  };

  return (
    <ReportLayout
      title="Stock Processing Performance Report"
      description="Analysis of stock request processing times and performance metrics"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Avg. Stock-in Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.7 hours</div>
            <p className="text-sm text-muted-foreground mt-1">From submission to completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Avg. Stock-out Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.9 hours</div>
            <p className="text-sm text-muted-foreground mt-1">From request to approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">43.2/day</div>
            <p className="text-sm text-muted-foreground mt-1">Average requests processed daily</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockProcessingTimeData}
          keys={['stockIn', 'stockOut']}
          title="Average Processing Time Trend"
          xAxisKey="date"
          xAxisLabel="Month"
          yAxisLabel="Hours"
        />

        <BarChart
          data={mockRequestsByStatusData}
          keys={['stockIn', 'stockOut']}
          title="Requests by Status"
          xAxisLabel="Status"
          yAxisLabel="Count"
        />
      </div>

      <div className="mb-6">
        <BarChart
          data={mockUserPerformanceData}
          keys={['processed', 'avgTime']}
          title="User Processing Performance"
          xAxisLabel="User"
          yAxisLabel="Count / Hours"
          height={400}
        />
      </div>
    </ReportLayout>
  );
};

export default StockProcessingReport;
