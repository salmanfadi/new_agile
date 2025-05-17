
import React, { useState } from 'react';
import { useTransfers } from '@/hooks/useTransfers';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

const TransferApprovalList: React.FC = () => {
  const { getPendingTransfers, approveTransfer, rejectTransfer } = useTransfers();
  const { data: pendingTransfers, isLoading, error } = getPendingTransfers();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const handleApproveClick = (transferId: string) => {
    approveTransfer.mutate(transferId);
  };
  
  const handleRejectClick = (transferId: string) => {
    setSelectedTransfer(transferId);
    setIsDialogOpen(true);
  };
  
  const handleRejectConfirm = () => {
    if (selectedTransfer) {
      rejectTransfer.mutate({ 
        transferId: selectedTransfer, 
        reason: rejectionReason 
      });
      setIsDialogOpen(false);
      setSelectedTransfer(null);
      setRejectionReason('');
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Transfers</CardTitle>
          <CardDescription>Loading transfer requests...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Transfers</CardTitle>
          <CardDescription className="text-red-500">
            Error loading transfer requests. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!pendingTransfers || pendingTransfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Transfers</CardTitle>
          <CardDescription>No pending transfer requests found</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Transfers</CardTitle>
          <CardDescription>Review and approve transfer requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pendingTransfers && pendingTransfers.map(transfer => (
              <Card key={transfer.id} className="border-t border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Transfer Request</CardTitle>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <CardDescription>
                    Requested by {transfer.initiator?.name || transfer.initiator?.username || 'Unknown'} on {new Date(transfer.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">From</p>
                      <p className="font-medium">{transfer.source_warehouse?.name || 'Unknown Warehouse'}</p>
                      <p className="text-sm text-gray-500">
                        Floor {transfer.source_location?.floor || '?'}, Zone {transfer.source_location?.zone || '?'}
                      </p>
                    </div>
                    
                    <div className="flex justify-center items-center">
                      <div className="flex items-center text-gray-500">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="mx-2">{transfer.quantity}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">To</p>
                      <p className="font-medium">{transfer.destination_warehouse?.name || 'Unknown Warehouse'}</p>
                      <p className="text-sm text-gray-500">
                        Floor {transfer.destination_location?.floor || '?'}, Zone {transfer.destination_location?.zone || '?'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Product</p>
                    <p>
                      {transfer.products?.name || 'Unknown Product'}{' '}
                      {transfer.products?.sku && <span className="text-gray-500">({transfer.products.sku})</span>}
                    </p>
                  </div>

                  {transfer.transfer_reason && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium">Transfer Reason</p>
                      <p className="text-gray-600">{transfer.transfer_reason}</p>
                    </div>
                  )}
                  
                  {transfer.notes && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-gray-600">{transfer.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectClick(transfer.id)}
                      disabled={rejectTransfer.isPending}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleApproveClick(transfer.id)}
                      disabled={approveTransfer.isPending}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Rejection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transfer</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transfer request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectionReason.trim() === ''}
            >
              Reject Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransferApprovalList;
