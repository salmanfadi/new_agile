
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  const [wizardMode, setWizardMode] = useState(true);
  
  // Handle wizard completion
  const handleWizardComplete = (batchId: string) => {
    onOpenChange(false);
    // Navigate to batch details page
    const baseRoute = adminMode ? '/admin' : '/manager';
    navigate(`${baseRoute}/inventory/batch/${batchId}`);
  };
  
  // If wizard is active, show the wizard
  if (wizardMode && stockIn && userId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Process Stock In Request
          </DialogTitle>
          <DialogDescription>
            Choose how you want to process this stock in request
          </DialogDescription>
        </DialogHeader>
        
        {stockIn && (
          <div className="space-y-4 py-3">
            {/* Stock In Information Summary */}
            <div className="bg-muted/60 p-3 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Product:</span>
                <span className="font-medium">{stockIn.product?.name || 'Unknown Product'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Source:</span>
                <span>{stockIn.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Requested Boxes:</span>
                <span className="font-medium">{stockIn.boxes}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setWizardMode(true)}
                className="w-full"
                variant="default"
              >
                Continue to Processing
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessStockInForm;
