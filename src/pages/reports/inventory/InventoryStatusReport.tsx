
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { useInventoryStatusReport } from '@/hooks/reports/useInventoryStatusReport';
import { DataItem } from '@/types/reports';

// Mock data for warehouses chart - fix to use name property
const mockWarehouseData: DataItem[] = [
  { name: 'Warehouse A', active: 2500, reserved: 350, damaged: 150 },
  { name: 'Warehouse B', active: 1800, reserved: 250, damaged: 100 },
  { name: 'Warehouse C', active: 900, reserved: 150, damaged: 50 },
];

// Mock data for status distribution
const mockStatusDistribution = [
  { name: 'Active', value: 5200 },
  { name: 'Reserved', value: 750 },
  { name: 'Damaged', value: 300 },
];

const InventoryStatusReport: React.FC = () => {
  const { data, loading, error, filters, updateFilters } = useInventoryStatusReport();

  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting inventory status data to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Exporting inventory status data to PDF');
  };

  return (
    <ReportLayout 
      title="Inventory Status Report" 
      description="Current inventory levels and status across warehouses"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
      loading={loading} // Changed from isLoading to loading
    >
      <div className="mb-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={updateFilters}
          showWarehouse
          showProduct
          showStatus
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalItems}</div>
            <p className="text-sm text-muted-foreground mt-1">Unique inventory entries</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalQuantity.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">Combined total units</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.byStatus?.active || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Available for use</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={mockWarehouseData}
          keys={['active', 'reserved', 'damaged']}
          title="Inventory by Warehouse"
          xAxisLabel="Warehouse"
          yAxisLabel="Quantity"
          // Remove stacked prop if it doesn't exist in BarChartProps
        />
        
        <PieChart 
          data={mockStatusDistribution}
          title="Status Distribution"
        />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.slice(0, 10).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.productSku}</TableCell>
                  <TableCell>{item.warehouseName}</TableCell>
                  <TableCell>{item.locationName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center mr-2">
                      <span className="w-3 h-3 rounded-full mr-1" style={{ 
                        backgroundColor: item.color.toLowerCase()
                      }}></span>
                      {item.color}
                    </span>
                    <span className="inline-flex items-center">
                      <span className="font-mono text-xs mr-1">◻</span>
                      {item.size}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'active' ? 'success' :
                      item.status === 'reserved' ? 'outline' :
                      'destructive'
                    }>
                      {item.status}
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

export default InventoryStatusReport;
