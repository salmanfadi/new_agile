import React from 'react';
import { CustomerInquiry } from '@/types/database';
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
import { Card } from '@/components/ui/card';
import { MessageSquare, Phone, Building2, Mail } from 'lucide-react';

interface InquiryListProps {
  inquiries: CustomerInquiry[];
  isLoading: boolean;
  onViewDetails: (inquiry: CustomerInquiry) => void;
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
        No customer inquiries found.
      </div>
    );
  }

  // Mobile view (card layout)
  const MobileView = () => (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <Card key={inquiry.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">{formatDate(inquiry.created_at)}</div>
            {getStatusBadge(inquiry.status)}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="font-medium">{inquiry.customer_name}</div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Building2 className="h-4 w-4 mr-2" />
              {inquiry.customer_company}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {inquiry.customer_email}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {inquiry.customer_phone || 'N/A'}
            </div>
          </div>
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onViewDetails(inquiry)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </Card>
      ))}
    </div>
  );

  // Desktop view (table layout)
  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="hidden md:table-cell">Company</TableHead>
          <TableHead className="hidden lg:table-cell">Email</TableHead>
          <TableHead className="hidden lg:table-cell">Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inquiries.map((inquiry) => (
          <TableRow key={inquiry.id}>
            <TableCell>{formatDate(inquiry.created_at)}</TableCell>
            <TableCell className="font-medium">{inquiry.customer_name}</TableCell>
            <TableCell className="hidden md:table-cell">{inquiry.customer_company}</TableCell>
            <TableCell className="hidden lg:table-cell">{inquiry.customer_email}</TableCell>
            <TableCell className="hidden lg:table-cell">{inquiry.customer_phone}</TableCell>
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
  );

  return (
    <div>
      {/* Show mobile view on small screens, desktop view on larger screens */}
      <div className="block sm:hidden">
        <MobileView />
      </div>
      <div className="hidden sm:block">
        <DesktopView />
      </div>
    </div>
  );
};
