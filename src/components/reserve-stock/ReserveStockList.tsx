import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reserveStockService } from '@/services/reserveStockService';
import { ReserveStockWithDetails } from '@/types/reserve-stock';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ReserveStockListProps {
  onView: (item: ReserveStockWithDetails) => void;
}

export const ReserveStockList: React.FC<ReserveStockListProps> = ({ onView }) => {
  const { data: reserveStocks, isLoading, error } = useQuery<ReserveStockWithDetails[]>({
    queryKey: ['reserve-stocks'],
    queryFn: reserveStockService.getAll,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading reserve stocks</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reserveStocks?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No reserve stocks found
              </TableCell>
            </TableRow>
          ) : (
            reserveStocks?.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell>{stock.product.name}</TableCell>
                <TableCell>{stock.customer_name}</TableCell>
                <TableCell>{stock.quantity}</TableCell>
                <TableCell>{format(new Date(stock.start_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(stock.end_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(stock.status)}>
                    {stock.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(stock)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
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