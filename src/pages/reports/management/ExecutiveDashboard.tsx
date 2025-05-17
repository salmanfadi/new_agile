
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

// Mock data for the executive dashboard
const mockInventoryValueTrendData = [
  { date: '2025-01', value: 245000 },
  { date: '2025-02', value: 280000 },
  { date: '2025-03', value: 310000 },
  { date: '2025-04', value: 290000 },
  { date: '2025-05', value: 320000 },
];

const mockMovementTrendData = [
  { date: '2025-01', in: 4500, out: 3800, net: 700 },
  { date: '2025-02', in: 5200, out: 4200, net: 1000 },
  { date: '2025-03', in: 4800, out: 5100, net: -300 },
  { date: '2025-04', in: 6100, out: 4900, net: 1200 },
  { date: '2025-05', in: 5800, out: 5200, net: 600 },
];

const mockWarehouseUtilizationData = [
  { name: 'Warehouse A', value: 78 },
  { name: 'Warehouse B', value: 84 },
  { name: 'Warehouse C', value: 90 },
  { name: 'Warehouse D', value: 77 },
];

const mockTopProducts = [
  { id: 'prod-001', name: 'Premium Widgets', quantity: 1250, value: 62500 },
  { id: 'prod-002', name: 'Standard Gadgets', quantity: 980, value: 39200 },
  { id: 'prod-003', name: 'Luxury Items', quantity: 450, value: 90000 },
  { id: 'prod-004', name: 'Basic Components', quantity: 1600, value: 32000 },
  { id: 'prod-005', name: 'Custom Solutions', quantity: 320, value: 48000 },
];

const ExecutiveDashboard: React.FC = () => {
  // In a real implementation, these states and data would come from a hook like useExecutiveDashboard
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: new Date('2025-01-01'),
      to: new Date('2025-05-31')
    }
  });
  
  const handleExportCsv = () => {
    console.log('Export to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
  };

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Calculate KPIs
  const currentInventoryValue = 320000;
  const inventoryValueChange = 9.6; // % change from last period
  const turnoverRate = 4.2;
  const turnoverRateChange = 0.3;
  const avgProcessingTime = 2.8;
  const avgProcessingTimeChange = -0.5;

  return (
    <ReportLayout
      title="Executive Dashboard"
      description="Key performance metrics and business insights"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showDateRange
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(currentInventoryValue / 1000).toFixed(1)}K</div>
            <div className="flex items-center mt-1">
              <span className={`text-sm ${inventoryValueChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {inventoryValueChange > 0 ? '+' : ''}{inventoryValueChange}%
              </span>
              <span className="text-sm text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Inventory Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{turnoverRate.toFixed(1)}</div>
            <div className="flex items-center mt-1">
              <span className={`text-sm ${turnoverRateChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {turnoverRateChange > 0 ? '+' : ''}{turnoverRateChange}
              </span>
              <span className="text-sm text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Avg. Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgProcessingTime} hrs</div>
            <div className="flex items-center mt-1">
              <span className={`text-sm ${avgProcessingTimeChange < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {avgProcessingTimeChange > 0 ? '+' : ''}{avgProcessingTimeChange} hrs
              </span>
              <span className="text-sm text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockInventoryValueTrendData}
          keys={['value']}
          title="Inventory Value Trend"
          xAxisKey="date"
          xAxisLabel="Month"
          yAxisLabel="Value ($)"
        />
        
        <PieChart 
          data={mockWarehouseUtilizationData}
          title="Warehouse Utilization"
        />
      </div>
      
      <div className="mb-6">
        <LineChart
          data={mockMovementTrendData}
          keys={['in', 'out', 'net']}
          title="Inventory Movement Trend"
          xAxisKey="date"
          xAxisLabel="Month"
          yAxisLabel="Quantity"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Top Products by Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${product.value.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {((product.value / currentInventoryValue) * 100).toFixed(1)}%
                    </TableCell>
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

export default ExecutiveDashboard;
