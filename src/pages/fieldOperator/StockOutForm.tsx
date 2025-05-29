import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft, Plus, Trash2, ScanLine, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Inventory, Product } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

type ProductRow = Database['public']['Tables']['products']['Row'];
type StockOutInsert = Database['public']['Tables']['stock_out']['Insert'];
type StockOutDetailsInsert = Database['public']['Tables']['stock_out_details']['Insert'];

interface ScannedBox {
  barcode: string;
  inventory_id: string;
  product_name: string;
  product_id: string;
  sku: string | null;
  quantity: number;
  requestedQuantity: number;
  category?: string;
  batch_id: string | null;
}

interface GroupedBoxes {
  [category: string]: ScannedBox[];
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  is_active: boolean;
}

interface FormData {
  product_id: string;
  quantity: string;
  destination: string;
  reason?: string;
}

const StockOutForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for mode selection
  const [isBarcodeDriven, setIsBarcodeDriven] = useState(false);
  
  // State for regular product-based selection
  const [formData, setFormData] = useState<FormData>({
    product_id: '',
    quantity: '',
    destination: '',
    reason: ''
  });

  // State for barcode-driven selection
  const [scannedBoxes, setScannedBoxes] = useState<ScannedBox[]>([]);
  const [barcodeDestination, setBarcodeDestination] = useState('');
  const [barcodeReason, setBarcodeReason] = useState('');
  const [currentScannedBarcode, setCurrentScannedBarcode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [formErrors, setFormErrors] = useState({
    quantity: '',
    requestedQuantity: '',
  });

  // Fetch products for the product-based selection
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, category, is_active')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      return data;
    },
  });

  // Fetch product categories for filtering
  const { data: categories, isLoading: categoriesLoading } = useQuery<string[]>({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null)
        .order('category');
        
      if (error) throw error;
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
        .filter(Boolean)
        .sort() as string[];
      
      return uniqueCategories;
    },
  });
  
  // Fetch pending stock out requests
  const { data: stockOutRequests, isLoading: stockOutRequestsLoading } = useQuery({
    queryKey: ['stock-out-requests-operator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          *,
          product:products(*),
          customer:customers(*)
        `)
        .eq('status', 'pending_operator')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
  
  // Handle barcode scan result
  const handleBarcodeScanned = async (barcode: string) => {
    setCurrentScannedBarcode(barcode);
    
    // Check if the barcode is already scanned
    const alreadyScanned = scannedBoxes.some(box => box.barcode === barcode);
    if (alreadyScanned) {
      toast({
        variant: 'destructive',
        title: 'Barcode already scanned',
        description: 'This barcode is already in your list.',
      });
      return;
    }
    
    try {
      // Define the expected response type
      interface InventoryWithProduct {
        id: string;
        barcode: string;
        quantity: number;
        product_id: string;
        batch_id: string | null;
        products: {
          id: string;
          name: string;
          sku: string | null;
          category: string | null;
        }[];
      }
      
      // Fetch inventory details for the scanned barcode
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          barcode,
          quantity,
          product_id,
          batch_id,
          products(id, name, sku, category)
        `)
        .eq('barcode', barcode)
        .eq('status', 'available')
        .single();
      
      if (error) throw error;
      
      if (!data) {
        toast({
          variant: 'destructive',
          title: 'Invalid barcode',
          description: 'No matching inventory found for this barcode or the item is not available.',
        });
        return;
      }
      
      const typedData = data as unknown as InventoryWithProduct;
      
      // If category filter is active, check if the product matches the selected category
      if (selectedCategory && typedData.products[0]?.category !== selectedCategory) {
        toast({
          variant: 'destructive',
          title: 'Category mismatch',
          description: `This box belongs to the "${typedData.products[0]?.category}" category, but you have filtered for "${selectedCategory}".`,
        });
        return;
      }
      
      // Add to scanned boxes list
      const newBox: ScannedBox = {
        barcode: typedData.barcode,
        inventory_id: typedData.id,
        product_name: typedData.products[0]?.name || 'Unknown Product',
        product_id: typedData.product_id,
        sku: typedData.products[0]?.sku,
        quantity: typedData.quantity,
        requestedQuantity: typedData.quantity, // Default to full box quantity
        category: typedData.products[0]?.category || 'Uncategorized',
        batch_id: typedData.batch_id ?? null,
      };
      
      setScannedBoxes([...scannedBoxes, newBox]);
      setCurrentScannedBarcode('');
      
      toast({
        title: 'Box added',
        description: `Added ${typedData.products[0]?.name || 'Unknown Product'} (${typedData.quantity} units)`,
      });
    } catch (error) {
      console.error('Error fetching barcode details:', error);
      toast({
        variant: 'destructive',
        title: 'Error scanning barcode',
        description: error instanceof Error ? error.message : 'Failed to process barcode',
      });
    }
  };
  
  // Group scanned boxes by category
  const getGroupedBoxes = (): GroupedBoxes => {
    return scannedBoxes.reduce((groups: GroupedBoxes, box) => {
      const category = box.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(box);
      return groups;
    }, {});
  };
  
  // Update requested quantity for a scanned box
  const updateBoxQuantity = (index: number, quantity: number) => {
    const updatedBoxes = [...scannedBoxes];
    const box = updatedBoxes[index];
    
    if (quantity > box.quantity) {
      setFormErrors({
        ...formErrors,
        requestedQuantity: `Quantity cannot exceed available amount (${box.quantity})`
      });
      return;
    } else if (quantity < 1) {
      setFormErrors({
        ...formErrors,
        requestedQuantity: 'Quantity must be at least 1'
      });
      return;
    } else {
      setFormErrors({
        ...formErrors,
        requestedQuantity: ''
      });
    }
    
    updatedBoxes[index].requestedQuantity = quantity;
    setScannedBoxes(updatedBoxes);
  };
  
  // Remove a box from the scanned list
  const removeBox = (index: number) => {
    const updatedBoxes = [...scannedBoxes];
    updatedBoxes.splice(index, 1);
    setScannedBoxes(updatedBoxes);
    
    toast({
      title: 'Box removed',
      description: 'The box has been removed from your list.'
    });
  };
  
  const handleProductChange = (value: string) => {
    setFormData({ ...formData, product_id: value });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Clear scanned boxes when category filter changes
    if (scannedBoxes.length > 0) {
      if (confirm('Changing category filter will clear your current list of scanned boxes. Continue?')) {
        setScannedBoxes([]);
      } else {
        // Revert selection if user cancels
        setSelectedCategory('');
      }
    }
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
  
  // Create stock out mutation for product-based approach
  const createProductStockOutMutation = useMutation({
    mutationFn: async (data: { 
      product_id: string; 
      quantity: number; 
      destination: string;
      notes?: string;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // First create the stock out header
      const { data: stockOutHeader, error: headerError } = await supabase
        .from('stock_out')
        .insert([{
          requester_id: user.id,
          requester_name: user.name,
          requester_username: user.username,
          status: 'pending',
          destination: data.destination,
          notes: data.notes || null
        } satisfies StockOutInsert])
        .select()
        .single();
        
      if (headerError) throw headerError;

      // Then create the stock out details
      const { error: detailsError } = await supabase
        .from('stock_out_details')
        .insert([{
          stock_out_id: stockOutHeader.id,
          product_id: data.product_id,
          quantity: data.quantity
        } satisfies StockOutDetailsInsert]);
        
      if (detailsError) throw detailsError;

      return stockOutHeader;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock out request created successfully',
      });
      navigate('/operator/stock-out');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create stock out request',
      });
    },
  });
  
  // Create stock out mutation for barcode-driven approach
  const createBarcodeStockOutMutation = useMutation({
    mutationFn: async (data: { 
      requested_by: string;
      destination: string;
      reason?: string;
      boxes: Array<{
        inventory_id: string;
        product_id: string;
        quantity: number;
        batch_id: string | null;
      }>;
    }) => {
      const productGroups = data.boxes.reduce((acc, box) => {
        if (!acc[box.product_id]) {
          acc[box.product_id] = 0;
        }
        acc[box.product_id] += box.quantity;
        return acc;
      }, {} as Record<string, number>);
      const mainProductId = Object.entries(productGroups)
        .sort((a, b) => b[1] - a[1])[0][0];

      // Create the stock out header
      const { data: stockOutRecord, error: stockOutError } = await supabase
        .from('stock_out')
        .insert([{
          product_id: mainProductId,
          quantity: data.boxes.reduce((total, box) => total + box.quantity, 0),
          requested_by: data.requested_by,
          destination: data.destination,
          status: 'pending',
          reason: data.reason || null
        }])
        .select('id')
        .single();

      if (stockOutError) throw stockOutError;
      if (!stockOutRecord) {
        throw new Error('Failed to create stock out record');
      }

      // Create stock out details for each box
      const stockOutId = stockOutRecord.id;
      const detailsPromises = data.boxes.map(box => 
        supabase.from('stock_out_details').insert([{
          stock_out_id: stockOutId,
          product_id: box.product_id,
          quantity: box.quantity,
          status: 'pending',
          batch_id: box.batch_id,
          barcode: box.inventory_id
        }])
      );

      await Promise.all(detailsPromises);
      return stockOutRecord;
    },
    onSuccess: () => {
      const totalQuantity = scannedBoxes.reduce((total, box) => total + box.requestedQuantity, 0);
      
      toast({
        title: 'Barcode Stock Out request submitted!',
        description: `${scannedBoxes.length} boxes (${totalQuantity} units total) have been requested for dispatch to ${barcodeDestination}.`,
      });
      navigate('/operator/submissions');
    },
    onError: (error) => {
      console.error('Barcode stock out error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Failed to submit barcode stock out request',
      });
    },
  });
  
  const handleProductBasedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!formData.product_id) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a product',
      });
      return;
    }
    
    const numQuantity = parseInt(formData.quantity);
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
    
    createProductStockOutMutation.mutate({
      product_id: formData.product_id,
      quantity: numQuantity,
      destination: formData.destination,
      notes: formData.reason || undefined,
    });
  };
  
  const handleBarcodeDrivenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate barcode form
    if (scannedBoxes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please scan at least one box',
      });
      return;
    }
    
    if (!barcodeDestination.trim()) {
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
    
    // Format the data for submission
    const boxesData = scannedBoxes.map(box => ({
      inventory_id: box.inventory_id,
      product_id: box.product_id,
      quantity: box.requestedQuantity,
      batch_id: box.batch_id ?? null,
    }));
    
    createBarcodeStockOutMutation.mutate({
      boxes: boxesData,
      destination: barcodeDestination,
      reason: barcodeReason || undefined,
      requested_by: user.id
    });
  };
  
  const isProductBasedValid = () => {
    return (
      formData.product_id && 
      (typeof formData.quantity === 'number' ? parseInt(formData.quantity) > 0 : parseInt(formData.quantity) > 0) &&
      formData.destination.trim() !== '' &&
      !formErrors.quantity
    );
  };
  
  const isBarcodeDrivenValid = () => {
    return (
      scannedBoxes.length > 0 &&
      barcodeDestination.trim() !== '' &&
      !formErrors.requestedQuantity
    );
  };
  
  const getTotalScannedQuantity = () => {
    return scannedBoxes.reduce((total, box) => total + box.requestedQuantity, 0);
  };

  // Get the product associated with the selected product ID
  const getSelectedProduct = () => {
    if (!formData.product_id || !products) return null;
    return products.find(product => product.id === formData.product_id);
  };

  const selectedProduct = getSelectedProduct();
  const groupedBoxes = getGroupedBoxes();
  
  const handleComplete = async (stockOut: any) => {
    try {
      // First check available inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', stockOut.product.id)
        .eq('status', 'in_stock');

      if (inventoryError) throw inventoryError;

      const availableQuantity = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (availableQuantity < stockOut.quantity) {
        toast({
          title: 'Error',
          description: `Not enough inventory available. Only ${availableQuantity} units in stock.`,
          variant: 'destructive',
        });
        return;
      }

      // Update stock out status
      const { error: updateError } = await supabase
        .from('stock_out')
        .update({
          status: 'completed',
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', stockOut.id);

      if (updateError) throw updateError;

      // Deduct from inventory
      const { error: inventoryUpdateError } = await supabase
        .from('inventory')
        .update({
          quantity: availableQuantity - stockOut.quantity,
        })
        .eq('product_id', stockOut.product.id)
        .eq('status', 'in_stock');

      if (inventoryUpdateError) throw inventoryUpdateError;

      toast({
        title: 'Success',
        description: 'Stock out has been completed.',
      });
    } catch (error) {
      console.error('Error completing stock out:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete stock out',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Process Stock Out</h1>
      </div>

        <Card>
          <CardHeader>
          <CardTitle>Pending Stock Out Requests</CardTitle>
          <CardDescription>
            Process stock out requests from warehouse managers
          </CardDescription>
          </CardHeader>
        <CardContent>
          {stockOutRequestsLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : !stockOutRequests?.length ? (
            <div className="text-center py-4">No pending stock out requests</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockOutRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>{request.product?.name}</div>
                      {request.product?.sku && (
                        <div className="text-sm text-gray-500">
                          SKU: {request.product.sku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>{request.destination}</TableCell>
                    <TableCell>
                      <Badge variant={
                        request.priority === 'urgent' ? 'destructive' :
                        request.priority === 'high' ? 'default' :
                        request.priority === 'normal' ? 'secondary' :
                        'outline'
                      }>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.required_date ? 
                        format(new Date(request.required_date), 'MMM d, yyyy') :
                        'Not specified'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {request.notes || 'No notes'}
                    </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => handleComplete(request)}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
    </div>
  );
};

export default StockOutForm;
