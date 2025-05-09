import React from 'react';
import { SalesInquiry, SalesInquiryItem } from '@/types/database';
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

// Define a type for valid status values
type InquiryStatus = 'new' | 'in_progress' | 'completed';

interface InquiryDetailsProps {
  inquiry: SalesInquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Inquiry Details</DialogTitle>
          <DialogDescription>
            Submitted on {inquiry && formatDate(inquiry.created_at)}
          </DialogDescription>
        </DialogHeader>
        
        {inquiry && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Customer Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 text-sm">Name:</span>
                    <span className="col-span-2">{inquiry.customer_name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 text-sm">Company:</span>
                    <span className="col-span-2">{inquiry.customer_company}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 text-sm">Email:</span>
                    <span className="col-span-2">{inquiry.customer_email}</span>
                  </div>
                  {inquiry.customer_phone && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-500 text-sm">Phone:</span>
                      <span className="col-span-2">{inquiry.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-2">Inquiry Status</h3>
                <div className="flex items-center space-x-3">
                  <Select
                    value={inquiry.status}
                    onValueChange={(value) => onStatusChange(inquiry.id, value)}
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
              </div>
            </div>
            
            {inquiry.message && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Additional Message</h3>
                <p className="bg-gray-50 p-3 rounded-md text-gray-700">
                  {inquiry.message}
                </p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-sm mb-2">Requested Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Requirements</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiry.items && inquiry.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {item.product?.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.specific_requirements || 
                          <span className="text-gray-400 italic">None specified</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end">
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
