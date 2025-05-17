
import React, { useState, useCallback } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PieChart } from '@/components/reports/charts/PieChart';
import { BarChart } from '@/components/reports/charts/BarChart';
import { useInventoryStatusReport } from '@/hooks/reports/useInventoryStatusReport';
import { exportToCsv, exportToPdf, prepareChartData } from '@/utils/exportUtils';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

const InventoryStatusReport = () => {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: { from: null, to: null },
  });
  
  const { data, isLoading, error, setFilters: updateFilters } = useInventoryStatusReport(filters);
  
  const handleFilterChange = useCallback((newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  }, [updateFilters]);
  
  const handleExportCsv = useCallback(() => {
    if (data?.items && data.items.length > 0) {
      exportToCsv(data.items, 'inventory-status-report');
    }
  }, [data]);
  
  const handleExportPdf = useCallback(() => {
    if (data?.items && data.items.length > 0) {
      exportToPdf(
        data.items, 
        'inventory-status-report',
        'Inventory Status Report',
        [
          { header: 'Product', accessor: 'productName' },
          { header: 'SKU', accessor: 'productSku' },
          { header: 'Warehouse', accessor: 'warehouseName' },
          { header: 'Location', accessor: 'locationDetails' },
          { header: 'Quantity', accessor: 'quantity' },
          { header: 'Status', accessor: 'status' }
        ]
      );
    }
  }, [data]);
  
  // Prepare chart data
  const statusChartData = data ? prepareChartData(data.byStatus) : [];
  const warehouseChartData = data ? prepareChartData(data.byWarehouse) : [];
  
  const statusOptions = [
    { label: 'Available', value: 'available' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'Sold', value: 'sold' },
    { label: 'Damaged', value: 'damaged' }
  ];

  return (
    <ReportLayout
      title="Inventory Status Report"
      description="Current inventory levels and stock status across warehouses"
      loading={isLoading}
      error={error}
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters 
        onFilterChange={handleFilterChange}
        showWarehouse={true}
        showLocation={true}
        showStatus={true}
        statusOptions={statusOptions}
        defaultFilters={filters}
      />
      
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalItems.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalQuantity.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Warehouses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(data.byWarehouse).length}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PieChart 
              data={statusChartData}
              title="Inventory by Status"
            />
            <BarChart
              data={warehouseChartData.map(item => ({ name: item.name, quantity: item.value }))}
              keys={['quantity']}
              title="Inventory by Warehouse"
            />
          </div>
          
          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.slice(0, 10).map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.productSku}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>{item.locationDetails}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            item.status === 'available' ? 'bg-green-100 text-green-800' :
                            item.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.items.length > 10 && (
                <div className="text-sm text-center mt-2 text-gray-500">
                  Showing 10 of {data.items.length} items. Export to see all data.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default InventoryStatusReport;
