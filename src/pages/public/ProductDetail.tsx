
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { PublicLayout } from '@/components/layout/PublicLayout';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

  const isInCart = cartItems.some(item => item.productId === id);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center"
          onClick={() => navigate('/products')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : !product ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              Product not found
            </h2>
            <p className="mt-2 text-gray-500">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              className="mt-6"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="object-contain h-full w-full rounded-lg"
                />
              ) : (
                <Package className="h-24 w-24 text-gray-400" />
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                {product.sku && (
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{product.description || 'No description available'}</p>
                </div>
                
                {product.specifications && (
                  <div>
                    <h3 className="font-semibold mb-2">Specifications</h3>
                    <p className="text-gray-700">{product.specifications}</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <p className="text-sm text-gray-500 w-full">
                  For pricing information, please add this product to your cart and submit an inquiry.
                </p>
                
                <div className="w-full">
                  {isInCart ? (
                    <div className="flex flex-col space-y-2 w-full">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/cart')}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        View in Cart
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => navigate('/products')}
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleAddToCart}
                    >
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ProductDetail;
