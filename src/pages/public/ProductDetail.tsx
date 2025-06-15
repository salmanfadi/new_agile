
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types/database';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ShoppingCart,
  Package,
  CheckCircle,
  XCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data: productStock, error } = await supabase.functions.invoke('product-stock');
        
        if (error) {
          console.error('Error invoking product-stock function:', error);
          toast({
            title: 'Error',
            description: 'Failed to load product information',
            variant: 'destructive',
          });
          return;
        }
        
        const foundProduct = productStock.find((p: any) => p.id === id);
        
        if (!foundProduct) {
          toast({
            title: 'Error',
            description: 'Product not found',
            variant: 'destructive',
          });
          return;
        }
        
        setProduct(foundProduct);
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [id, toast]);
  
  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product, quantity, requirements);
    setQuantity(1);
    setRequirements('');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/products">
        <Button variant="ghost" className="flex items-center mb-8">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </Link>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-lg">
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ) : product ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-lg flex items-center justify-center p-6">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="object-contain max-h-80 w-full"
              />
            ) : (
              <div className="text-center">
                <Package className="h-24 w-24 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500">No image available</p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center">
              <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
              <div className="ml-auto flex items-center">
                {product.is_out_of_stock ? (
                  <div className="flex items-center text-red-500">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>Out of stock</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>In stock: {product.in_stock_quantity}</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-gray-700">{product.description || 'No description available'}</p>
            
            {product.specifications && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Specifications
                  </h3>
                  <p className="text-sm text-gray-700">{product.specifications}</p>
                </CardContent>
              </Card>
            )}
            
            <div className="border-t border-b py-6 space-y-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                  disabled={product.is_out_of_stock}
                />
              </div>
              
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium mb-1">
                  Specific Requirements (Optional)
                </label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Add any specific requirements for this product"
                  disabled={product.is_out_of_stock}
                />
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={product.is_out_of_stock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                
                <Link to="/cart" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Cart
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Product not found</h3>
          <p className="text-gray-500 mb-8">
            The product you're looking for does not exist or has been removed.
          </p>
          <Link to="/products">
            <Button>Browse Other Products</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
