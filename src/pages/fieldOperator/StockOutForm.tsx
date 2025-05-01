
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const StockOutForm: React.FC = () => {
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
    quantity: 1,
    destination: '',
    reason: '',
  });
  
  // Create stock out mutation
  const createStockOutMutation = useMutation({
    mutationFn: async (data: { 
      product_id: string; 
      quantity: number; 
      requested_by: string;
      destination: string;
      reason?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('stock_out')
        .insert([data])
        .select();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Stock Out request submitted!',
        description: `${formData.quantity} units of the selected product have been requested for dispatch to ${formData.destination}.`,
      });
      navigate('/operator/submissions');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Failed to submit stock out request',
      });
    },
  });
  
  const handleProductChange = (value: string) => {
    setFormData({ ...formData, productId: value });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        setFormData({ ...formData, [name]: numValue });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to submit stock out requests',
      });
      return;
    }
    
    createStockOutMutation.mutate({
      product_id: formData.productId,
      quantity: formData.quantity,
      destination: formData.destination,
      reason: formData.reason || undefined,
      requested_by: user.id
    });
  };
  
  const isFormValid = () => {
    return formData.productId && formData.quantity > 0 && formData.destination.trim() !== '';
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="New Stock Out" 
        description="Submit stock out request for dispatch"
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
            <CardTitle>Stock Out Form</CardTitle>
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
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="Customer Name, Address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Why is this stock being requested?"
                  rows={4}
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid() || createStockOutMutation.isPending}
              >
                {createStockOutMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default StockOutForm;
