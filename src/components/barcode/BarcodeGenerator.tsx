
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import BarcodePreview from './BarcodePreview';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BarcodeGeneratorProps {
  productName: string;
  productSku: string;
  category: string;
  onGenerateBarcode?: (barcode: string) => void;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  productName: initialProductName,
  productSku: initialProductSku,
  category: initialCategory,
  onGenerateBarcode
}) => {
  const [barcode, setBarcode] = useState('');
  const [boxNumber, setBoxNumber] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, category')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    
    const formattedSku = selectedProduct.sku || selectedProduct.name.substring(0, 6).toUpperCase().replace(/\s+/g, '');
    const category = selectedProduct.category || 'MISC';
    
    try {
      // Await the promise returned by generateBarcodeString
      const newBarcode = await generateBarcodeString(category, formattedSku, boxNumber);
      
      setBarcode(newBarcode);
      if (onGenerateBarcode) {
        onGenerateBarcode(newBarcode);
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Barcode Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product">Select Product</Label>
          <Select onValueChange={handleProductSelect}>
            <SelectTrigger id="product" className="w-full">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>Loading products...</SelectItem>
              ) : products.length > 0 ? (
                products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-products" disabled>No products available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {selectedProduct && (
          <div className="flex items-center space-x-2">
            <div className="bg-muted px-3 py-1 rounded-md flex items-center space-x-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{selectedProduct.category || 'Uncategorized'}</span>
            </div>
            <div className="bg-muted px-3 py-1 rounded-md">
              <span className="text-xs text-muted-foreground">{selectedProduct.sku || 'No SKU'}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="box-number">Box Number</Label>
          <Input
            id="box-number"
            type="number"
            min="1"
            value={boxNumber}
            onChange={(e) => setBoxNumber(Number(e.target.value) || 1)}
          />
        </div>
        
        {barcode && (
          <div className="pt-4">
            <Label>Generated Barcode</Label>
            <div className="p-3 border rounded-md mt-2">
              <div className="flex justify-center mb-2">
                <BarcodePreview barcode={barcode} width={200} height={60} />
              </div>
              <p className="text-center text-sm mt-2">{barcode}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerate} 
          className="w-full"
          disabled={!selectedProduct}
        >
          Generate Barcode
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BarcodeGenerator;
