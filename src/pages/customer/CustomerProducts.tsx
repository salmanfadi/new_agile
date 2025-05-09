
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Tag, Package } from 'lucide-react';

interface ProductWithStock extends Product {
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const CustomerProducts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
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

      // For each product, determine stock status (without showing actual quantities)
      const productsWithStock = await Promise.all(
        data.map(async (product) => {
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('product_id', product.id);

          if (inventoryError) {
            console.error(`Error fetching inventory for ${product.name}:`, inventoryError);
            return {
              ...product,
              stock_status: 'Out of Stock'
            };
          }

          const totalQuantity = inventoryData.reduce(
            (sum, item) => sum + (item.quantity || 0), 
            0
          );

          let stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
          if (totalQuantity <= 0) {
            stockStatus = 'Out of Stock';
          } else if (totalQuantity <= 5) {
            stockStatus = 'Low Stock';
          } else {
            stockStatus = 'In Stock';
          }

          return {
            ...product,
            stock_status: stockStatus
          };
        })
      );

      return productsWithStock;
    }
  });

  // Extract all unique categories
  const categories = products 
    ? [...new Set(products.map(p => p.category).filter(Boolean))]
    : [];

  const filteredProducts = products?.filter(product => 
    (searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    ) &&
    (categoryFilter === null || product.category === categoryFilter)
  );

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'Out of Stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'Low Stock':
        return <Badge variant="default" className="bg-amber-500">Low Stock</Badge>;
      case 'In Stock':
      default:
        return <Badge variant="default" className="bg-green-500">In Stock</Badge>;
    }
  };

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <Package className="mr-2 h-6 w-6 text-blue-600" />
              Product Catalogue
            </h1>
            <p className="text-slate-600 mt-1">Browse our available products</p>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={categoryFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(null)}
            className="flex items-center"
          >
            <Tag className="h-4 w-4 mr-1" />
            All Categories
          </Button>
          
          {categories.map(category => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category as string)}
            >
              {category}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden h-full flex flex-col">
                  <div className="relative aspect-video bg-slate-100 flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="object-contain h-full w-full"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-slate-300" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      {getStockStatusBadge(product.stock_status)}
                      {product.sku && <span className="text-xs text-slate-500">SKU: {product.sku}</span>}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {product.description || "No description available."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link to={`/customer/inquiry?product=${product.id}`}>
                      <Button variant="outline">Request Pricing</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-500">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerProducts;
