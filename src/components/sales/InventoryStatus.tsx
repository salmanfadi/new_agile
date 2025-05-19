
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryTable } from '@/components/warehouse/InventoryTable';

export const InventoryStatus = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Use the same shared hook for consistent data
  const { data, isLoading, error } = useInventoryData('', '', '', searchTerm);
  const inventoryItems = data?.data || [];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <div className="relative w-full mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <InventoryTable 
          inventoryItems={inventoryItems} 
          isLoading={isLoading} 
          error={error as Error | null}
          highlightedBarcode={null}
        />
      </CardContent>
    </Card>
  );
};
