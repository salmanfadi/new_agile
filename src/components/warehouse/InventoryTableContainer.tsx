import React, { useState, useEffect } from 'react';
import { InventoryTable } from '@/components/warehouse/InventoryTable';
import InventoryPagination from './InventoryPagination';
import { useInventoryData } from '@/hooks/useInventoryData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface InventoryTableContainerProps {
  warehouseFilter: string;
  batchFilter: string;
  statusFilter: string;
  searchTerm: string;
  highlightedBarcode: string | null;
  title?: string;
}

export const InventoryTableContainer: React.FC<InventoryTableContainerProps> = ({
  warehouseFilter,
  batchFilter,
  statusFilter,
  searchTerm,
  highlightedBarcode,
  title = 'Inventory Items',
}) => {
  const [sortField, setSortField] = useState<'lastUpdated' | 'quantity' | 'productName'>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [warehouseFilter, batchFilter, statusFilter, searchTerm]);

  const { data, isLoading, error } = useInventoryData(
    warehouseFilter,
    batchFilter,
    statusFilter,
    searchTerm,
    page,
    pageSize
  );

  // Sorting (client-side for current page)
  const sortedItems = (data?.data ?? []).sort((a, b) => {
    if (sortField === 'quantity') {
      return sortDirection === 'asc' 
        ? a.quantity - b.quantity 
        : b.quantity - a.quantity;
    }
    if (sortField === 'lastUpdated') {
      return sortDirection === 'asc'
        ? new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
        : new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
    if (sortField === 'productName') {
      return sortDirection === 'asc'
        ? a.productName.localeCompare(b.productName)
        : b.productName.localeCompare(a.productName);
    }
    return 0;
  });

  const handleSort = (field: 'lastUpdated' | 'quantity' | 'productName') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    // Export only the current page
    if (!sortedItems.length) return;
    const csvRows = [
      [
        'Product',
        'Barcode',
        'Quantity',
        'Warehouse',
        'Location',
        'Status',
        'Color',
        'Size',
        'Source',
        'Last Updated',
      ],
      ...sortedItems.map((item) => [
        item.productName,
        item.barcode,
        item.quantity,
        item.warehouseName,
        item.locationDetails,
        item.status,
        item.color ?? '',
        item.size ?? '',
        item.source ?? '',
        item.lastUpdated,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_page.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {sortedItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <InventoryTable
          inventoryItems={sortedItems}
          isLoading={isLoading}
          error={error as Error | null}
          highlightedBarcode={highlightedBarcode}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
        {(data?.totalCount ?? 0) > 0 && (
          <InventoryPagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={data?.totalCount ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryTableContainer;
