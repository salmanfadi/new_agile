
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { RejectStockInDialog } from '@/components/warehouse/RejectStockInDialog';
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

const AdminStockInManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInRequestData | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleReject = (stockIn: StockInRequestData) => {
    console.log("Rejecting stock in with ID:", stockIn.id);
    setSelectedStockIn(stockIn);
    setIsRejectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock In Management" 
        description="Monitor and manage all stock in requests across warehouses"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
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
                <SelectItem value="pending">Awaiting Review</SelectItem>
                <SelectItem value="processing">In Processing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Stock In Requests</CardTitle>
          <CardDescription>Monitor and process incoming stock requests from all warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          <StockInRequestsTable 
            status={statusFilter !== "all" ? statusFilter : ""}
            filters={{}}
            onReject={handleReject}
            userId={user?.id}
            adminMode={true}
          />
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

export default AdminStockInManagement;
