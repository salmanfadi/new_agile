
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Package, Search } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { PublicLayout } from '@/components/layout/PublicLayout';

const ProductCatalogue: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data as Product[];
    },
  });

  // Filter products based on search term
  const filteredProducts = searchTerm && products
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : products;

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Product Catalogue</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <Button 
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart ({cartItems.length})</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : !filteredProducts || filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              {searchTerm ? 'No products match your search' : 'No products available'}
            </h2>
            {searchTerm && (
              <p className="mt-2 text-gray-500">
                Try searching with different keywords
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="truncate">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="aspect-square bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-cover h-full w-full rounded-md"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-600 line-clamp-3">
                    {product.description || 'No description available'}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleViewProduct(product.id)}
                  >
                    View Details
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ProductCatalogue;
