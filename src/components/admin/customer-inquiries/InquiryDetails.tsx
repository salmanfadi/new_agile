import React from 'react';
import { CustomerInquiry, CustomerInquiryItem } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';

// Define a type for valid status values
type InquiryStatus = 'new' | 'in_progress' | 'completed';

interface InquiryDetailsProps {
  inquiry: CustomerInquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: InquiryStatus) => void;
  formatDate: (dateString: string) => string;
}

export const InquiryDetails: React.FC<InquiryDetailsProps> = ({
  inquiry,
  open,
  onOpenChange,
  onStatusChange,
  formatDate
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">New</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inquiry Details</DialogTitle>
          <DialogDescription>
            Submitted on {inquiry && formatDate(inquiry.created_at)}
          </DialogDescription>
        </DialogHeader>
        
        {inquiry && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Customer Information</h3>
                <div className="grid gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Name</span>
                    <span className="font-medium">{inquiry.customer_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Company</span>
                    <span>{inquiry.customer_company}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="break-all">{inquiry.customer_email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Phone</span>
                    <span>{inquiry.customer_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Inquiry Status</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Select
                      value={inquiry.status}
                      onValueChange={(value: InquiryStatus) => onStatusChange(inquiry.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  {inquiry.converted_to_order && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Converted to Order
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {inquiry.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm">
                  {inquiry.notes}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Product Details</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Product</TableHead>
                      <TableHead className="whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="whitespace-nowrap">Price</TableHead>
                      <TableHead>Requirements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiry.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name || item.product_id}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.price ? `$${item.price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.specific_requirements || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
