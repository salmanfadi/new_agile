
import React, { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { Badge } from '@/components/ui/badge';

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
  const [source, setSource] = useState<string>('');
  const [status, setStatus] = useState<string>(defaultStatus || '');
  const [submittedBy, setSubmittedBy] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      source: '',
      status: defaultStatus || '',
      submittedBy: '',
      dateFrom: '',
      dateTo: ''
    }
  });

  // Apply default status filter if provided
  useEffect(() => {
    if (defaultStatus) {
      const filters: Record<string, any> = {};
      filters.status = defaultStatus;
      onFilterChange(filters);
      setActiveFilters(['status']);
    }
  }, [defaultStatus, onFilterChange]);

  const applyFilters = () => {
    const newFilters: Record<string, any> = {};
    const newActiveFilters: string[] = [];
    
    if (source) {
      newFilters.source = source;
      newActiveFilters.push('source');
    }
    
    if (status) {
      newFilters.status = status;
      newActiveFilters.push('status');
    }
    
    if (submittedBy) {
      newFilters.submitted_by = submittedBy;
      newActiveFilters.push('submitted_by');
    }
    
    if (dateRange.from) {
      newFilters.date_from = dateRange.from;
      newActiveFilters.push('date_from');
    }
    
    if (dateRange.to) {
      newFilters.date_to = dateRange.to;
      newActiveFilters.push('date_to');
    }
    
    setActiveFilters(newActiveFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setSource('');
    setStatus(defaultStatus || '');
    setSubmittedBy('');
    setDateRange({});
    form.reset({
      source: '',
      status: defaultStatus || '',
      submittedBy: '',
      dateFrom: '',
      dateTo: ''
    });
    
    const filters: Record<string, any> = {};
    if (defaultStatus) {
      filters.status = defaultStatus;
      setActiveFilters(['status']);
    } else {
      setActiveFilters([]);
    }
    
    onFilterChange(filters);
  };

  const removeFilter = (filter: string) => {
    switch (filter) {
      case 'source':
        setSource('');
        form.setValue('source', '');
        break;
      case 'status':
        setStatus(defaultStatus || '');
        form.setValue('status', defaultStatus || '');
        break;
      case 'submitted_by':
        setSubmittedBy('');
        form.setValue('submittedBy', '');
        break;
      case 'date_from':
        setDateRange(prev => ({ ...prev, from: undefined }));
        form.setValue('dateFrom', '');
        break;
      case 'date_to':
        setDateRange(prev => ({ ...prev, to: undefined }));
        form.setValue('dateTo', '');
        break;
    }
    
    setActiveFilters(prev => prev.filter(f => f !== filter));
    
    // Update filters
    const updatedFilters: Record<string, any> = {};
    if (filter !== 'source' && source) updatedFilters.source = source;
    if (filter !== 'status' && status) updatedFilters.status = status;
    if (filter !== 'submitted_by' && submittedBy) updatedFilters.submitted_by = submittedBy;
    if (filter !== 'date_from' && dateRange.from) updatedFilters.date_from = dateRange.from;
    if (filter !== 'date_to' && dateRange.to) updatedFilters.date_to = dateRange.to;
    
    // If we removed all filters but have a default status, apply it
    if (Object.keys(updatedFilters).length === 0 && defaultStatus) {
      updatedFilters.status = defaultStatus;
    }
    
    onFilterChange(updatedFilters);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Filter by source" 
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      field.onChange(e);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {showStatus && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    value={status} 
                    onValueChange={(value) => {
                      setStatus(value);
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Any Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="dateFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date From</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={dateRange.from || ''}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, from: e.target.value }));
                      field.onChange(e);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dateTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date To</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={dateRange.to || ''}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, to: e.target.value }));
                      field.onChange(e);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={clearFilters}
          >
            Clear
          </Button>
          <Button 
            type="button" 
            onClick={applyFilters}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </Form>
      
      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map(filter => {
            let label = filter;
            let value = '';
            
            switch (filter) {
              case 'source':
                value = source;
                break;
              case 'status':
                value = status;
                break;
              case 'submitted_by':
                value = submittedBy;
                break;
              case 'date_from':
                value = dateRange.from || '';
                label = 'From Date';
                break;
              case 'date_to':
                value = dateRange.to || '';
                label = 'To Date';
                break;
            }
            
            // Skip default status filter from display if it's the only one
            if (filter === 'status' && defaultStatus && status === defaultStatus && activeFilters.length === 1) {
              return null;
            }
            
            return (
              <Badge key={filter} variant="outline" className="flex items-center gap-1 py-1">
                <span className="capitalize">{label}: {value}</span>
                <X 
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter(filter)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
