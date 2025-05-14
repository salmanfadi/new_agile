
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Search, X } from 'lucide-react';

interface StockInFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  showStatus?: boolean;
  defaultStatus?: string;
}

export const StockInFilters: React.FC<StockInFiltersProps> = ({ 
  onFilterChange, 
  showStatus = true,
  defaultStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [status, setStatus] = useState<string>(defaultStatus || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const handleSearch = () => {
    const filters: Record<string, any> = {};
    
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    if (status && showStatus) {
      filters.status = status;
    } else if (defaultStatus && !showStatus) {
      filters.status = defaultStatus;
    }
    
    if (dateRange?.from) {
      filters.fromDate = dateRange.from;
      if (dateRange.to) {
        filters.toDate = dateRange.to;
      }
    }
    
    onFilterChange(filters);
  };
  
  const handleClear = () => {
    setSearchTerm('');
    if (showStatus) {
      setStatus('');
    }
    setDateRange(undefined);
    
    const filters: Record<string, any> = {};
    if (defaultStatus && !showStatus) {
      filters.status = defaultStatus;
    }
    
    onFilterChange(filters);
  };
  
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by ID, product, source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {showStatus && (
          <div className="w-[200px]">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="w-[300px]">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="default" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
