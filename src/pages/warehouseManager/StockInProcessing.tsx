
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

  // Fetch stock in requests with improved query
  const { data: stockInRequests, isLoading, error } = useQuery({
    queryKey: ['stock-in-requests'],
    queryFn: async () => {
      console.log('Fetching stock in requests...');
      try {
        // Get stock in records first
        const { data: stockData, error: stockError } = await supabase
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
          `)
          .in('status', ['pending', 'rejected'])
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
          
          // Get submitter details with better error handling
          let submitter = null;
          if (item.submitted_by) {
            try {
              // Try to get submitter from profiles table first
              const { data: submitterData, error: submitterError } = await supabase
                .from('profiles')
                .select('id, name, username')
                .eq('id', item.submitted_by)
                .maybeSingle();
              
              if (!submitterError && submitterData) {
                submitter = submitterData;
                console.log(`Found submitter in profiles: ${submitterData.name} (${submitterData.username})`);
              } else {
                // If not found in profiles, try to get email from auth
                console.warn(`No profile found for user ID: ${item.submitted_by}`, submitterError);
                try {
                  // Note: In production, this would require appropriate permissions
                  const { data: userData } = await supabase.auth.admin.getUserById(item.submitted_by);
                  
                  if (userData && userData.user && userData.user.email) {
                    submitter = { 
                      id: item.submitted_by,
                      name: userData.user.email.split('@')[0] || 'Unknown User',
                      username: userData.user.email
                    };
                    console.log(`Created submitter from auth: ${submitter.name} (${submitter.username})`);
                  } else {
                    // Fallback option if all else fails
                    submitter = { 
                      id: item.submitted_by,
                      name: 'Unknown User',
                      username: item.submitted_by.substring(0, 8) + '...'
                    };
                  }
                } catch (authError) {
                  console.error('Error accessing user auth data:', authError);
                  submitter = { 
                    id: item.submitted_by,
                    name: 'Unknown User',
                    username: item.submitted_by.substring(0, 8) + '...'
                  };
                }
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
        
        console.log('Processed stock in data:', processedData);
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
