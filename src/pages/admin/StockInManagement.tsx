
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { RejectStockInDialog } from '@/components/warehouse/RejectStockInDialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const AdminStockInManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInData | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch stock in requests with filter
  const { data: stockInRequests, isLoading, error } = useQuery({
    queryKey: ['admin-stock-in-requests', statusFilter],
    queryFn: async () => {
      console.log('Fetching stock in requests with filter:', statusFilter);
      try {
        // Build query based on filter
        let query = supabase
          .from('stock_in')
          .select(`
            id,
            product_id,
            submitted_by,
            boxes,
            status,
            created_at,
            source,
            notes,
            rejection_reason
          `);
          
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter as "pending" | "approved" | "rejected" | "completed" | "processing");
        }
        
        const { data: stockData, error: stockError } = await query
          .order('created_at', { ascending: false });

        if (stockError) {
          console.error('Error fetching stock in requests:', stockError);
          throw stockError;
        }

        if (!stockData || stockData.length === 0) {
          return [];
        }
        
        // Process each stock in record to fetch related data
        const processedData = await Promise.all(stockData.map(async (item) => {
          // Get product details
          let product = { name: 'Unknown Product', id: null };
          if (item.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('id, name')
              .eq('id', item.product_id)
              .single();
            
            if (productData) {
              product = productData;
            }
          }
          
          // Get submitter details
          let submitter = null;
          if (item.submitted_by) {
            try {
              // Get submitter details from profiles table
              const { data: submitterData, error: submitterError } = await supabase
                .from('profiles')
                .select('id, name, username')
                .eq('id', item.submitted_by)
                .maybeSingle();
              
              if (!submitterError && submitterData) {
                submitter = {
                  id: submitterData.id,
                  name: submitterData.name || 'Unknown User',
                  username: submitterData.username
                };
              } else {
                // Fallback if profile not found
                submitter = { 
                  id: item.submitted_by,
                  name: 'Unknown User',
                  username: item.submitted_by.substring(0, 8) + '...'
                };
              }
            } catch (err) {
              console.error(`Error fetching submitter for ID: ${item.submitted_by}`, err);
              submitter = { 
                id: item.submitted_by,
                name: 'Unknown User',
                username: 'unknown'
              };
            }
          }
          
          return {
            id: item.id,
            product,
            submitter,
            boxes: item.boxes,
            status: item.status,
            created_at: item.created_at,
            source: item.source || 'Unknown Source',
            notes: item.notes,
            rejection_reason: item.rejection_reason
          };
        }));
        
        return processedData;
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

  // Navigate to batch processing page with the stock in ID
  const handleProcess = (stockIn: StockInData) => {
    navigate(`/admin/stock-in/batch/${stockIn.id}`);
  };

  const handleReject = (stockIn: StockInData) => {
    setSelectedStockIn(stockIn);
    setIsRejectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock In Management" 
        description="Monitor and manage all stock in requests across warehouses"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
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
      
      <Card>
        <CardHeader>
          <CardTitle>Stock In Requests</CardTitle>
          <CardDescription>Monitor and process incoming stock requests from all warehouses</CardDescription>
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

export default AdminStockInManagement;
