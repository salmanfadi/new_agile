
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationFilter {
  actionType?: string;
  isRead?: boolean;
}

interface NotificationFiltersProps {
  currentFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  currentFilter,
  onFilterChange
}) => {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Status</label>
        <Select
          value={currentFilter.isRead === undefined ? 'all' : currentFilter.isRead ? 'read' : 'unread'}
          onValueChange={(value) => {
            const isRead = value === 'all' ? undefined : value === 'read';
            onFilterChange({ ...currentFilter, isRead });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-end">
        <Button
          variant="outline"
          onClick={() => onFilterChange({})}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
};
