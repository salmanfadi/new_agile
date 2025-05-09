
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  customerName: z.string().min(2, { message: 'Name is required' }),
  customerEmail: z.string().email({ message: 'Valid email is required' }),
  customerCompany: z.string().min(1, { message: 'Company name is required' }),
  customerPhone: z.string().optional(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerCompany: '',
      customerPhone: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some products to your cart before submitting an inquiry.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert the inquiry
      const { data: inquiryData, error: inquiryError } = await supabase
        .from('sales_inquiries')
        .insert({
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_company: data.customerCompany,
          customer_phone: data.customerPhone || null,
          message: data.message || null,
          status: 'new',
        })
        .select('id')
        .single();

      if (inquiryError) throw inquiryError;

      // Insert the inquiry items
      const inquiryItems = cartItems.map(item => ({
        inquiry_id: inquiryData.id,
        product_id: item.productId,
        quantity: item.quantity,
        specific_requirements: item.requirements || null,
      }));

      const { error: itemsError } = await supabase
        .from('sales_inquiry_items')
        .insert(inquiryItems);

      if (itemsError) throw itemsError;

      // Success
      toast({
        title: "Inquiry submitted successfully",
        description: "We'll get back to you soon with pricing information.",
      });

      // Clear the cart and redirect
      clearCart();
      navigate('/products');
      
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: "Failed to submit inquiry",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
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

        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <ShoppingCart className="mr-3 h-7 w-7" />
          Your Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items ({cartItems.length})</CardTitle>
              </CardHeader>
              
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Your cart is empty</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/products')}
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-gray-200">
                        <div className="w-full sm:w-20 h-20 bg-gray-100 rounded-md mr-4 mb-4 sm:mb-0 flex-shrink-0 flex items-center justify-center">
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="object-cover h-full w-full rounded-md"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-grow mr-4">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {item.product.description || 'No description available'}
                          </p>
                          
                          <div className="mt-4">
                            <Textarea
                              placeholder="Add specific requirements (optional)"
                              value={item.requirements || ''}
                              onChange={(e) => {
                                const productId = item.productId;
                                const requirements = e.target.value;
                                const updatedItems = cartItems.map(ci => 
                                  ci.productId === productId 
                                    ? { ...ci, requirements } 
                                    : ci
                                );
                                // Need to update the cart with the new requirements
                                localStorage.setItem('cart', JSON.stringify(updatedItems));
                                window.dispatchEvent(new Event('storage'));
                              }}
                              className="h-20 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-4 mt-4 sm:mt-0">
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <span className="w-8 text-center">{item.quantity}</span>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              
              {cartItems.length > 0 && (
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/products')}
                  >
                    Continue Shopping
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear your cart?')) {
                        clearCart();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Request Pricing</CardTitle>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerCompany"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information about your inquiry"
                              className="h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || cartItems.length === 0}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Pricing Request'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Cart;
