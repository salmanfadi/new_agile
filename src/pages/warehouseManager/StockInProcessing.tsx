
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
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { RejectStockInDialog } from '@/components/warehouse/RejectStockInDialog';
import { toast } from '@/hooks/use-toast';

interface StockInData {
  id: string;
  product: { name: string; id?: string | null };
  submitter: { name: string; username: string; id?: string | null } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  rejection_reason?: string;
}

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInData | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch stock in requests - improved query with proper error handling
  const { data: stockInRequests, isLoading, error } = useQuery({
    queryKey: ['stock-in-requests'],
    queryFn: async () => {
      console.log('Fetching stock in requests...');
      try {
        const { data, error } = await supabase
          .from('stock_in')
          .select(`
            id,
            product:product_id(id, name),
            submitter:submitted_by(id, name, username),
            boxes,
            status,
            created_at,
            source,
            notes,
            rejection_reason
          `)
          .in('status', ['pending', 'rejected'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching stock in requests:', error);
          toast({
            variant: 'destructive',
            title: 'Error loading data',
            description: error.message,
          });
          throw error;
        }
        
        console.log('Stock in data fetched:', data);
        
        // Transform the data to handle potential embedding errors
        return (data || []).map(item => ({
          id: item.id,
          product: item.product || { name: 'Unknown Product', id: null },
          submitter: item.submitter || { name: 'Unknown', username: 'unknown', id: null },
          boxes: item.boxes,
          status: item.status as StockInData['status'],
          created_at: item.created_at,
          source: item.source || 'Unknown Source',
          notes: item.notes,
          rejection_reason: item.rejection_reason
        })) as StockInData[];
      } catch (error) {
        console.error('Failed to fetch stock in requests:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Failed to load stock requests',
          description: errorMessage,
        });
        return [];
      }
    },
  });

  const handleProcess = (stockIn: StockInData) => {
    // Navigate to the dedicated process page with the stock in ID
    navigate(`/manager/process-stock-in/${stockIn.id}`);
  };

  const handleReject = (stockIn: StockInData) => {
    setSelectedStockIn(stockIn);
    setIsRejectDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading stock in requests. Please try again.
      </div>
    );
  }

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
          <CardTitle>Stock In Requests</CardTitle>
          <CardDescription>Review and process incoming stock requests</CardDescription>
        </CardHeader>
        <CardContent>
          <StockInRequestsTable 
            stockInRequests={stockInRequests || []}
            isLoading={isLoading}
            onProcess={handleProcess}
            onReject={handleReject}
            userId={user?.id}
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

export default StockInProcessing;
