
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, PackageOpen } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ProductInventory extends Product {
  in_stock_quantity: number;
  is_out_of_stock: boolean;
}

export const InventoryStatus: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-inventory'],
    queryFn: async () => {
      // Fetch products with their inventory counts
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          sku,
          category,
          image_url,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Error fetching products: ${error.message}`);
      }

      // For each product, get its inventory count across all warehouses
      const productsWithInventory = await Promise.all(
        data.map(async (product) => {
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('quantity, status')
            .eq('product_id', product.id);

          if (inventoryError) {
            console.error(`Error fetching inventory for ${product.name}:`, inventoryError);
            return {
              ...product,
              in_stock_quantity: 0,
              is_out_of_stock: true,
            };
          }

          // Only count items with status 'available'
          const totalQuantity = inventoryData
            .filter(item => item.status === 'available')
            .reduce((sum, item) => sum + (item.quantity || 0), 0);

          return {
            ...product,
            in_stock_quantity: totalQuantity,
            is_out_of_stock: totalQuantity <= 0,
          };
        })
      );

      return productsWithInventory;
    }
  });

  // Set up real-time updates for inventory changes
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('sales-inventory-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Inventory change detected in sales view:', payload);
          
          // Refresh inventory data
          queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
          
          toast({
            title: 'Inventory Updated',
            description: 'Product inventory has been updated',
          });
        })
      .subscribe();

    // Clean up subscription
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStockStatus = (product: ProductInventory) => {
    if (product.is_out_of_stock) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.in_stock_quantity <= 5) {
      return <Badge variant="default" className="bg-amber-500">Low Stock ({product.in_stock_quantity})</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-500">In Stock ({product.in_stock_quantity})</Badge>;
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <PackageOpen className="mr-2 h-5 w-5 text-blue-600" />
              Inventory Status
            </CardTitle>
            <CardDescription>
              View current stock levels for all products
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="h-8 w-8 mr-2 object-cover rounded"
                            />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku || 'N/A'}</TableCell>
                      <TableCell>{product.category || 'Uncategorized'}</TableCell>
                      <TableCell>{getStockStatus(product as ProductInventory)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      {searchTerm ? 'No products match your search' : 'No products found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
