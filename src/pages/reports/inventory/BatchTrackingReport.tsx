
import React, { useState, useCallback } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PieChart } from '@/components/reports/charts/PieChart';
import { BarChart } from '@/components/reports/charts/BarChart';
import { useBatchTrackingReport } from '@/hooks/reports/useBatchTrackingReport';
import { exportToCsv, exportToPdf, prepareChartData } from '@/utils/exportUtils';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

const BatchTrackingReport = () => {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: { from: null, to: null },
  });
  
  const { data, isLoading, error, setFilters: updateFilters } = useBatchTrackingReport(filters);
  
  const handleFilterChange = useCallback((newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  }, [updateFilters]);
  
  const handleExportCsv = useCallback(() => {
    if (data?.batches && data.batches.length > 0) {
      exportToCsv(data.batches, 'batch-tracking-report');
    }
  }, [data]);
  
  const handleExportPdf = useCallback(() => {
    if (data?.batches && data.batches.length > 0) {
      exportToPdf(
        data.batches, 
        'batch-tracking-report',
        'Batch Tracking Report',
        [
          { header: 'Product', accessor: 'productName' },
          { header: 'Warehouse', accessor: 'warehouseName' },
          { header: 'Quantity', accessor: 'totalQuantity' },
          { header: 'Boxes', accessor: 'totalBoxes' },
          { header: 'Source', accessor: 'source' },
          { header: 'Status', accessor: 'status' },
          { header: 'Processed By', accessor: 'processedBy' },
          { header: 'Processed At', accessor: 'processedAt' }
        ]
      );
    }
  }, [data]);
  
  // Prepare chart data
  const statusChartData = data ? prepareChartData(data.byStatus) : [];
  const sourceChartData = data ? prepareChartData(data.bySource) : [];
  
  const batchStatusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  return (
    <ReportLayout
      title="Batch Tracking Report"
      description="Track processed batches and their current status"
      loading={isLoading}
      error={error}
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters 
        onFilterChange={handleFilterChange}
        showWarehouse={true}
        showStatus={true}
        statusOptions={batchStatusOptions}
        defaultFilters={filters}
      />
      
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Total Batches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalBatches.toLocaleString()}</div>
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
                <CardTitle className="text-lg font-medium">Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(data.bySource).length}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PieChart 
              data={statusChartData}
              title="Batches by Status"
            />
            <BarChart
              data={sourceChartData.map(item => ({ name: item.name, quantity: item.value }))}
              keys={['quantity']}
              title="Quantity by Source"
            />
          </div>
          
          {/* Batches Table */}
          <Card>
            <CardHeader>
              <CardTitle>Processed Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Boxes</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.batches.slice(0, 10).map(batch => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.productName}</TableCell>
                        <TableCell>{batch.warehouseName}</TableCell>
                        <TableCell className="text-right">{batch.totalQuantity}</TableCell>
                        <TableCell className="text-right">{batch.totalBoxes}</TableCell>
                        <TableCell>{batch.source}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                            batch.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {batch.status}
                          </span>
                        </TableCell>
                        <TableCell>{batch.processedBy}</TableCell>
                        <TableCell>{batch.processedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.batches.length > 10 && (
                <div className="text-sm text-center mt-2 text-gray-500">
                  Showing 10 of {data.batches.length} batches. Export to see all data.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default BatchTrackingReport;
