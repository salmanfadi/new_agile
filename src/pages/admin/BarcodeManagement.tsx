
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodePrinter from '@/components/barcode/BarcodePrinter';
import BarcodeGenerator from '@/components/barcode/BarcodeGenerator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { NotificationsList } from '@/components/notification/NotificationsList';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
}

const BarcodeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('generator');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch products for the dropdown
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-barcode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, category')
        .order('name');
        
      if (error) {
        console.error('Error fetching products:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load products',
          description: error.message
        });
        return [];
      }
      
      return data || [];
    }
  });
  
  // Only allow admins and warehouse managers to access this page
  if (user?.role !== 'admin' && user?.role !== 'warehouse_manager') {
    navigate('/unauthorized');
    return null;
  }

  const handleBarcodeGenerated = (barcode: string) => {
    toast({
      title: "Barcode Generated",
      description: `Generated barcode: ${barcode}`
    });
  };

  const handleProductChange = (productId: string) => {
    const product = products?.find(p => p.id === productId) || null;
    setSelectedProduct(product);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Management" 
        description="Generate, print and manage barcodes for inventory items"
      />
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/manager')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        {/* Only admins can see all notifications */}
        {user?.role === 'admin' && (
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('notifications')}
          >
            View Notification History
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generator">Single Barcode Generator</TabsTrigger>
          <TabsTrigger value="printer">Bulk Generate by Category</TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="generator" className="max-w-xl mx-auto">
          <div className="bg-muted/30 p-6 rounded-lg">
            <div className="mb-6">
              <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Product
              </label>
              <Select onValueChange={handleProductChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Products</SelectLabel>
                    {isLoadingProducts ? (
                      <SelectItem value="loading" disabled>Loading products...</SelectItem>
                    ) : products && products.length > 0 ? (
                      products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} {product.sku ? `(${product.sku})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No products found</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <BarcodeGenerator 
              productName={selectedProduct?.name || ""} 
              productSku={selectedProduct?.sku || ""} 
              category={selectedProduct?.category || ""}
              onGenerateBarcode={handleBarcodeGenerated} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="printer">
          <BarcodePrinter />
        </TabsContent>
        
        {user?.role === 'admin' && (
          <TabsContent value="notifications">
            <NotificationsList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BarcodeManagement;
