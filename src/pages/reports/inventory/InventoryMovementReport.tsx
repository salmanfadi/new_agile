
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilters as ReportFiltersType } from '@/types/reports';
import { InventoryMovement } from '@/types/inventory';
import { format } from 'date-fns';

// Mock data - in production this would come from useInventoryMovementReport hook
const mockTrendData = [
  { date: '2025-01', inQuantity: 4500, outQuantity: 3800, netChange: 700 },
  { date: '2025-02', inQuantity: 5200, outQuantity: 4200, netChange: 1000 },
  { date: '2025-03', inQuantity: 4800, outQuantity: 5100, netChange: -300 },
  { date: '2025-04', inQuantity: 6100, outQuantity: 4900, netChange: 1200 },
  { date: '2025-05', inQuantity: 5800, outQuantity: 5200, netChange: 600 },
];

const mockMovementsByProductData = [
  { name: 'Premium Widgets', inQuantity: 1200, outQuantity: 980 },
  { name: 'Standard Gadgets', inQuantity: 950, outQuantity: 850 },
  { name: 'Luxury Items', inQuantity: 600, outQuantity: 450 },
  { name: 'Basic Components', inQuantity: 1800, outQuantity: 1600 },
  { name: 'Custom Solutions', inQuantity: 450, outQuantity: 320 },
];

const mockMovementsByWarehouseData = [
  { name: 'Main Warehouse', inQuantity: 2800, outQuantity: 2400 },
  { name: 'Secondary Warehouse', inQuantity: 1650, outQuantity: 1200 },
  { name: 'Distribution Center', inQuantity: 550, outQuantity: 600 },
];

// Mock inventory movements data
const mockMovements: InventoryMovement[] = [
  {
    id: '1',
    product_id: 'prod-001',
    warehouse_id: 'wh-001',
    location_id: 'loc-001',
    movement_type: 'in',
    quantity: 250,
    reference_id: 'si-001',
    reference_type: 'stock_in',
    timestamp: '2025-05-01T10:30:00Z',
    user_id: 'user-001',
    details: { source: 'Supplier A', notes: 'Regular delivery' },
    products: { name: 'Premium Widgets', sku: 'PW-001' },
    warehouses: { name: 'Main Warehouse' },
    locations: { floor: 1, zone: 'A' },
    reference_document: { id: 'si-001', type: 'stock_in' }
  },
  {
    id: '2',
    product_id: 'prod-002',
    warehouse_id: 'wh-001',
    location_id: 'loc-002',
    movement_type: 'in',
    quantity: 180,
    reference_id: 'si-002',
    reference_type: 'stock_in',
    timestamp: '2025-05-02T14:15:00Z',
    user_id: 'user-002',
    details: { source: 'Supplier B', notes: 'Special order' },
    products: { name: 'Standard Gadgets', sku: 'SG-001' },
    warehouses: { name: 'Main Warehouse' },
    locations: { floor: 1, zone: 'B' },
    reference_document: { id: 'si-002', type: 'stock_in' }
  },
  {
    id: '3',
    product_id: 'prod-001',
    warehouse_id: 'wh-001',
    location_id: 'loc-001',
    movement_type: 'out',
    quantity: 120,
    reference_id: 'so-001',
    reference_type: 'stock_out',
    timestamp: '2025-05-03T09:45:00Z',
    user_id: 'user-001',
    details: { destination: 'Customer XYZ', notes: 'Urgent order' },
    products: { name: 'Premium Widgets', sku: 'PW-001' },
    warehouses: { name: 'Main Warehouse' },
    locations: { floor: 1, zone: 'A' },
    reference_document: { id: 'so-001', type: 'stock_out' }
  },
  {
    id: '4',
    product_id: 'prod-003',
    warehouse_id: 'wh-002',
    location_id: 'loc-003',
    movement_type: 'transfer_in',
    quantity: 75,
    reference_id: 'tr-001',
    reference_type: 'transfer',
    timestamp: '2025-05-04T11:20:00Z',
    user_id: 'user-003',
    details: { source: 'Main Warehouse', notes: 'Stock balancing' },
    products: { name: 'Luxury Items', sku: 'LI-001' },
    warehouses: { name: 'Secondary Warehouse' },
    locations: { floor: 2, zone: 'C' },
    reference_document: { id: 'tr-001', type: 'transfer' }
  }
];

const InventoryMovementReport: React.FC = () => {
  // In a real implementation, these states and data would come from the useInventoryMovementReport hook
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: new Date('2025-05-01'),
      to: new Date('2025-05-31')
    }
  });
  
  const handleExportCsv = () => {
    console.log('Export to CSV');
    // In production, this would use a utility function to export the data
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
    // In production, this would use a utility function to export the data
  };

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    // In production, this would trigger a data refresh
  };

  const getMovementTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'in': 'Stock In',
      'out': 'Stock Out',
      'transfer_in': 'Transfer In',
      'transfer_out': 'Transfer Out',
      'adjustment_in': 'Adjustment (+)',
      'adjustment_out': 'Adjustment (-)',
    };
    return types[type] || type;
  };

  const getMovementTypeVariant = (type: string): "default" | "outline" | "secondary" | "destructive" | "success" => {
    if (type === 'in' || type === 'transfer_in' || type === 'adjustment_in') return 'success';
    if (type === 'out' || type === 'transfer_out' || type === 'adjustment_out') return 'destructive';
    return 'default';
  };

  return (
    <ReportLayout
      title="Inventory Movement Report"
      description="Track and analyze inventory movements over time"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showDateRange
        showWarehouse
        showProduct
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5,000</div>
            <p className="text-sm text-muted-foreground mt-1">Units received</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4,200</div>
            <p className="text-sm text-muted-foreground mt-1">Units shipped/consumed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Net Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">+800</div>
            <p className="text-sm text-muted-foreground mt-1">Net inventory change</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <LineChart
          data={mockTrendData}
          keys={['inQuantity', 'outQuantity', 'netChange']}
          title="Inventory Movement Trend"
          xAxisKey="date"
          xAxisLabel="Month"
          yAxisLabel="Quantity"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={mockMovementsByProductData}
          keys={['inQuantity', 'outQuantity']}
          title="Movements by Product"
          xAxisLabel="Product"
          yAxisLabel="Quantity"
        />
        
        <BarChart
          data={mockMovementsByWarehouseData}
          keys={['inQuantity', 'outQuantity']}
          title="Movements by Warehouse"
          xAxisLabel="Warehouse"
          yAxisLabel="Quantity"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Movement Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.timestamp), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{movement.products?.name}</TableCell>
                    <TableCell>
                      <Badge variant={getMovementTypeVariant(movement.movement_type)}>
                        {getMovementTypeLabel(movement.movement_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.warehouses?.name}</TableCell>
                    <TableCell className="text-right">
                      {movement.quantity}
                    </TableCell>
                    <TableCell>
                      {movement.reference_type === 'stock_in' ? 'Stock In' :
                       movement.reference_type === 'stock_out' ? 'Stock Out' :
                       movement.reference_type === 'transfer' ? 'Transfer' : 
                       movement.reference_type}
                      #{movement.reference_id.split('-').pop()}
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

export default InventoryMovementReport;
