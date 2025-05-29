import React from 'react';
import { SalesInquiry } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InquiryListProps {
  inquiries: SalesInquiry[];
  isLoading: boolean;
  onViewDetails: (inquiry: SalesInquiry) => void;
  formatDate: (dateString: string) => string;
}

export const InquiryList: React.FC<InquiryListProps> = ({
  inquiries,
  isLoading,
  onViewDetails,
  formatDate
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sales inquiries found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((inquiry) => (
            <TableRow key={inquiry.id}>
              <TableCell>{formatDate(inquiry.created_at)}</TableCell>
              <TableCell className="font-medium">{inquiry.customer_name}</TableCell>
              <TableCell>{inquiry.customer_email}</TableCell>
              <TableCell>{inquiry.product_id}</TableCell>
              <TableCell>{inquiry.quantity}</TableCell>
              <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  onClick={() => onViewDetails(inquiry)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
