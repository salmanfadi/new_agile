import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProcessStockOutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockOut: {
    id: string;
    product: {
      id: string;
      name: string;
      sku?: string;
    };
    quantity: number;
    destination: string;
    customer?: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
    };
  } | null;
  userId?: string;
}

const ProcessStockOutForm: React.FC<ProcessStockOutFormProps> = ({
  open,
  onOpenChange,
  stockOut,
  userId,
}) => {
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!stockOut) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !stockOut.id) return;

    setIsSubmitting(true);
    try {
      // First check available inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', stockOut.product.id)
        .eq('status', 'in_stock');

      if (inventoryError) throw inventoryError;

      const availableQuantity = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (availableQuantity < approvedQuantity) {
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
          status: 'approved',
          approved_quantity: approvedQuantity,
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', stockOut.id);

      if (updateError) throw updateError;

      // Success
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Success',
        description: 'Stock out request has been approved.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing stock out:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process stock out request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Stock Out Request</DialogTitle>
          <DialogDescription>
            Review and approve the stock out request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">Product: {stockOut.product.name}</div>
              {stockOut.product.sku && (
                <div className="text-sm text-gray-500">SKU: {stockOut.product.sku}</div>
              )}
              <div className="text-sm text-gray-500">
                Requested Quantity: {stockOut.quantity}
              </div>
              <div className="text-sm text-gray-500">
                Destination: {stockOut.destination}
              </div>
              {stockOut.customer && (
                <div className="text-sm text-gray-500">
                  Customer: {stockOut.customer.name}
                  {stockOut.customer.company && ` (${stockOut.customer.company})`}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="approved_quantity">Approved Quantity</Label>
              <Input
                id="approved_quantity"
                type="number"
                min={1}
                max={stockOut.quantity}
                value={approvedQuantity}
                onChange={(e) => setApprovedQuantity(parseInt(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-gray-500">
                You can approve up to the requested quantity if inventory is available
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                approvedQuantity <= 0 ||
                approvedQuantity > stockOut.quantity ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Approve Stock Out'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessStockOutForm; 