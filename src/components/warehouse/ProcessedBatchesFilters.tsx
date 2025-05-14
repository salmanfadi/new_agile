
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Search, X } from 'lucide-react';
import { useWarehouseData } from '@/hooks/useWarehouseData';

interface Warehouse {
  id: string;
  name: string;
}

interface Location {
  id: string;
  warehouse_id: string;
  floor: number;
  zone: string;
}

interface ProcessedBatchesFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

export const ProcessedBatchesFilters: React.FC<ProcessedBatchesFiltersProps> = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Get warehouses and locations
  const warehouseData = useWarehouseData();
  const warehouses = warehouseData.warehouses || [];
  const locations = warehouseData.locations || [];
  
  const filteredLocations = warehouseId
    ? locations.filter(loc => loc.warehouse_id === warehouseId)
    : [];
  
  const handleSearch = () => {
    const filters: Record<string, any> = {};
    
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    if (warehouseId) {
      filters.warehouse_id = warehouseId;
    }
    
    if (locationId) {
      filters.location_id = locationId;
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
    setWarehouseId('');
    setLocationId('');
    setDateRange(undefined);
    onFilterChange({});
  };
  
  const handleWarehouseChange = (value: string) => {
    setWarehouseId(value);
    setLocationId(''); // Reset location when warehouse changes
  };
  
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by batch ID, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-[200px]">
          <Select value={warehouseId} onValueChange={handleWarehouseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Warehouses</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-[200px]">
          <Select 
            value={locationId} 
            onValueChange={setLocationId} 
            disabled={!warehouseId}
          >
            <SelectTrigger>
              <SelectValue placeholder={warehouseId ? "Select Location" : "Select Warehouse First"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {filteredLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  Floor {location.floor}, Zone {location.zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
