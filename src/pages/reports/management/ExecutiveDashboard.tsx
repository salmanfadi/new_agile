
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { useExecutiveDashboard } from '@/hooks/reports/useExecutiveDashboard';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

// Mock chart data
const mockInventoryValueData = [
  { month: 'Jan', value: 720000 },
  { month: 'Feb', value: 740000 },
  { month: 'Mar', value: 785000 },
  { month: 'Apr', value: 810000 },
  { month: 'May', value: 845000 },
];

const mockInventoryTurnoverData = [
  { month: 'Jan', turnover: 3.2 },
  { month: 'Feb', turnover: 3.4 },
  { month: 'Mar', turnover: 3.1 },
  { month: 'Apr', turnover: 3.6 },
  { month: 'May', turnover: 3.8 },
];

const mockOperationalMetricsData = [
  { metric: 'Processing Time', current: 1.8, target: 1.5, previous: 2.2 },
  { metric: 'Inventory Accuracy', current: 98, target: 99, previous: 97 },
  { metric: 'Order Fulfillment', current: 94, target: 98, previous: 92 },
  { metric: 'Storage Utilization', current: 82, target: 85, previous: 78 },
];

const mockWarehouseDistribution = [
  { name: 'Warehouse A', value: 35 },
  { name: 'Warehouse B', value: 30 },
  { name: 'Warehouse C', value: 20 },
  { name: 'Warehouse D', value: 15 },
];

const ExecutiveDashboard: React.FC = () => {
  const { data, loading, error, filters, updateFilters } = useExecutiveDashboard();

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    updateFilters(newFilters);
  };

  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting executive dashboard data to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Exporting executive dashboard data to PDF');
  };

  return (
    <ReportLayout 
      title="Executive Dashboard" 
      description="High-level overview of warehouse operations and key performance indicators"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
      isLoading={loading}
    >
      <div className="mb-6">
        <ReportFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showDateRange
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$845,000</div>
            <p className="text-sm text-muted-foreground mt-1">Total value of inventory</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Inventory Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.8</div>
            <p className="text-sm text-muted-foreground mt-1">Average turns per year</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Operational Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">87%</div>
            <p className="text-sm text-muted-foreground mt-1">Overall KPI rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockInventoryValueData}
          keys={['value']}
          title="Inventory Value Trend"
          xAxisKey="month"
          xAxisLabel="Month"
          yAxisLabel="Value ($)"
        />
        
        <LineChart
          data={mockInventoryTurnoverData}
          keys={['turnover']}
          title="Inventory Turnover Rate"
          xAxisKey="month"
          xAxisLabel="Month"
          yAxisLabel="Turns"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={mockOperationalMetricsData}
          keys={['current', 'target', 'previous']}
          title="Key Operational Metrics"
          xAxisLabel="Metric"
          yAxisLabel="Value"
        />
        
        <PieChart
          data={mockWarehouseDistribution}
          title="Inventory Distribution by Warehouse"
        />
      </div>
    </ReportLayout>
  );
};

export default ExecutiveDashboard;
