
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { useExecutiveDashboard } from '@/hooks/reports/useExecutiveDashboard';
import { formatCurrency } from '@/utils/formatters';

const ExecutiveDashboard: React.FC = () => {
  const { 
    data, 
    isLoading, 
    error 
  } = useExecutiveDashboard();

  // Mock time series data
  const stockMovementTrendData = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        name: date.toISOString().split('T')[0],
        in: Math.floor(Math.random() * 100),
        out: Math.floor(Math.random() * 80),
        net: Math.floor(Math.random() * 40) - 20
      };
    }).reverse();
  }, []);

  // Format operational metrics for chart
  const operationalMetricsData = React.useMemo(() => {
    return [
      { name: 'Processing Time', current: 1.8, target: 1.5, previous: 2.2 },
      { name: 'Inventory Accuracy', current: 98, target: 99, previous: 97 },
      { name: 'Order Fulfillment', current: 94, target: 98, previous: 92 },
      { name: 'Storage Utilization', current: 82, target: 85, previous: 78 },
    ];
  }, []);

  // Format warehouse distribution for chart
  const warehouseDistributionData = React.useMemo(() => {
    if (!data || !data.warehousePerformance) return [];
    return data.warehousePerformance.map(warehouse => ({
      name: warehouse.warehouse_name,
      value: warehouse.utilization
    }));
  }, [data]);

  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting executive dashboard data to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Exporting executive dashboard data to PDF');
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <ReportLayout 
      title="Executive Dashboard" 
      description="High-level overview of warehouse operations and key performance indicators"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
      loading={isLoading}
      error={error}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-apple-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(data.totalInventoryValue)}</div>
            <p className="text-sm text-muted-foreground mt-1">Total value of inventory</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalProducts}</div>
            <p className="text-sm text-muted-foreground mt-1">Products in system</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.activeWarehouses}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-apple-sm">
          <CardHeader>
            <CardTitle>Stock Movement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={stockMovementTrendData}
              keys={['in', 'out', 'net']}
              xAxisKey="name"
              xAxisLabel="Date"
              yAxisLabel="Quantity"
              height={300}
              title="Stock Movement Trend"
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-sm">
          <CardHeader>
            <CardTitle>Top Products by Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium w-6 text-center">{index + 1}.</span>
                    <span className="font-medium ml-2">{product.product_name}</span>
                  </div>
                  <span className="font-mono">{product.total_quantity}</span>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-apple-sm">
          <CardHeader>
            <CardTitle>Key Operational Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={operationalMetricsData}
              keys={['current', 'target', 'previous']}
              xAxisLabel="Metric"
              yAxisLabel="Value"
              height={300}
              title="Key Operational Metrics"
            />
          </CardContent>
        </Card>
        
        <Card className="shadow-apple-sm">
          <CardHeader>
            <CardTitle>Warehouse Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={warehouseDistributionData}
              height={300}
              title="Warehouse Performance Distribution"
            />
          </CardContent>
        </Card>
      </div>
    </ReportLayout>
  );
};

export default ExecutiveDashboard;
