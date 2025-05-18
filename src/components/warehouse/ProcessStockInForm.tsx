
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Box } from 'lucide-react';
import StockInWizard from './StockInWizard';

interface ProcessStockInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockIn: StockInRequestData | null;
  userId?: string;
  adminMode?: boolean;
}

const ProcessStockInForm: React.FC<ProcessStockInFormProps> = ({
  open,
  onOpenChange,
  stockIn,
  userId,
  adminMode = false,
}) => {
  const navigate = useNavigate();
  
  // Handle wizard completion
  const handleWizardComplete = (batchId: string) => {
    onOpenChange(false);
    // Navigate to batch details page
    const baseRoute = adminMode ? '/admin' : '/manager';
    navigate(`${baseRoute}/inventory/batch/${batchId}`);
  };
  
  // If stockIn and userId exist, show the wizard
  if (stockIn && userId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Process Stock In - ID: {stockIn.id.substring(0, 8)}
            </DialogTitle>
            <DialogDescription>
              Complete the following steps to process this stock in request
            </DialogDescription>
          </DialogHeader>
          
          <StockInWizard 
            stockIn={stockIn}
            userId={userId}
            onComplete={handleWizardComplete}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

export default ProcessStockInForm;
