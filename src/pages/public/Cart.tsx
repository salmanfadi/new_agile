
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingCart, 
  Trash2, 
  ChevronLeft, 
  Package,
  Loader2
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form schema
const inquiryFormSchema = z.object({
  customerName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  customerEmail: z.string().email({ message: 'Please enter a valid email address' }),
  customerCompany: z.string().optional(),
  message: z.string().optional()
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

const Cart: React.FC = () => {
  const { cartItems, updateCartItem, removeFromCart, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerCompany: '',
      message: ''
    }
  });
  
  const onSubmit = async (values: InquiryFormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add products to your cart before submitting an inquiry.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('submit-inquiry', {
        body: {
          customer_name: values.customerName,
          customer_email: values.customerEmail,
          customer_company: values.customerCompany,
          message: values.message,
          products: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            requirements: item.requirements
          }))
        }
      });
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Inquiry submitted",
        description: "We'll get back to you soon with pricing information!"
      });
      
      clearCart();
      navigate('/products', { replace: true });
      
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: "Submission failed",
        description: "There was a problem submitting your inquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link to="/products">
          <Button variant="ghost" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Your Cart</h1>
      </div>
      
      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.productId} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="bg-gray-100 w-full sm:w-32 h-32 flex items-center justify-center shrink-0">
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name} 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col flex-grow p-4">
                    <h3 className="font-medium text-lg">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">SKU: {item.product.sku || 'N/A'}</p>
                    
                    <div className="mt-auto flex flex-wrap gap-4 items-end justify-between">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input 
                          type="number" 
                          min={1} 
                          value={item.quantity} 
                          onChange={(e) => updateCartItem(item.productId, Number(e.target.value))}
                          className="w-20" 
                        />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <label className="text-sm font-medium">Specific Requirements (Optional)</label>
                  <Textarea 
                    value={item.requirements || ''} 
                    onChange={(e) => updateCartItem(item.productId, item.quantity, e.target.value)}
                    placeholder="Add any specific requirements for this product"
                    className="mt-2"
                  />
                </div>
              </Card>
            ))}
            
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCart}
              >
                Clear Cart
              </Button>
              
              <div className="text-right">
                <p className="text-lg font-medium">Total Items: {totalItems}</p>
              </div>
            </div>
          </div>
          
          {/* Inquiry Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Request Pricing
              </CardTitle>
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
                          <Input placeholder="Your full name" {...field} />
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
                          <Input placeholder="your@email.com" {...field} />
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
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company name" {...field} />
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
                          <Textarea placeholder="Any additional information you'd like us to know" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Inquiry'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-sm text-gray-500 flex justify-center">
              <p>We'll get back to you with pricing shortly</p>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-8">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;
