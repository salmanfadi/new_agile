
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SalesOrdersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export const SalesOrdersFilters: React.FC<SalesOrdersFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onCreateClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <Input
        placeholder="Search orders..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-md"
      />
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4 mr-2" />
        Create Order
      </Button>
    </div>
  );
};
