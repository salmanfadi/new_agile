
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { RejectStockInDialog } from '@/components/warehouse/RejectStockInDialog';
import { useStockInRequests, StockInRequestData } from '@/hooks/useStockInRequests';

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInRequestData | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch stock in requests with improved query to get submitter name
  const { data: stockInRequests, isLoading, error } = useStockInRequests('pending');

  // Navigate to batch processing page with the stock in ID
  const handleProcess = (stockIn: StockInRequestData) => {
    console.log("Processing stock in:", stockIn.id);
    navigate(`/manager/stock-in/batch/${stockIn.id}`);
  };

  const handleReject = (stockIn: StockInRequestData) => {
    setSelectedStockIn(stockIn);
    setIsRejectDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Stock In Processing" 
        description="Process incoming stock requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Stock In Requests</CardTitle>
          <CardDescription>Review and process incoming stock requests</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-red-500">
              Error loading stock in requests. Please try again.
            </div>
          ) : (
            <StockInRequestsTable 
              stockInRequests={stockInRequests || []}
              isLoading={isLoading}
              onProcess={handleProcess}
              onReject={handleReject}
              userId={user?.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <RejectStockInDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        selectedStockIn={selectedStockIn}
        userId={user?.id}
      />
    </div>
  );
};

export default StockInProcessing;
