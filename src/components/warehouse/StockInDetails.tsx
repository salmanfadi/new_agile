
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StockInData } from '@/types/stockIn';
import { Textarea } from '@/components/ui/textarea';

interface StockInDetailsProps {
  stockInData: StockInData;
  approvalNotes: string;
  setApprovalNotes: (value: string) => void;
  handleApproval: (isApproved: boolean) => void;
  isSubmitting: boolean;
}

export const StockInDetails: React.FC<StockInDetailsProps> = ({
  stockInData,
  approvalNotes,
  setApprovalNotes,
  handleApproval,
  isSubmitting
}) => {
  // Check for valid data
  if (!stockInData) {
    return <p>Stock In details not found.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stock In Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
          <p className="text-base font-semibold">{stockInData.product?.name || 'Unknown Product'}</p>
          {stockInData.product?.sku && <p className="text-sm text-gray-500">SKU: {stockInData.product.sku}</p>}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <div><Badge variant="outline" className="capitalize">{stockInData.status}</Badge></div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Boxes</h3>
          <p className="text-base">{stockInData.boxes}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
          <p className="text-base">{stockInData.source}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Submitted By</h3>
          <p className="text-base">{stockInData.submitter?.name}</p>
          {stockInData.submitter?.username && <p className="text-sm text-gray-500">{stockInData.submitter.username}</p>}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
          <p className="text-base">{new Date(stockInData.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Notes */}
      {stockInData.notes && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
          <div className="p-3 bg-muted/50 rounded-md">
            <p>{stockInData.notes}</p>
          </div>
        </div>
      )}
      
      {/* Approval Form - Only show for pending requests */}
      {stockInData.status === 'pending' && (
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Review Decision</h3>
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Enter approval or rejection notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleApproval(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Request'}
              </Button>
              <Button
                variant="default"
                onClick={() => handleApproval(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Approving...' : 'Approve Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
