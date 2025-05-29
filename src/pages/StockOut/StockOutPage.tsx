import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { StockStatus, StockOutRequest, BatchItem, Inventory, ProcessedBatch, InventoryProduct } from '@/types/database';

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

interface CustomerDetails {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

const StockOutPage: React.FC<StockOutPageProps> = () => {
  const { user } = useAuth();
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
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [processingQuantity, setProcessingQuantity] = useState<number>(0);
  const [selectedStockOutId, setSelectedStockOutId] = useState<string>('');

  // Check if user is admin or warehouse manager
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'warehouse_manager';
  const isFieldOperator = user?.role === 'field_operator';

  // Fetch stock out requests
  const { data: stockOutRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['stock-out-requests', dateRange, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('stock_out')
        .select(`
          *,
          product:products(*),
          requester:profiles!requested_by(*),
          approver:profiles!approved_by(*)
        `);

      if (dateRange?.from) {
        query = query.gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        query = query.lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return (data as any[]).map((item): StockOutRequest => ({
        id: item.id,
        created_at: item.created_at,
        requested_by: item.requested_by,
        approved_by: item.approved_by,
        status: item.status as StockStatus,
        destination: item.destination,
        notes: item.notes,
        type: item.type,
        batch_id: item.batch_id,
        box_ids: item.box_ids,
        product: item.product,
        quantity: item.quantity,
        requester: item.requester,
        approver: item.approver,
      }));
    },
  });

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
  const { data: boxes } = useQuery({
    queryKey: ['boxes', selectedBatchId],
    queryFn: async () => {
      const { data: rawData, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .eq('batch_id', selectedBatchId)
        .not('box_id', 'is', null);
      if (error) throw error;

      return (rawData || []).map((item: any) => ({
        id: item.id,
        barcode: item.barcode,
        product_id: item.product_id,
        quantity: item.quantity,
        box_id: item.box_id,
        batch_id: item.batch_id,
        product: item.product,
        location_id: item.location_id,
        warehouse_id: item.warehouse_id,
        warehouse_location_id: item.warehouse_location_id,
        status: item.status,
        created_at: item.created_at,
      })) as Inventory[];
    },
    enabled: isAdminOrManager && selectedBatchId !== '',
  });

  // Fetch items for item-wise stock out
  const { data: items } = useQuery({
    queryKey: ['items', selectedBoxId],
    queryFn: async () => {
      const { data: rawData, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .eq('box_id', selectedBoxId);
      if (error) throw error;

      return (rawData || []).map((item: any) => ({
        id: item.id,
        barcode: item.barcode,
        product_id: item.product_id,
        quantity: item.quantity,
        box_id: item.box_id,
        batch_id: item.batch_id,
        product: item.product,
        location_id: item.location_id,
        warehouse_id: item.warehouse_id,
        warehouse_location_id: item.warehouse_location_id,
        status: item.status,
        created_at: item.created_at,
      })) as Inventory[];
    },
    enabled: isAdminOrManager && selectedBoxId !== '',
  });

  // Mutation for processing stock out items
  const processStockOutMutation = useMutation({
    mutationFn: async (data: {
      stockOutId: string;
      barcode: string;
      quantity: number;
    }) => {
      const { data: result, error } = await supabase.rpc('process_stock_out_item', {
        p_stock_out_id: data.stockOutId,
        p_barcode: data.barcode,
        p_quantity: data.quantity,
        p_user_id: user?.id
      });

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
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for creating stock out request
  const createStockOutMutation = useMutation({
    mutationFn: async (data: {
      type: 'batch' | 'box' | 'item';
      batchId?: string;
      boxIds?: string[];
      itemQuantities?: Record<string, number>;
      destination: string;
      notes?: string;
      customerDetails: CustomerDetails;
    }) => {
      // Validate required fields
      if (!data.destination) {
        throw new Error('Destination is required');
      }

      let productId: string | undefined;
      let totalQuantity = 0;

      // Calculate quantity and get product ID based on type
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
        productId = boxData[0].product_id; // All boxes should have same product
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

      // Create stock out request with customer details
      const { data: stockOut, error } = await supabase
        .from('stock_out')
        .insert([
          {
            requested_by: user?.id,
            status: 'pending',
            destination: data.destination,
            notes: data.notes,
            product_id: productId,
            quantity: totalQuantity,
            type: data.type,
            batch_id: data.type === 'batch' ? data.batchId : null,
            box_ids: data.type === 'box' ? data.boxIds : null,
            customer_name: data.customerDetails.name,
            customer_email: data.customerDetails.email,
            customer_phone: data.customerDetails.phone,
            customer_company: data.customerDetails.company,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // If items type, create stock out details
      if (data.type === 'item' && data.itemQuantities) {
        const details = Object.entries(data.itemQuantities).map(([itemId, quantity]) => ({
          stock_out_id: stockOut.id,
          inventory_id: itemId,
          requested_quantity: quantity,
          quantity: quantity, // Match Supabase schema requirement
          status: 'pending'
        } as StockOutDetails));

        const { error: detailsError } = await supabase
          .from('stock_out_details')
          .insert(details);

        if (detailsError) throw detailsError;
      }

      return stockOut;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock out request created successfully',
      });
      // Reset form
      setSelectedBatchId('');
      setSelectedBoxIds([]);
      setSelectedBoxId('');
      setItemQuantities({});
      setDestination('');
      setNotes('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
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
      accessorKey: 'requester.name',
      header: 'Requested By',
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
      accessorKey: 'processed_by',
      header: 'Processed By',
      cell: ({ row }) => {
        const processedBy = row.original.processed_by;
        return processedBy ? (
          <span>{row.original.processor?.name || 'Unknown'}</span>
        ) : (
          <span className="text-gray-400">Not processed</span>
        );
      },
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

  // Handle stock out request creation
  const handleCreateStockOut = async (destination: string, notes?: string, customerDetails: CustomerDetails = { name: '', email: '', phone: '', company: '' }) => {
    try {
      if (selectedStockOutType === 'batch' && selectedBatchId) {
        await createStockOutMutation.mutateAsync({
          type: 'batch',
          batchId: selectedBatchId,
          destination,
          notes,
          customerDetails,
        });
      } else if (selectedStockOutType === 'box' && selectedBoxIds.length > 0) {
        await createStockOutMutation.mutateAsync({
          type: 'box',
          boxIds: selectedBoxIds,
          destination,
          notes,
          customerDetails,
        });
      } else if (selectedStockOutType === 'item' && Object.keys(itemQuantities).length > 0) {
        await createStockOutMutation.mutateAsync({
          type: 'item',
          itemQuantities,
          destination,
          notes,
          customerDetails,
        });
      }

      toast({
        title: 'Success',
        description: 'Stock out request created successfully',
      });
    } catch (error) {
      console.error('Error creating stock out request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create stock out request',
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
                <div className="space-y-4">
                  <div>
                    <Label>Stock Out Type</Label>
                    <Select
                      value={selectedStockOutType}
                      onValueChange={(value: 'batch' | 'box' | 'item') =>
                        setSelectedStockOutType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batch">Batch-wise</SelectItem>
                        <SelectItem value="box">Box-wise</SelectItem>
                        <SelectItem value="item">Item-wise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Batch selection */}
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

                  {/* Box selection */}
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
                              Box {box.box_id} - {box.product?.name} ({box.quantity} items)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Item selection */}
                  {selectedStockOutType === 'item' && (
                    <div>
                      <Label>Select Box</Label>
                      <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select box" />
                        </SelectTrigger>
                        <SelectContent>
                          {boxes?.map((box) => (
                            <SelectItem key={box.id} value={box.id}>
                              Box {box.box_id} - {box.product?.name}
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

                  {/* Customer Details Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Customer Details</h3>
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
                  </div>

                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input
                      placeholder="Enter destination"
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      placeholder="Enter notes"
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() =>
                      handleCreateStockOut(destination, notes, customerDetails)
                    }
                    disabled={
                      !destination ||
                      !customerDetails.name ||
                      (selectedStockOutType === 'batch' && !selectedBatchId) ||
                      (selectedStockOutType === 'box' && selectedBoxIds.length === 0) ||
                      (selectedStockOutType === 'item' &&
                        Object.values(itemQuantities).every((q) => q === 0))
                    }
                  >
                    Generate Stock Out Request
                  </Button>
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
                              {req.customer_name} - {req.product?.name}
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