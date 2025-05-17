
import React, { useState, useCallback } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { LineChart } from '@/components/reports/charts/LineChart';
import { BarChart } from '@/components/reports/charts/BarChart';
import { useInventoryMovementReport } from '@/hooks/reports/useInventoryMovementReport';
import { exportToCsv, exportToPdf, prepareChartData } from '@/utils/exportUtils';
import { ReportFilters as ReportFiltersType } from '@/types/reports';
import { subDays } from 'date-fns';

const InventoryMovementReport = () => {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: { 
      from: subDays(new Date(), 30), // Last 30 days by default
      to: new Date() 
    },
  });
  
  const { data, dailyMovementData, isLoading, error, setFilters: updateFilters } = useInventoryMovementReport(filters);
  
  const handleFilterChange = useCallback((newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  }, [updateFilters]);
  
  const handleExportCsv = useCallback(() => {
    if (data?.movements && data.movements.length > 0) {
      exportToCsv(data.movements, 'inventory-movement-report');
    }
  }, [data]);
  
  const handleExportPdf = useCallback(() => {
    if (data?.movements && data.movements.length > 0) {
      exportToPdf(
        data.movements, 
        'inventory-movement-report',
        'Inventory Movement Report',
        [
          { header: 'Product', accessor: 'productName' },
          { header: 'Warehouse', accessor: 'warehouseName' },
          { header: 'Type', accessor: 'movementType' },
          { header: 'Direction', accessor: 'direction' },
          { header: 'Quantity', accessor: 'quantity' },
          { header: 'Date', accessor: 'date' },
          { header: 'User', accessor: 'performedBy' },
        ]
      );
    }
  }, [data]);
  
  // Prepare chart data for by-product chart
  const productChartData = data ? prepareChartData(data.byProduct, 'value', 5) : [];
  const warehouseChartData = data ? prepareChartData(data.byWarehouse) : [];
  
  const movementStatusOptions = [
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <ReportLayout
      title="Inventory Movement Analysis"
      description="Track inbound and outbound stock movements over time"
      loading={isLoading}
      error={error}
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters 
        onFilterChange={handleFilterChange}
        showWarehouse={true}
        showProduct={true}
        showStatus={true}
        statusOptions={movementStatusOptions}
        defaultFilters={filters}
      />
      
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{data.totalIn.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{data.totalOut.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Net Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${data.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.netChange >= 0 ? '+' : ''}{data.netChange.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            {dailyMovementData.length > 0 && (
              <LineChart 
                data={dailyMovementData}
                keys={['in', 'out', 'net']}
                title="Daily Inventory Movements"
                xAxisKey="date"
                xAxisLabel="Date"
                yAxisLabel="Quantity"
                colors={['#10b981', '#ef4444', '#3b82f6']}
              />
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChart
              data={productChartData.map(item => ({ name: item.name, value: item.value }))}
              keys={['value']}
              title="Net Change by Product (Top 5)"
              colors={productChartData.map(item => item.value >= 0 ? '#10b981' : '#ef4444')}
            />
            <BarChart
              data={warehouseChartData.map(item => ({ name: item.name, value: item.value }))}
              keys={['value']}
              title="Net Change by Warehouse"
              colors={warehouseChartData.map(item => item.value >= 0 ? '#10b981' : '#ef4444')}
            />
          </div>
          
          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.movements.slice(0, 10).map(movement => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-medium">{movement.productName}</TableCell>
                        <TableCell>{movement.movementType}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            movement.direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {movement.direction}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{movement.quantity}</TableCell>
                        <TableCell>{movement.warehouseName}</TableCell>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell>{movement.performedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.movements.length > 10 && (
                <div className="text-sm text-center mt-2 text-gray-500">
                  Showing 10 of {data.movements.length} movements. Export to see all data.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default InventoryMovementReport;
