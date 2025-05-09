
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface NotificationFiltersProps {
  currentFilter: {
    actionType?: string;
    isRead?: boolean;
  };
  onFilterChange: (filter: {
    actionType?: string;
    isRead?: boolean;
  }) => void;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  currentFilter,
  onFilterChange,
}) => {
  const handleActionTypeChange = (value: string) => {
    onFilterChange({
      ...currentFilter,
      actionType: value || undefined,
    });
  };

  const handleStatusChange = (value: string) => {
    let isRead: boolean | undefined = undefined;
    if (value === 'read') isRead = true;
    if (value === 'unread') isRead = false;
    
    onFilterChange({
      ...currentFilter,
      isRead,
    });
  };

  const handleResetFilters = () => {
    onFilterChange({});
  };

  return (
    <Card className="bg-muted/20 border-dashed">
      <CardContent className="pt-4 grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Action Type</label>
          <Select
            value={currentFilter.actionType || ''}
            onValueChange={handleActionTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All action types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All action types</SelectItem>
              <SelectItem value="barcode_generated">Barcode Generated</SelectItem>
              <SelectItem value="product_created">Product Created</SelectItem>
              <SelectItem value="stock_in">Stock In</SelectItem>
              <SelectItem value="stock_out">Stock Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select
            value={currentFilter.isRead === undefined 
              ? '' 
              : (currentFilter.isRead ? 'read' : 'unread')}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="mb-0.5"
          >
            <X className="h-4 w-4 mr-1" /> Clear filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
