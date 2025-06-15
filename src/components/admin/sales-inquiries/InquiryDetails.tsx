
import React, { useState } from 'react';
import { SalesInquiry } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, User, Mail, Building, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InquiryDetailsProps {
  inquiry: SalesInquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: 'new' | 'in_progress' | 'completed') => Promise<boolean>;
  onConvertToOrder?: (inquiry: SalesInquiry) => Promise<boolean>;
  formatDate: (dateString: string) => string;
}

export const InquiryDetails: React.FC<InquiryDetailsProps> = ({
  inquiry,
  open,
  onOpenChange,
  onStatusChange,
  onConvertToOrder,
  formatDate
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  if (!inquiry) return null;

  const handleStatusUpdate = async (newStatus: 'new' | 'in_progress' | 'completed') => {
    setIsUpdatingStatus(true);
    try {
      const success = await onStatusChange(inquiry.id, newStatus);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!onConvertToOrder) return;
    
    setIsConverting(true);
    try {
      const success = await onConvertToOrder(inquiry);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsConverting(false);
    }
  };

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Inquiry Details - {inquiry.customer_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Name:</span>
                <span>{inquiry.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span>{inquiry.customer_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Company:</span>
                <span>{inquiry.customer_company}</span>
              </div>
              {inquiry.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span>{inquiry.customer_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(inquiry.status)}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {formatDate(inquiry.created_at)}
                </div>
              </div>
              
              {inquiry.message && (
                <div>
                  <span className="font-medium">Message:</span>
                  <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded">{inquiry.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          {inquiry.items && inquiry.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Requested Items ({inquiry.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inquiry.items.map((item, index) => (
                    <div key={item.id || index} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {item.product?.name || 'Unknown Product'}
                          </h4>
                          {item.product?.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.product.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Quantity</div>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                      </div>
                      {item.specific_requirements && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-sm font-medium">Requirements:</span>
                          <p className="text-sm text-gray-600">{item.specific_requirements}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              {inquiry.status !== 'completed' && (
                <>
                  {inquiry.status === 'new' && (
                    <Button
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={isUpdatingStatus}
                      variant="outline"
                    >
                      Mark In Progress
                    </Button>
                  )}
                  <Button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdatingStatus}
                    variant="outline"
                  >
                    Mark Completed
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              {inquiry.status !== 'completed' && onConvertToOrder && (
                <Button
                  onClick={handleConvertToOrder}
                  disabled={isConverting}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isConverting ? 'Converting...' : 'Convert to Sales Order'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
