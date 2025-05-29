import React from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StockInWizard from './StockInWizard';

interface ProcessStockInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockIn: StockInRequestData | null;
  userId?: string;
}

const ProcessStockInForm: React.FC<ProcessStockInFormProps> = ({
  open,
  onOpenChange,
  stockIn,
  userId,
}) => {
  if (!stockIn) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle>Process Stock In Request</DialogTitle>
          <DialogDescription className="text-sm">
            {stockIn.product.name}
            {stockIn.product.sku && ` (SKU: ${stockIn.product.sku})`} - 
            {stockIn.number_of_boxes} boxes
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <StockInWizard
            stockIn={stockIn}
            userId={userId}
            onComplete={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessStockInForm;
