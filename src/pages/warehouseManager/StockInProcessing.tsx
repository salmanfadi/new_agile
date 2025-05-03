
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ProcessStockInDialog } from '@/components/warehouse/ProcessStockInDialog';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';

interface StockInData {
  id: string;
  product: { name: string };
  submitter: { name: string; username: string } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
}

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInData | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);

  // Fetch pending stock in requests
  const { data: stockInRequests, isLoading } = useQuery({
    queryKey: ['stock-in-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          submitter:profiles!stock_in_submitter_fkey(name, username),
          boxes,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle potential embedding errors
      return (data as any[]).map(item => ({
        id: item.id,
        product: item.product || { name: 'Unknown Product' },
        submitter: item.submitter || { name: 'Unknown', username: 'unknown' },
        boxes: item.boxes,
        status: item.status as StockInData['status'],
        created_at: item.created_at
      })) as StockInData[];
    },
  });

  const handleProcess = (stockIn: StockInData) => {
    setSelectedStockIn(stockIn);
    setIsProcessingDialogOpen(true);
  };

  return (
    <div className="space-y-6">
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
          <CardTitle>Pending Stock In Requests</CardTitle>
          <CardDescription>Review and process incoming stock requests</CardDescription>
        </CardHeader>
        <CardContent>
          <StockInRequestsTable 
            stockInRequests={stockInRequests}
            isLoading={isLoading}
            onProcess={handleProcess}
            userId={user?.id}
          />
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      <ProcessStockInDialog
        open={isProcessingDialogOpen}
        onOpenChange={setIsProcessingDialogOpen}
        selectedStockIn={selectedStockIn}
        userId={user?.id}
      />
    </div>
  );
};

export default StockInProcessing;
