
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventoryTracker } from '@/hooks/useInventoryTracker';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryBalanceCardProps {
  productId: string;
  productName: string;
}

export function InventoryBalanceCard({ productId, productName }: InventoryBalanceCardProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  const { getProductBalance } = useInventoryTracker();
  
  const { data: balanceData, isLoading, error } = getProductBalance(productId);

  // Use to detect low inventory (less than 10 items)
  const isLowInventory = balanceData?.totalQuantity !== undefined && balanceData.totalQuantity < 10;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{productName}</CardTitle>
          {!isLoading && balanceData && (
            <Badge variant={isLowInventory ? "destructive" : "default"}>
              {isLowInventory ? 'Low Stock' : 'In Stock'}
            </Badge>
          )}
        </div>
        <CardDescription>Inventory balance across all locations</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            Error loading inventory data
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center rounded-lg border p-3">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  <span>Total Quantity</span>
                </div>
                <span className="text-xl font-bold">
                  {balanceData?.totalQuantity || 0}
                </span>
              </div>
            </div>
            
            {viewMode === 'details' && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">Location Breakdown:</h3>
                <div className="rounded-md border divide-y">
                  {balanceData?.inventoryByLocation?.map((location) => (
                    <div key={`${location.warehouse_id}-${location.location_id}`} className="flex justify-between p-2">
                      <span className="text-sm">{location.warehouse_name} - {location.location_name}</span>
                      <span className="font-semibold">{location.stock_level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs" 
          onClick={() => setViewMode(viewMode === 'summary' ? 'details' : 'summary')}
        >
          {viewMode === 'summary' ? 'Show Location Details' : 'Hide Location Details'}
        </Button>
      </CardFooter>
    </Card>
  );
}
