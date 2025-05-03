
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
    quantity: '' as string | number,
    destination: '',
    reason: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    quantity: '',
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
      setFormData({ ...formData, [name]: value });
      
      // Validate quantity
      if (value === '') {
        setFormErrors({ ...formErrors, quantity: 'Quantity is required' });
      } else {
        const numValue = parseInt(value);
        if (isNaN(numValue)) {
          setFormErrors({ ...formErrors, quantity: 'Please enter a valid number' });
        } else if (numValue < 1) {
          setFormErrors({ ...formErrors, quantity: 'Quantity must be at least 1' });
        } else {
          setFormErrors({ ...formErrors, quantity: '' });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!formData.productId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a product',
      });
      return;
    }
    
    const numQuantity = parseInt(formData.quantity as string);
    if (isNaN(numQuantity) || numQuantity < 1) {
      setFormErrors({ ...formErrors, quantity: 'Quantity must be at least 1' });
      return;
    }
    
    if (!formData.destination.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a destination',
      });
      return;
    }
    
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
      quantity: numQuantity,
      destination: formData.destination,
      reason: formData.reason || undefined,
      requested_by: user.id
    });
  };
  
  const isFormValid = () => {
    return (
      formData.productId && 
      (typeof formData.quantity === 'number' ? formData.quantity > 0 : false) &&
      formData.destination.trim() !== '' &&
      !formErrors.quantity
    );
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
                      <SelectItem value="loading-products" disabled>Loading products...</SelectItem>
                    ) : products && products.length > 0 ? (
                      products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>No products available</SelectItem>
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
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.quantity && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.quantity}</p>
                )}
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
                disabled={!formData.productId || formData.quantity === '' || formData.destination === '' || !!formErrors.quantity || createStockOutMutation.isPending}
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
