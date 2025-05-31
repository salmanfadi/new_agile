import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reserveStockService } from '@/services/reserveStockService';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ReserveStockDetailProps {
  id: string;
  onClose: () => void;
}

export const ReserveStockDetail: React.FC<ReserveStockDetailProps> = ({ id, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: stock, isLoading, error } = useQuery({
    queryKey: ['reserve-stocks', id],
    queryFn: () => reserveStockService.getById(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => reserveStockService.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reserve-stocks'] });
      toast({
        title: 'Success',
        description: 'Reserve stock cancelled successfully.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to cancel reserve stock.',
        variant: 'destructive',
      });
      console.error('Error cancelling reserve stock:', error);
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !stock) {
    return <div>Error loading reserve stock details</div>;
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      cancelMutation.mutate();
    }
  };

  const handleStockOut = () => {
    navigate('/stock-out/new', {
      state: {
        reserveStock: {
          id: stock.id,
          product: stock.product,
          quantity: stock.quantity,
          customer_name: stock.customer_name
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm">Product</h4>
          <p>{stock.product.name}</p>
          <p className="text-sm text-muted-foreground">SKU: {stock.product.sku}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Customer</h4>
          <p>{stock.customer_name}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Quantity</h4>
          <p>{stock.quantity}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Status</h4>
          <Badge variant={getStatusVariant(stock.status)}>
            {stock.status}
          </Badge>
        </div>
        <div>
          <h4 className="font-medium text-sm">Start Date</h4>
          <p>{format(new Date(stock.start_date), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">End Date</h4>
          <p>{format(new Date(stock.end_date), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Created At</h4>
          <p>{format(new Date(stock.created_at), 'MMM d, yyyy HH:mm')}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Last Updated</h4>
          <p>{format(new Date(stock.updated_at), 'MMM d, yyyy HH:mm')}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {stock.status === 'pending' && (
          <>
            <Button
              variant="default"
              onClick={handleStockOut}
            >
              Push to Stock Out
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              Cancel Reservation
            </Button>
          </>
        )}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
} 