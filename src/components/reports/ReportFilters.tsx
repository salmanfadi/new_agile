
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

export interface ReportFiltersProps {
  filters?: ReportFiltersType;
  onFiltersChange?: (newFilters: Partial<ReportFiltersType>) => void;
  showDateRange?: boolean;
  showWarehouse?: boolean;
  showProduct?: boolean;
  showStatus?: boolean;
  showUser?: boolean;
  showMovementType?: boolean;
}

export const ReportFilters = ({
  filters,
  onFiltersChange,
  showDateRange = false,
  showWarehouse = false,
  showProduct = false,
  showStatus = false,
  showUser = false,
  showMovementType = false,
}: ReportFiltersProps) => {
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    onFiltersChange?.({ dateRange: range });
  };

  const handleWarehouseChange = (value: string) => {
    onFiltersChange?.({ warehouse: value });
  };

  const handleProductChange = (value: string) => {
    onFiltersChange?.({ product: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange?.({ status: value });
  };
  
  const handleUserChange = (value: string) => {
    onFiltersChange?.({ user: value });
  };
  
  const handleMovementTypeChange = (value: string) => {
    onFiltersChange?.({ movementType: value });
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {showDateRange && (
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DatePickerWithRange 
              date={filters?.dateRange ? {
                from: filters.dateRange.from,
                to: filters.dateRange.to
              } : undefined} 
              onDateChange={handleDateRangeChange}
            />
          </div>
        )}
        
        {showWarehouse && (
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={filters?.warehouse} onValueChange={handleWarehouseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                <SelectItem value="warehouse-c">Warehouse C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showProduct && (
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={filters?.product} onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="product-1">Product 1</SelectItem>
                <SelectItem value="product-2">Product 2</SelectItem>
                <SelectItem value="product-3">Product 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showStatus && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters?.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showUser && (
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={filters?.user} onValueChange={handleUserChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="user-1">John Smith</SelectItem>
                <SelectItem value="user-2">Maria Garcia</SelectItem>
                <SelectItem value="user-3">David Lee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showMovementType && (
          <div className="space-y-2">
            <Label>Movement Type</Label>
            <Select value={filters?.movementType} onValueChange={handleMovementTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock-in">Stock In</SelectItem>
                <SelectItem value="stock-out">Stock Out</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
