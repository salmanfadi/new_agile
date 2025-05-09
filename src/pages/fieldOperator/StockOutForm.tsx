
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft, Plus, Trash2, ScanLine } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Inventory } from '@/types/database';

interface ScannedBox {
  barcode: string;
  inventory_id: string;
  product_name: string;
  product_id: string;
  sku: string | null;
  quantity: number;
  requestedQuantity: number;
}

const StockOutForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for mode selection
  const [isBarcodeDriven, setIsBarcodeDriven] = useState(false);
  
  // State for regular product-based selection
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '' as string | number,
    destination: '',
    reason: '',
  });

  // State for barcode-driven selection
  const [scannedBoxes, setScannedBoxes] = useState<ScannedBox[]>([]);
  const [barcodeDestination, setBarcodeDestination] = useState('');
  const [barcodeReason, setBarcodeReason] = useState('');
  const [currentScannedBarcode, setCurrentScannedBarcode] = useState('');
  
  const [formErrors, setFormErrors] = useState({
    quantity: '',
    requestedQuantity: '',
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
      // Fetch inventory details for the scanned barcode
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          barcode,
          quantity,
          product_id,
          products:product_id (
            name,
            sku
          )
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
      
      // Add to scanned boxes list
      const newBox: ScannedBox = {
        barcode: data.barcode,
        inventory_id: data.id,
        product_name: data.products.name,
        product_id: data.product_id,
        sku: data.products.sku,
        quantity: data.quantity,
        requestedQuantity: data.quantity // Default to full box quantity
      };
      
      setScannedBoxes([...scannedBoxes, newBox]);
      setCurrentScannedBarcode('');
      
      toast({
        title: 'Box added',
        description: `Added ${data.products.name} (${data.quantity} units)`,
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
  
  // Fetch products for the product-based selection
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
  
  // Create stock out mutation for product-based approach
  const createProductStockOutMutation = useMutation({
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
      }>;
    }) => {
      // First create the main stock_out record
      const { data: stockOutRecord, error: stockOutError } = await supabase
        .from('stock_out')
        .insert([{
          product_id: data.boxes[0].product_id, // Use the first box's product_id as the main product
          quantity: data.boxes.reduce((total, box) => total + box.quantity, 0),
          requested_by: data.requested_by,
          destination: data.destination,
          reason: data.reason
        }])
        .select('id');
        
      if (stockOutError) throw stockOutError;
      if (!stockOutRecord || stockOutRecord.length === 0) {
        throw new Error('Failed to create stock out record');
      }
      
      const stockOutId = stockOutRecord[0].id;
      
      // Then create stock_out_details for each box
      const detailsPromises = data.boxes.map(box => 
        supabase.from('stock_out_details').insert([{
          stock_out_id: stockOutId,
          inventory_id: box.inventory_id,
          quantity: box.quantity
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
    
    createProductStockOutMutation.mutate({
      product_id: formData.productId,
      quantity: numQuantity,
      destination: formData.destination,
      reason: formData.reason || undefined,
      requested_by: user.id
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
      quantity: box.requestedQuantity
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
      formData.productId && 
      (typeof formData.quantity === 'number' ? formData.quantity > 0 : parseInt(formData.quantity as string) > 0) &&
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
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="New Stock Out" 
        description="Submit stock out request for dispatch"
      />
      
      <div className="max-w-md mx-auto mb-6">
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
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm">Method: {isBarcodeDriven ? 'Barcode Scanning' : 'Product Selection'}</span>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={isBarcodeDriven}
                  onCheckedChange={setIsBarcodeDriven}
                  id="scan-mode"
                />
                <Label htmlFor="scan-mode" className="cursor-pointer flex items-center">
                  <ScanLine className="h-4 w-4 mr-1" />
                  Scan Barcodes
                </Label>
              </div>
            </div>
          </CardHeader>
          
          {/* Product-Based Form */}
          {!isBarcodeDriven && (
            <form onSubmit={handleProductBasedSubmit}>
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
                    placeholder="e.g., Customer ABC"
                    required
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="e.g., Urgent order for client"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isProductBasedValid() || createProductStockOutMutation.isPending}
                >
                  {createProductStockOutMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </CardFooter>
            </form>
          )}
          
          {/* Barcode-Driven Form */}
          {isBarcodeDriven && (
            <form onSubmit={handleBarcodeDrivenSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scan Box Barcodes</Label>
                  <div className="border rounded-md p-4">
                    <BarcodeScanner 
                      allowManualEntry={true}
                      allowCameraScanning={true}
                      onBarcodeScanned={handleBarcodeScanned}
                      inputValue={currentScannedBarcode}
                      onInputChange={(e) => setCurrentScannedBarcode(e.target.value)}
                      scanButtonLabel="Add Box"
                    />
                  </div>
                </div>
                
                {scannedBoxes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Scanned Boxes ({scannedBoxes.length})</Label>
                    <div className="border rounded-md divide-y">
                      {scannedBoxes.map((box, index) => (
                        <div key={box.barcode} className="p-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{box.product_name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeBox(index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            {box.sku ? `SKU: ${box.sku} • ` : ''}
                            Box ID: {box.barcode}
                          </div>
                          <div className="flex items-center mt-2">
                            <Label htmlFor={`box-qty-${index}`} className="mr-2 text-xs">
                              Quantity:
                            </Label>
                            <Input
                              id={`box-qty-${index}`}
                              type="number"
                              min="1"
                              max={box.quantity}
                              value={box.requestedQuantity}
                              onChange={(e) => updateBoxQuantity(index, parseInt(e.target.value))}
                              className="h-7 w-20 text-sm"
                            />
                            <span className="text-xs ml-2 text-gray-500">
                              / {box.quantity} available
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formErrors.requestedQuantity && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.requestedQuantity}</p>
                    )}
                    <div className="bg-gray-50 p-3 rounded-md mt-2">
                      <div className="text-sm font-medium">Total Quantity: {getTotalScannedQuantity()} units</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="barcodeDestination">Destination</Label>
                  <Input
                    id="barcodeDestination"
                    value={barcodeDestination}
                    onChange={(e) => setBarcodeDestination(e.target.value)}
                    placeholder="e.g., Customer ABC"
                    required
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barcodeReason">Reason (Optional)</Label>
                  <Textarea
                    id="barcodeReason"
                    value={barcodeReason}
                    onChange={(e) => setBarcodeReason(e.target.value)}
                    placeholder="e.g., Selected boxes for urgent delivery"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isBarcodeDrivenValid() || createBarcodeStockOutMutation.isPending}
                >
                  {createBarcodeStockOutMutation.isPending ? 'Submitting...' : 'Submit Barcode Request'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StockOutForm;
