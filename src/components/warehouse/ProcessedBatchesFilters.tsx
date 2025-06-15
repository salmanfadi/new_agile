
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from "react-day-picker";

interface ProcessedBatchesFiltersProps {
  onSearch: (searchTerm: string) => void;
  onDateChange: (dateRange: DateRange | undefined) => void;
  onReset: () => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  isLoading?: boolean;
}

export const ProcessedBatchesFilters: React.FC<ProcessedBatchesFiltersProps> = ({
  onSearch,
  onDateChange,
  onReset,
  onFilterChange,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    onSearch(searchTerm);
    if (onFilterChange) {
      onFilterChange({ searchTerm });
    }
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    onDateChange(range);
    if (onFilterChange) {
      onFilterChange({ dateRange: range });
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setDateRange(undefined);
    onReset();
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-md shadow">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Filter Batches</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by batch ID, product, etc."
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
          >
            Search
          </Button>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Date Range</label>
          <DatePickerWithRange date={dateRange} onDateChange={handleDateChange} />
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
