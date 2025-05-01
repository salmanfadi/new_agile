
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const StockInForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      return data;
    },
  });
  
  const [formData, setFormData] = useState({
    productId: '',
    numberOfBoxes: 1,
  });
  
  // Create stock in mutation
  const createStockInMutation = useMutation({
    mutationFn: async (data: { product_id: string; boxes: number; submitted_by: string }) => {
      const { data: result, error } = await supabase
        .from('stock_in')
        .insert([data])
        .select();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Stock In request submitted!',
        description: `${formData.numberOfBoxes} boxes of the selected product have been submitted for processing.`,
      });
      navigate('/operator/submissions');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Failed to submit stock in request',
      });
    },
  });
  
  const handleProductChange = (value: string) => {
    setFormData({ ...formData, productId: value });
  };
  
  const handleBoxesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData({ ...formData, numberOfBoxes: value });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to submit stock in requests',
      });
      return;
    }
    
    createStockInMutation.mutate({
      product_id: formData.productId,
      boxes: formData.numberOfBoxes,
      submitted_by: user.id
    });
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="New Stock In" 
        description="Submit new stock inward request"
      />
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2"
              onClick={() => navigate('/operator')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <CardTitle>Stock In Form</CardTitle>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select 
                  value={formData.productId} 
                  onValueChange={handleProductChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="loading" disabled>Loading products...</SelectItem>
                    ) : products && products.length > 0 ? (
                      products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No products available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="boxes">Number of Boxes</Label>
                <Input
                  id="boxes"
                  type="number"
                  min={1}
                  value={formData.numberOfBoxes}
                  onChange={handleBoxesChange}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={!formData.productId || createStockInMutation.isPending}
              >
                {createStockInMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default StockInForm;
