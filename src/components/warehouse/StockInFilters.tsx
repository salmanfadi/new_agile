
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface StockInFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  showStatus?: boolean;
  defaultStatus?: string;
}

export const StockInFilters: React.FC<StockInFiltersProps> = ({
  onFilterChange,
  showStatus = true,
  defaultStatus = 'pending',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [status, setStatus] = useState<string>(defaultStatus);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const handleSearch = () => {
    const filters: Record<string, any> = {};
    
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    if (showStatus && status) {
      filters.status = status;
    } else if (defaultStatus && !showStatus) {
      filters.status = defaultStatus;
    }
    
    if (dateRange?.from) {
      filters.fromDate = dateRange.from;
    }
    
    if (dateRange?.to) {
      filters.toDate = dateRange.to;
    }
    
    onFilterChange(filters);
  };
  
  const handleClear = () => {
    setSearchTerm('');
    if (showStatus) {
      setStatus(defaultStatus);
    }
    setDateRange(undefined);
    
    const defaultFilters = showStatus ? { status: defaultStatus } : {};
    onFilterChange(defaultFilters);
  };
  
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by product or submitter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {showStatus && (
          <div className="w-[180px]">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="w-full sm:w-auto">
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

export default StockInFilters;
