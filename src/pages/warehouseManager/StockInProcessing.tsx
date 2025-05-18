
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { ProcessStockInDialog } from '@/components/warehouse/ProcessStockInDialog';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { toast } from '@/hooks/use-toast';

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInRequestData | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Handle process button click - with clear logging for debugging
  const handleProcess = (stockIn: StockInRequestData) => {
    console.log("Processing stock in:", stockIn.id);
    
    try {
      // Navigate to the correct route with proper stockInId
      navigate(`/manager/stock-in/unified/${stockIn.id}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Failed to navigate to processing page. Please try again."
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock In Processing" 
        description="Process incoming stock and add to inventory"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manager')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by status:</span>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Awaiting Processing</SelectItem>
                <SelectItem value="processing">In Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Stock In Requests</CardTitle>
          <CardDescription>Process incoming stock requests and add to inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <StockInRequestsTable 
            status={statusFilter !== "all" ? statusFilter : ""}
            onProcess={handleProcess}
          />
        </CardContent>
      </Card>

      {/* Legacy Process Dialog - keeping for backward compatibility */}
      <ProcessStockInDialog
        open={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
        selectedStockIn={selectedStockIn}
        userId={user?.id}
      />
    </div>
  );
};

export default StockInProcessing;
