
import React, { useState } from 'react';
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

interface ProcessedBatchesFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

export const ProcessedBatchesFilters: React.FC<ProcessedBatchesFiltersProps> = ({ 
  onFilterChange 
}) => {
  const [productId, setProductId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouseData();

  const form = useForm({
    defaultValues: {
      productId: '',
      warehouseId: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    }
  });

  const applyFilters = () => {
    const newFilters: Record<string, any> = {};
    const newActiveFilters: string[] = [];
    
    if (productId) {
      newFilters.product_id = productId;
      newActiveFilters.push('product_id');
    }
    
    if (warehouseId) {
      newFilters.warehouse_id = warehouseId;
      newActiveFilters.push('warehouse_id');
    }
    
    if (status) {
      newFilters.status = status;
      newActiveFilters.push('status');
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
    setProductId('');
    setWarehouseId('');
    setStatus('');
    setDateRange({});
    form.reset();
    setActiveFilters([]);
    onFilterChange({});
  };

  const removeFilter = (filter: string) => {
    switch (filter) {
      case 'product_id':
        setProductId('');
        form.setValue('productId', '');
        break;
      case 'warehouse_id':
        setWarehouseId('');
        form.setValue('warehouseId', '');
        break;
      case 'status':
        setStatus('');
        form.setValue('status', '');
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
    if (filter !== 'product_id' && productId) updatedFilters.product_id = productId;
    if (filter !== 'warehouse_id' && warehouseId) updatedFilters.warehouse_id = warehouseId;
    if (filter !== 'status' && status) updatedFilters.status = status;
    if (filter !== 'date_from' && dateRange.from) updatedFilters.date_from = dateRange.from;
    if (filter !== 'date_to' && dateRange.to) updatedFilters.date_to = dateRange.to;
    
    onFilterChange(updatedFilters);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <Select 
                  value={warehouseId} 
                  onValueChange={(value) => {
                    setWarehouseId(value);
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any Warehouse</SelectItem>
                    {warehouses && warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
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
            let label = filter.replace('_', ' ');
            let value = '';
            
            switch (filter) {
              case 'product_id':
                value = productId;
                label = 'Product';
                break;
              case 'warehouse_id':
                value = warehouses?.find(w => w.id === warehouseId)?.name || warehouseId;
                label = 'Warehouse';
                break;
              case 'status':
                value = status;
                label = 'Status';
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
