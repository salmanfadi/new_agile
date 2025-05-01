
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

interface StockInData {
  id: string;
  product: { name: string };
  submitter: { name: string; username: string };
  boxes: number;
  status: string;
  created_at: string;
}

interface ProcessingForm {
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
}

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInData | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [processingForm, setProcessingForm] = useState<ProcessingForm>({
    warehouse_id: '',
    location_id: '',
    barcode: '',
    quantity: 0,
    color: '',
    size: '',
  });

  // Fetch pending stock in requests
  const { data: stockInRequests, isLoading } = useQuery({
    queryKey: ['stock-in-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          submitter:submitted_by(name, username),
          boxes,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockInData[];
    },
  });

  // Fetch warehouses for the dropdown
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch warehouse locations based on selected warehouse
  const { data: locations } = useQuery({
    queryKey: ['warehouse-locations', processingForm.warehouse_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', processingForm.warehouse_id)
        .order('floor')
        .order('zone');
        
      if (error) throw error;
      return data;
    },
    enabled: !!processingForm.warehouse_id,
  });

  // Update stock in status mutation
  const updateStockInMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('stock_in')
        .update({ 
          status,
          processed_by: user?.id 
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      toast({
        title: 'Stock In Updated',
        description: 'The stock in request has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update stock in status',
      });
    },
  });

  // Process stock in mutation
  const processStockInMutation = useMutation({
    mutationFn: async (data: { stockInId: string; details: ProcessingForm }) => {
      // First update stock in status to processing
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({ 
          status: 'processing',
          processed_by: user?.id 
        })
        .eq('id', data.stockInId);

      if (updateError) throw updateError;

      // Then create stock in details
      const { error: detailsError } = await supabase
        .from('stock_in_details')
        .insert([{
          stock_in_id: data.stockInId,
          warehouse_id: data.details.warehouse_id,
          location_id: data.details.location_id,
          barcode: data.details.barcode,
          quantity: data.details.quantity,
          color: data.details.color || null,
          size: data.details.size || null,
        }]);

      if (detailsError) throw detailsError;

      // Create or update inventory
      const { data: existingInventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('barcode', data.details.barcode)
        .maybeSingle();

      if (existingInventory) {
        // Update existing inventory
        const { error: updateInventoryError } = await supabase
          .from('inventory')
          .update({ 
            quantity: existingInventory.quantity + data.details.quantity 
          })
          .eq('id', existingInventory.id);

        if (updateInventoryError) throw updateInventoryError;
      } else {
        // Get product_id from stock_in
        const { data: stockInData } = await supabase
          .from('stock_in')
          .select('product_id')
          .eq('id', data.stockInId)
          .single();

        if (!stockInData) throw new Error('Stock in not found');

        // Create new inventory entry
        const { error: createInventoryError } = await supabase
          .from('inventory')
          .insert([{
            product_id: stockInData.product_id,
            warehouse_id: data.details.warehouse_id,
            location_id: data.details.location_id,
            barcode: data.details.barcode,
            quantity: data.details.quantity,
            color: data.details.color || null,
            size: data.details.size || null,
          }]);

        if (createInventoryError) throw createInventoryError;
      }

      // Finally update stock in status to completed
      const { error: completeError } = await supabase
        .from('stock_in')
        .update({ status: 'completed' })
        .eq('id', data.stockInId);

      if (completeError) throw completeError;

      return true;
    },
    onSuccess: () => {
      setIsProcessingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Stock In Processed',
        description: 'The stock in has been processed and added to inventory.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process stock in',
      });
    },
  });

  const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
    updateStockInMutation.mutate({ id, status });
  };

  const handleProcess = (stockIn: StockInData) => {
    setSelectedStockIn(stockIn);
    setProcessingForm({
      warehouse_id: '',
      location_id: '',
      barcode: `${Date.now()}`, // Generate a temporary barcode
      quantity: stockIn.boxes * 10, // Assume each box has 10 units
      color: '',
      size: '',
    });
    setIsProcessingDialogOpen(true);
  };

  const handleProcessingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockIn) return;

    processStockInMutation.mutate({
      stockInId: selectedStockIn.id,
      details: processingForm,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock In Processing" 
        description="Process incoming stock requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Stock In Requests</CardTitle>
          <CardDescription>Review and process incoming stock requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : !stockInRequests || stockInRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending stock in requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Boxes</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockInRequests.map((stockIn) => (
                    <TableRow key={stockIn.id} className="bg-green-50">
                      <TableCell className="font-medium">{stockIn.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell>{stockIn.submitter ? `${stockIn.submitter.name} (${stockIn.submitter.username})` : 'Unknown'}</TableCell>
                      <TableCell>{stockIn.boxes}</TableCell>
                      <TableCell>{new Date(stockIn.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={stockIn.status as any} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleProcess(stockIn)}
                        >
                          Process
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600"
                          onClick={() => handleStatusUpdate(stockIn.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleStatusUpdate(stockIn.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Stock In</DialogTitle>
          </DialogHeader>
          
          {selectedStockIn && (
            <form onSubmit={handleProcessingSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="font-medium">Product: {selectedStockIn.product?.name}</div>
                  <div className="text-sm text-gray-500">Boxes: {selectedStockIn.boxes}</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warehouse_id">Warehouse</Label>
                  <Select 
                    value={processingForm.warehouse_id} 
                    onValueChange={(value) => setProcessingForm(prev => ({ ...prev, warehouse_id: value, location_id: '' }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location_id">Location</Label>
                  <Select 
                    value={processingForm.location_id} 
                    onValueChange={(value) => setProcessingForm(prev => ({ ...prev, location_id: value }))}
                    disabled={!processingForm.warehouse_id}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          Floor {location.floor}, Zone {location.zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input 
                    id="barcode"
                    value={processingForm.barcode}
                    onChange={(e) => setProcessingForm(prev => ({ ...prev, barcode: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity"
                    type="number"
                    min="1"
                    value={processingForm.quantity}
                    onChange={(e) => setProcessingForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color (Optional)</Label>
                  <Input 
                    id="color"
                    value={processingForm.color}
                    onChange={(e) => setProcessingForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="size">Size (Optional)</Label>
                  <Input 
                    id="size"
                    value={processingForm.size}
                    onChange={(e) => setProcessingForm(prev => ({ ...prev, size: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsProcessingDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!processingForm.warehouse_id || !processingForm.location_id || processStockInMutation.isPending}
                >
                  {processStockInMutation.isPending ? 'Processing...' : 'Process Stock In'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockInProcessing;
