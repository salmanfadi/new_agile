
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StockInRequestData } from '@/types/database';

interface RejectStockInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStockIn: StockInRequestData | null;
  userId: string | undefined;
}

export const RejectStockInDialog: React.FC<RejectStockInDialogProps> = ({
  open,
  onOpenChange,
  selectedStockIn,
  userId
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!reason.trim() || !selectedStockIn) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a reason for rejection'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update stock in status to rejected
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          processed_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStockIn.id);

      if (updateError) throw updateError;

      // Create notification for the requester if they exist
      if (selectedStockIn.submitter?.id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedStockIn.submitter.id,
            title: 'Stock In Request Rejected',
            message: `Your stock in request has been rejected. Reason: ${reason}`
          });

        if (notificationError) {
          console.error('Failed to create notification:', notificationError);
          // Don't throw here as the main operation succeeded
        }
      }

      toast({
        title: 'Stock In Rejected',
        description: 'The stock in request has been rejected successfully'
      });

      onOpenChange(false);
      setReason('');

    } catch (error) {
      console.error('Error rejecting stock in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject stock in request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedStockIn) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reject Stock In Request
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You are about to reject the stock in request.
              This action cannot be undone.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Rejection *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for rejecting this request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
