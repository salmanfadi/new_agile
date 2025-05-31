import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { DataTable } from '@/components/ui/data-table';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Textarea } from '@/components/ui/textarea';
import { StockStatus, StockOutRequest, BatchItem, Inventory, ProcessedBatch, InventoryProduct } from '@/types/database';
import { Loader2, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { useStockOutRequests } from '@/hooks/useStockOutRequests';

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  reference_number: string;
}

interface StockOutPageProps {}

interface InventoryWithBox extends Inventory {
  box_id: string;
}

interface StockOutDetails {
  stock_out_id: string;
  inventory_id: string;
  requested_quantity: number;
  quantity: number; // Required by Supabase schema
  status: string;
}

interface StockOutInsert {
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  product_id: string;
  quantity: number;
  destination: string;
  notes: string | null;
  type: 'batch' | 'box' | 'item';
  batch_id: string | null;
  box_ids: string[] | null;
  customer_name: string;
  customer_company: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  reference_number: string | null;
  shipping_method: string | null;
  required_date: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  processed_by: string | null;
}

interface StockOutMutationVariables {
  type: 'batch' | 'box' | 'item';
  batchId?: string;
  boxIds?: string[];
  itemQuantities?: Record<string, number>;
  destination: string;
  notes?: string;
  customerDetails: CustomerDetails;
  shippingMethod: string;
  requiredDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface StockOutRow {
  id: string;
  created_at: string;
  status: string;
  product_id: string;
  quantity: number;
  destination: string;
  requested_by: string;
}

interface StockOutWithProduct extends StockOutRow {
  product?: {
    id: string;
    name: string;
  } | null;
}

type InventoryWithProduct = Database['public']['Tables']['inventory']['Row'] & {
  product: Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name'> | null;
};

type StockOut = Database['public']['Tables']['stock_out']['Row'] & {
  products?: {
    id: string;
    name: string;
  } | null;
};

const StockOutPage: React.FC<StockOutPageProps> = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStockOutType, setSelectedStockOutType] = useState<'batch' | 'box' | 'item'>('batch');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | ''>('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [requiredDate, setRequiredDate] = useState<Date>();
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [shippingMethod, setShippingMethod] = useState('');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    reference_number: ''
  });
  const [processingQuantity, setProcessingQuantity] = useState<number>(0);
  const [selectedStockOutId, setSelectedStockOutId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin or warehouse manager
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'warehouse_manager';
  const isFieldOperator = user?.role === 'field_operator';

  // Fetch stock out requests
  const { data: stockOutResult, isLoading: requestsLoading, error: stockOutError } = useStockOutRequests(
    {
      status: statusFilter || undefined,
      date_from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      date_to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    },
    1, // page
    100 // pageSize
  );

  const stockOutRequests = stockOutResult?.data || [];

  useEffect(() => {
    if (stockOutError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error loading stock out requests. Please try again.',
      });
    }
  }, [stockOutError]);

  // Fetch batches for batch-wise stock out
  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processed_batches')
        .select('*, products(name)');
      if (error) throw error;

      return (data as any[]).map((item): ProcessedBatch => ({
        id: item.id,
        created_at: item.created_at,
        processed_at: item.processed_at,
        processed_by: item.processed_by,
        submitted_by: item.submitted_by,
        product_id: item.product_id,
        total_quantity: item.total_quantity,
        total_boxes: item.total_boxes,
        status: item.status,
        notes: item.notes,
        warehouse_id: item.warehouse_id,
        source: item.source,
        product_name: item.products?.name || '',
      }));
    },
    enabled: isAdminOrManager,
  });

  // Fetch boxes for box-wise stock out
  const { data: boxes } = useQuery<InventoryWithProduct[]>({
    queryKey: ['boxes', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          barcode,
          product_id,
          quantity,
          status,
          warehouse_id,
          location_id,
          product:products (
            id,
            name
          )
        `)
        .eq('batch_id', selectedBatchId);

      if (error) throw error;
      return (data || []) as InventoryWithProduct[];
    },
    enabled: isAdminOrManager && selectedBatchId !== '',
  });

  // Fetch items for item-wise stock out
  const { data: items } = useQuery<InventoryWithProduct[]>({
    queryKey: ['items', selectedBoxId],
    queryFn: async () => {
      if (!selectedBoxId) return [];

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          barcode,
          product_id,
          quantity,
          status,
          warehouse_id,
          location_id,
          product:products (
            id,
            name
          )
        `)
        .eq('barcode', selectedBoxId);

      if (error) throw error;
      return (data || []) as InventoryWithProduct[];
    },
    enabled: isAdminOrManager && selectedBoxId !== '',
  });

  // Mutation for processing stock out items
  interface ProcessStockOutParams {
    p_stock_out_id: string;
    p_barcode: string;
    p_quantity: number;
    p_user_id: string;
  }

  const processStockOutMutation = useMutation({
    mutationFn: async (data: {
      stockOutId: string;
      barcode: string;
      quantity: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const params: ProcessStockOutParams = {
        p_stock_out_id: data.stockOutId,
        p_barcode: data.barcode,
        p_quantity: data.quantity,
        p_user_id: user.id
      };

      const { data: result, error } = await supabase.rpc(
        'process_stock_out_item' as any,
        params
      );

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock out item processed successfully',
      });
      setProcessingQuantity(0);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Mutation for creating stock out request
  const createStockOutMutation = useMutation<any, Error, StockOutMutationVariables>({
    mutationFn: async (data) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get product ID and quantity based on type
      let productId: string | undefined;
      let totalQuantity = 0;

      if (data.type === 'batch' && data.batchId) {
        const { data: batchData } = await supabase
          .from('processed_batches')
          .select('product_id, total_quantity')
          .eq('id', data.batchId)
          .single();
        
        if (!batchData) throw new Error('Batch not found');
        productId = batchData.product_id;
        totalQuantity = batchData.total_quantity;
      } 
      else if (data.type === 'box' && data.boxIds?.length) {
        const { data: boxData } = await supabase
          .from('inventory')
          .select('product_id, quantity')
          .in('box_id', data.boxIds);
        
        if (!boxData?.length) throw new Error('Boxes not found');
        productId = boxData[0].product_id;
        totalQuantity = boxData.reduce((sum, box) => sum + (box.quantity || 0), 0);
      }
      else if (data.type === 'item' && data.itemQuantities) {
        const itemIds = Object.keys(data.itemQuantities);
        if (!itemIds.length) throw new Error('No items selected');

        const { data: itemData } = await supabase
          .from('inventory')
          .select('product_id, quantity')
          .in('id', itemIds)
          .limit(1);
        
        if (!itemData?.length) throw new Error('Items not found');
        productId = itemData[0].product_id;
        totalQuantity = Object.values(data.itemQuantities).reduce((sum, qty) => sum + qty, 0);
      }

      if (!productId || totalQuantity <= 0) {
        throw new Error('Invalid product or quantity');
      }

      const stockOutData: StockOutInsert = {
        requester_id: user.id,
            status: 'pending',
            product_id: productId,
            quantity: totalQuantity,
        destination: data.destination,
        notes: data.notes || null,
            type: data.type,
        batch_id: data.type === 'batch' ? data.batchId || null : null,
        box_ids: data.type === 'box' ? data.boxIds || null : null,
            customer_name: data.customerDetails.name,
        customer_company: data.customerDetails.company || null,
        customer_email: data.customerDetails.email || null,
        customer_phone: data.customerDetails.phone || null,
        customer_address: data.customerDetails.address || null,
        reference_number: data.customerDetails.reference_number || null,
        shipping_method: data.shippingMethod || null,
        required_date: data.requiredDate?.toISOString() || null,
        priority: data.priority,
        processed_by: null
      };

      const { data: stockOut, error } = await supabase
        .from('stock_out')
        .insert([stockOutData])
        .select()
        .single();

      if (error) throw error;

      // If items type, create stock out details
      if (data.type === 'item' && data.itemQuantities) {
        const details = Object.entries(data.itemQuantities).map(([itemId, quantity]) => ({
          stock_out_id: stockOut.id,
          inventory_id: itemId,
          quantity: quantity,
          status: 'pending'
        }));

        const { error: detailsError } = await supabase
          .from('stock_out_details')
          .insert(details);

        if (detailsError) throw detailsError;
      }

      return stockOut;
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock out request created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      
      // Reset form
      setSelectedBatchId('');
      setSelectedBoxIds([]);
      setSelectedBoxId('');
      setItemQuantities({});
      setDestination('');
      setNotes('');
      setCustomerDetails({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        reference_number: ''
      });
      setShippingMethod('');
      setRequiredDate(undefined);
      setPriority('normal');
    },
    onError: (error) => {
      console.error('Error creating stock out request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create stock out request',
      });
    },
  });

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.created_at), 'yyyy-MM-dd HH:mm'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'product.name',
      header: 'Product',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'destination',
      header: 'Destination',
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
    },
    {
      accessorKey: 'customer_company',
      header: 'Company',
    },
    {
      accessorKey: 'shipping_method',
      header: 'Shipping Method',
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={getPriorityVariant(row.original.priority)}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'required_date',
      header: 'Required Date',
      cell: ({ row }) => row.original.required_date ? format(new Date(row.original.required_date), 'yyyy-MM-dd') : '-',
    },
  ];

  const getStatusVariant = (status: StockStatus) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Handle stock out request creation
  const handleCreateStockOut = async () => {
    try {
      if (!destination || !customerDetails.name) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please fill in all required fields',
        });
        return;
      }

      const baseData = {
        destination,
        notes,
        customerDetails,
        shippingMethod,
        requiredDate,
        priority,
      };

      if (selectedStockOutType === 'batch' && selectedBatchId) {
        await createStockOutMutation.mutateAsync({
          ...baseData,
          type: 'batch',
          batchId: selectedBatchId,
        });
      } else if (selectedStockOutType === 'box' && selectedBoxIds.length > 0) {
        await createStockOutMutation.mutateAsync({
          ...baseData,
          type: 'box',
          boxIds: selectedBoxIds,
        });
      } else if (selectedStockOutType === 'item' && Object.keys(itemQuantities).length > 0) {
        await createStockOutMutation.mutateAsync({
          ...baseData,
          type: 'item',
          itemQuantities,
        });
      } else {
      toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please select items to stock out',
      });
      }
    } catch (error) {
      console.error('Error creating stock out request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create stock out request',
      });
    }
  };

  // Handle barcode scanning for field operators
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      if (!selectedStockOutId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a stock out request to process',
        });
        return;
      }

      await processStockOutMutation.mutateAsync({
        stockOutId: selectedStockOutId,
        barcode,
        quantity: processingQuantity || 1, // Default to 1 if quantity not specified
      });
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process barcode',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Stock Out Management"
        description="Process and manage stock out requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Create/Process Stock Out */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isAdminOrManager ? 'Create Stock Out Request' : 'Process Stock Out'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAdminOrManager ? (
                <div className="space-y-6">
                  {/* Stock Out Type Selection */}
                <div className="space-y-4">
                    <Label>Stock Out Type</Label>
                    <div className="flex space-x-4">
                      <Button
                        variant={selectedStockOutType === 'batch' ? 'default' : 'outline'}
                        onClick={() => setSelectedStockOutType('batch')}
                      >
                        Batch
                      </Button>
                      <Button
                        variant={selectedStockOutType === 'box' ? 'default' : 'outline'}
                        onClick={() => setSelectedStockOutType('box')}
                      >
                        Box
                      </Button>
                      <Button
                        variant={selectedStockOutType === 'item' ? 'default' : 'outline'}
                        onClick={() => setSelectedStockOutType('item')}
                      >
                        Item
                      </Button>
                    </div>
                  </div>

                  {/* Customer Details Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Customer Name *</Label>
                          <Input
                            value={customerDetails.name}
                            onChange={(e) =>
                              setCustomerDetails({ ...customerDetails, name: e.target.value })
                            }
                            placeholder="Enter customer name"
                            required
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={customerDetails.company}
                            onChange={(e) =>
                              setCustomerDetails({ ...customerDetails, company: e.target.value })
                            }
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={customerDetails.email}
                            onChange={(e) =>
                              setCustomerDetails({ ...customerDetails, email: e.target.value })
                            }
                            placeholder="Enter email"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={customerDetails.phone}
                            onChange={(e) =>
                              setCustomerDetails({ ...customerDetails, phone: e.target.value })
                            }
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Shipping Address</Label>
                          <Textarea
                            value={customerDetails.address}
                            onChange={(e) =>
                              setCustomerDetails({ ...customerDetails, address: e.target.value })
                            }
                            placeholder="Enter shipping address"
                          />
                        </div>
                        <div>
                          <Label>Reference Number</Label>
                          <Input
                            value={customerDetails.reference_number}
                            onChange={(e) =>
                              setCustomerDetails({ ...customerDetails, reference_number: e.target.value })
                            }
                            placeholder="Enter PO/reference number"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Details Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Destination *</Label>
                          <Input
                            placeholder="Enter destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Shipping Method</Label>
                          <Select value={shippingMethod} onValueChange={setShippingMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shipping method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard Shipping</SelectItem>
                              <SelectItem value="express">Express Shipping</SelectItem>
                              <SelectItem value="pickup">Customer Pickup</SelectItem>
                              <SelectItem value="courier">Courier Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Required Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !requiredDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {requiredDate ? format(requiredDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={requiredDate}
                                onSelect={setRequiredDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select value={priority} onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => setPriority(value)}>
                      <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                        <div className="md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            placeholder="Enter any special instructions or additional notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Selection Section */}
                  {selectedStockOutType === 'batch' && (
                    <div>
                      <Label>Select Batch</Label>
                      <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches?.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.id} - {batch.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedStockOutType === 'box' && boxes && (
                    <div>
                      <Label>Select Boxes</Label>
                      <div className="space-y-2">
                        {boxes.map((box) => (
                          <div key={box.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedBoxIds.includes(box.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBoxIds([...selectedBoxIds, box.id]);
                                } else {
                                  setSelectedBoxIds(selectedBoxIds.filter((id) => id !== box.id));
                                }
                              }}
                            />
                            <span>
                              Box {box.barcode} - {box.product?.name} ({box.quantity} items)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStockOutType === 'item' && (
                    <div>
                      <Label>Select Box</Label>
                      <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select box" />
                        </SelectTrigger>
                        <SelectContent>
                          {boxes?.map((box) => (
                            <SelectItem key={box.id} value={box.barcode}>
                              Box {box.barcode} - {box.product?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {items && (
                        <div className="mt-4 space-y-2">
                          <Label>Select Items</Label>
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={itemQuantities[item.id] || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value >= 0 && value <= item.quantity) {
                                    setItemQuantities({
                                      ...itemQuantities,
                                      [item.id]: value,
                                    });
                                  }
                                }}
                              />
                              <span>
                                {item.product?.name} (Available: {item.quantity})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => {/* handle cancel */}}>
                      Cancel
                    </Button>
                  <Button
                      onClick={handleCreateStockOut}
                      disabled={!destination || !customerDetails.name}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Stock Out Request...
                        </>
                      ) : (
                        'Create Stock Out Request'
                      )}
                  </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Field Operator Processing Section */}
                  <div>
                    <Label>Select Stock Out Request</Label>
                    <Select
                      value={selectedStockOutId}
                      onValueChange={setSelectedStockOutId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select request to process" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockOutRequests
                          ?.filter((req) => req.status === 'pending')
                          .map((req) => (
                            <SelectItem key={req.id} value={req.id}>
                              {req.destination} - {req.product?.name || 'Unknown Product'}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={processingQuantity}
                      onChange={(e) => setProcessingQuantity(parseInt(e.target.value))}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <Label>Scan Box Barcode</Label>
                    <BarcodeScanner
                      onBarcodeScanned={handleBarcodeScanned}
                      allowManualEntry={true}
                      allowCameraScanning={true}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Stock Out List */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Stock Out Requests</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={(value) => setDateRange(value)}
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StockStatus | '')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={stockOutRequests || []}
                loading={requestsLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StockOutPage; 