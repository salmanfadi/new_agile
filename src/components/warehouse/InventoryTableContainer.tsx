
import React, { useState } from 'react';
import { InventoryTable } from '@/components/warehouse/InventoryTable';
import InventoryPagination from './InventoryPagination';
import { useInventoryPagination } from '@/hooks/useInventoryPagination';
import { InventoryItem } from '@/hooks/useInventoryData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface InventoryTableContainerProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  highlightedBarcode: string | null;
  title?: string;
}

export const InventoryTableContainer: React.FC<InventoryTableContainerProps> = ({
  inventoryItems,
  isLoading,
  error,
  highlightedBarcode,
  title = 'Inventory Items'
}) => {
  const [sortField, setSortField] = useState<keyof InventoryItem>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Sort inventory items
  const sortedItems = [...inventoryItems].sort((a, b) => {
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
    
    // String comparison for other fields
    const aValue = a[sortField]?.toString() || '';
    const bValue = b[sortField]?.toString() || '';
    return sortDirection === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
  
  // Set up pagination
  const { 
    currentPage, 
    pageSize, 
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize
  } = useInventoryPagination({
    items: sortedItems,
    initialPage: 1,
    initialPageSize: 20
  });
  
  const handleSort = (field: keyof InventoryItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const exportToCSV = () => {
    // Prepare CSV data
    const headers = [
      'Product Name',
      'Barcode',
      'Quantity',
      'Warehouse',
      'Location',
      'Status',
      'Color',
      'Size',
      'Last Updated'
    ];
    
    const csvData = sortedItems.map(item => [
      item.productName,
      item.barcode,
      item.quantity,
      item.warehouseName,
      item.locationDetails,
      item.status,
      item.color || '',
      item.size || '',
      item.lastUpdated
    ]);
    
    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => 
        // Handle commas in fields by wrapping in quotes
        `"${String(cell).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {inventoryItems.length > 0 && (
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
          inventoryItems={paginatedItems} 
          isLoading={isLoading} 
          error={error}
          highlightedBarcode={highlightedBarcode}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
        
        {inventoryItems.length > 0 && (
          <InventoryPagination 
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryTableContainer;
