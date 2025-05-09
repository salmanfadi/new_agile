
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const CustomerInquiry: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = new URLSearchParams(search);
  const preselectedProductId = params.get('product');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerCompany: '',
    customerPhone: '',
    message: '',
    productId: preselectedProductId || '',
    quantity: '1'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-inquiry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, category')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Error fetching products: ${error.message}`);
      }
      
      return data;
    }
  });
  
  useEffect(() => {
    if (preselectedProductId && products) {
      const selectedProduct = products.find(p => p.id === preselectedProductId);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productId: preselectedProductId
        }));
      }
    }
  }, [preselectedProductId, products]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerCompany || !formData.productId) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the sales inquiry
      const { data: inquiryData, error: inquiryError } = await supabase
        .from('sales_inquiries')
        .insert({
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_company: formData.customerCompany,
          customer_phone: formData.customerPhone || null,
          message: formData.message,
          status: 'new'
        })
        .select('id')
        .single();
      
      if (inquiryError) throw new Error(inquiryError.message);
      
      // Create the inquiry item
      const { error: itemError } = await supabase
        .from('sales_inquiry_items')
        .insert({
          inquiry_id: inquiryData.id,
          product_id: formData.productId,
          quantity: parseInt(formData.quantity),
          specific_requirements: formData.message || null
        });
      
      if (itemError) throw new Error(itemError.message);
      
      toast({
        title: "Inquiry Submitted",
        description: "We'll get back to you soon with pricing information.",
        variant: "default"
      });
      
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerCompany: '',
        customerPhone: '',
        message: '',
        productId: '',
        quantity: '1'
      });
      
      // Redirect after short delay
      setTimeout(() => navigate('/customer/inquiry-success'), 500);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your inquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center mb-2">
            <MessageSquare className="mr-2 h-6 w-6 text-blue-600" />
            Submit Product Inquiry
          </h1>
          <p className="text-slate-600 mb-8">
            Fill out the form below to request pricing or additional information about our products.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerCompany">Company <span className="text-red-500">*</span></Label>
                    <Input
                      id="customerCompany"
                      name="customerCompany"
                      value={formData.customerCompany}
                      onChange={handleChange}
                      placeholder="Your Company Name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="+1 (123) 456-7890"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product <span className="text-red-500">*</span></Label>
                    {isLoadingProducts ? (
                      <div className="h-10 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading products...</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.productId}
                        onValueChange={(value) => handleSelectChange('productId', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.sku ? `(${product.sku})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide additional details about your inquiry..."
                    rows={4}
                  />
                </div>

                <CardFooter className="px-0 pb-0 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Inquiry'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerInquiry;
