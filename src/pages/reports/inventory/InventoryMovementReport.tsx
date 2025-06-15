
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { format } from 'date-fns';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInventoryMovementReport } from '@/hooks/reports/useInventoryMovementReport';
import { ReportFilters as ReportFiltersType, DataItem } from '@/types/reports';

// Mock chart data
const mockMovementTrendData = [
  {
    date: 'Jan',
    'Stock In': 320,
    'Stock Out': 240,
    'Transfer': 180,
    'Adjustment': 40
  },
  {
    date: 'Feb',
    'Stock In': 350,
    'Stock Out': 290,
    'Transfer': 210,
    'Adjustment': 30
  },
  {
    date: 'Mar',
    'Stock In': 380,
    'Stock Out': 310,
    'Transfer': 200,
    'Adjustment': 25
  },
  {
    date: 'Apr',
    'Stock In': 420,
    'Stock Out': 345,
    'Transfer': 230,
    'Adjustment': 35
  },
  {
    date: 'May',
    'Stock In': 450,
    'Stock Out': 370,
    'Transfer': 250,
    'Adjustment': 40
  }
];

const mockProductMovements = [
  {
    name: 'Product A',
    value: 35
  },
  {
    name: 'Product B',
    value: 25
  },
  {
    name: 'Product C',
    value: 20
  },
  {
    name: 'Product D',
    value: 10
  },
  {
    name: 'Product E',
    value: 10
  }
];

// Convert to use 'name' property
const mockWarehouseMovements: DataItem[] = [
  {
    name: 'Warehouse A',
    'Stock In': 180,
    'Stock Out': 120
  },
  {
    name: 'Warehouse B',
    'Stock In': 150,
    'Stock Out': 130
  },
  {
    name: 'Warehouse C',
    'Stock In': 120,
    'Stock Out': 95
  }
];

const InventoryMovementReport: React.FC = () => {
  const { data, loading, error, filters, updateFilters, resetFilters } = useInventoryMovementReport();
  
  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    updateFilters(newFilters);
  };
  
  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting inventory movement data to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Exporting inventory movement data to PDF');
  };

  return (
    <ReportLayout 
      title="Inventory Movement Report" 
      description="Analysis of inventory movements, transfers and adjustments"
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
          showMovementType
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalItems}</div>
            <p className="text-sm text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Stock In Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.byMovementType?.['stock-in'] || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Items received</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Stock Out Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.byMovementType?.['stock-out'] || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Items dispatched</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockMovementTrendData.map(item => ({
            name: item.date,
            'Stock In': item['Stock In'],
            'Stock Out': item['Stock Out'],
            'Transfer': item['Transfer'],
            'Adjustment': item['Adjustment']
          }))}
          keys={['Stock In', 'Stock Out', 'Transfer', 'Adjustment']}
          title="Movement Trend"
          xAxisKey="name"
          xAxisLabel="Month"
          yAxisLabel="Quantity"
        />
        
        <BarChart
          data={mockWarehouseMovements}
          keys={['Stock In', 'Stock Out']}
          title="Movements by Warehouse"
          xAxisLabel="Warehouse"
          yAxisLabel="Quantity"
        />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Movement Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.movements.slice(0, 10).map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{format(new Date(movement.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{movement.product_name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      movement.movement_type === 'stock-in' ? 'success' : 
                      movement.movement_type === 'stock-out' ? 'destructive' : 
                      'outline'
                    }>
                      {movement.movement_type === 'stock-in' ? 'Stock In' : 
                       movement.movement_type === 'stock-out' ? 'Stock Out' : 
                       movement.movement_type === 'transfer' ? 'Transfer' : 
                       'Adjustment'}
                    </Badge>
                  </TableCell>
                  <TableCell>{Math.abs(movement.quantity)}</TableCell>
                  <TableCell>{movement.warehouse_name}</TableCell>
                  <TableCell>
                    {movement.reference_table === 'stock_in' ? 'Stock In #' : 
                     movement.reference_table === 'stock_out' ? 'Stock Out #' : 
                     movement.reference_table === 'inventory_transfers' ? 'Transfer #' : 
                     'Adjustment #'}
                    {movement.reference_id.split('-').pop()}
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

export default InventoryMovementReport;
