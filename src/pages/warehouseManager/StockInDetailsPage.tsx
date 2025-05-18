import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StockInDetails } from '@/components/warehouse/StockInDetails';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft, Layers, List, ShieldAlert, ShieldCheck } from 'lucide-react';
import { StockInData } from '@/types/stockIn';

interface StockInRequestDetails {
  id: string;
  product_id: string;
  status: string;
  created_at: string;
  boxes: number;
  source: string;
  notes?: string;
  submitted_by: string;
  submitter?: {
    name: string; // Make this non-optional to match StockInData interface requirements
    username?: string;
  };
  product: {
    id: string;
    name: string; // Make this non-optional to match StockInData interface requirements
    sku?: string;
  };
  processed_by?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  rejection_reason?: string;
}

interface StockInDetailItem {
  id: string;
  stock_in_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  location_id: string;
  location_name?: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status?: string;
  product_id?: string;
  product?: {
    id: string;
    name: string;
  };
  created_at?: string;
  inventory_id?: string;
}

const StockInDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stockInData, setStockInData] = useState<StockInRequestDetails | null>(null);
  const [stockInDetails, setStockInDetails] = useState<StockInDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [continueProcessingUrl, setContinueProcessingUrl] = useState<string | null>(null);
  
  // Fetch stock-in data
  useEffect(() => {
    const fetchStockInData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fix: Use specific column names to avoid ambiguity with profiles table
        const { data, error } = await supabase
          .from('stock_in')
          .select(`
            *,
            products (
              id,
              name,
              sku
            ),
            submitter:profiles!stock_in_submitted_by_fkey (
              id,
              name,
              username
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (!data) {
          throw new Error('Stock in request not found');
        }
        
        // Format the data with proper null checks
        const submitterData = data.submitter && typeof data.submitter === 'object' ? data.submitter : null;
        const productsData = data.products && typeof data.products === 'object' ? data.products : null;
        
        // Format the data
        const formattedData: StockInRequestDetails = {
          id: data.id,
          product_id: data.product_id,
          status: data.status,
          created_at: data.created_at,
          boxes: data.boxes || 0,
          source: data.source || '',
          notes: data.notes,
          submitted_by: data.submitted_by,
          submitter: {
            name: submitterData && 'name' in submitterData ? String(submitterData.name) : 'Unknown',
            username: submitterData && 'username' in submitterData ? String(submitterData.username) : undefined
          },
          product: {
            id: productsData && 'id' in productsData ? String(productsData.id) : '',
            name: productsData && 'name' in productsData ? String(productsData.name) : 'Unknown Product',
            sku: productsData && 'sku' in productsData ? String(productsData.sku) : undefined
          },
          processed_by: data.processed_by,
          processing_started_at: data.processing_started_at,
          processing_completed_at: data.processing_completed_at,
          rejection_reason: data.rejection_reason
        };
        
        setStockInData(formattedData);
        
        // Check if this is a processing request and set the continue URL
        if (data.status === 'processing') {
          const baseUrl = window.location.pathname.includes('/admin') ? 
            '/admin/stock-in/unified/' : 
            '/manager/stock-in/unified/';
          
          setContinueProcessingUrl(`${baseUrl}${data.id}`);
        }
        
        // Now fetch the details
        fetchStockInDetails(data.id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setIsLoading(false);
      }
    };
    
    fetchStockInData();
  }, [id]);
  
  // Fetch stock-in details
  const fetchStockInDetails = async (stockInId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_in_details')
        .select(`
          *,
          products (
            id,
            name
          ),
          warehouses (
            id,
            name
          ),
          warehouse_locations (
            id,
            floor,
            zone
          )
        `)
        .eq('stock_in_id', stockInId);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Format the detail items
        const formattedDetails: StockInDetailItem[] = data.map(item => {
          // Create location name from floor and zone if available
          let locationName;
          if (item.warehouse_locations && 
              typeof item.warehouse_locations === 'object' &&
              'floor' in item.warehouse_locations &&
              'zone' in item.warehouse_locations) {
            locationName = `Floor ${item.warehouse_locations.floor}, Zone ${item.warehouse_locations.zone}`;
          }
          
          const warehouseObject = item.warehouses && typeof item.warehouses === 'object' ? item.warehouses : null;
          const warehouseName = warehouseObject && 'name' in warehouseObject ? String(warehouseObject.name) : undefined;
          
          const detailObj: StockInDetailItem = {
            id: item.id,
            stock_in_id: item.stock_in_id,
            warehouse_id: item.warehouse_id,
            warehouse_name: warehouseName,
            location_id: item.location_id,
            location_name: locationName,
            barcode: item.barcode,
            quantity: item.quantity || 0,
            color: item.color,
            size: item.size,
            status: item.status,
            created_at: item.created_at,
            inventory_id: item.inventory_id,
            product_id: item.product_id
          };
          
          // Safely extract product information
          const productObject = item.products && typeof item.products === 'object' ? item.products : null;
              
          if (productObject) {
            detailObj.product = {
              id: productObject.id ? String(productObject.id) : '',
              name: productObject.name ? String(productObject.name) : 'Unknown Product'
            };
          } else {
            detailObj.product = {
              id: '',
              name: 'Unknown Product'
            };
          }
          
          return detailObj;
        });
        
        setStockInDetails(formattedDetails);
      }
    } catch (err) {
      console.error('Error fetching stock in details:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load stock in details.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approval/rejection
  const handleApproval = async (isApproved: boolean) => {
    if (!id || !user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the stock-in status
      const newStatus = isApproved ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('stock_in')
        .update({
          status: newStatus,
          processed_by: user.id,
          rejection_reason: isApproved ? null : approvalNotes
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: `Stock-in request ${isApproved ? 'approved' : 'rejected'}`,
        description: isApproved ? 'The stock-in request has been approved' : 'The stock-in request has been rejected',
      });
      
      // Refresh the data
      if (stockInData) {
        setStockInData({
          ...stockInData,
          status: newStatus
        });
      }
      
      // Navigate back to the stock-in list
      setTimeout(() => {
        const path = window.location.pathname.includes('/admin') ? 
          '/admin/stock-in' : 
          '/manager/stock-in';
        navigate(path);
      }, 1500);
    } catch (error) {
      console.error('Error updating stock-in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${isApproved ? 'approve' : 'reject'} the stock-in request.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle continue processing
  const handleContinueProcessing = () => {
    if (continueProcessingUrl) {
      navigate(continueProcessingUrl);
    }
  };
  
  const getStatusIndicator = () => {
    if (!stockInData) return null;
    
    const statusProps: { color: string; icon: React.ReactNode } = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <ShieldAlert className="h-4 w-4" /> },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: <ShieldCheck className="h-4 w-4" /> },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: <ShieldAlert className="h-4 w-4" /> },
      processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Layers className="h-4 w-4" /> },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: <ShieldCheck className="h-4 w-4" /> }
    }[stockInData.status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <List className="h-4 w-4" /> };
    
    return (
      <div className={`px-2 py-1 rounded-md inline-flex items-center space-x-1 ${statusProps.color}`}>
        {statusProps.icon}
        <span className="capitalize">{stockInData.status}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-blue-700 border-gray-200 animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading stock-in details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 text-xl mb-2">Error</div>
        <p className="text-gray-600">{error.message}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (!stockInData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-xl mb-2">Not Found</div>
        <p className="text-gray-600">Stock-in request not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          size="sm" 
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      <PageHeader 
        title={`Stock In Request: ${id?.slice(0, 8)}`}
        description={`View details and status for this stock in request`}
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Stock In Request
                {getStatusIndicator()}
              </CardTitle>
              <CardDescription>
                Submitted on {stockInData.created_at ? format(new Date(stockInData.created_at), 'MMMM d, yyyy') : 'Unknown date'}
              </CardDescription>
            </div>
            
            {/* Conditionally render continue button for processing requests */}
            {stockInData.status === 'processing' && continueProcessingUrl && (
              <Button 
                onClick={handleContinueProcessing}
                className="w-full md:w-auto"
              >
                Continue Processing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="details" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Request Details</TabsTrigger>
              <TabsTrigger value="items">Detail Items ({stockInDetails.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
              {stockInData && (
                <StockInDetails
                  stockInData={stockInData as StockInData}
                  approvalNotes={approvalNotes}
                  setApprovalNotes={setApprovalNotes}
                  handleApproval={handleApproval}
                  isSubmitting={isSubmitting}
                />
              )}
            </TabsContent>
            
            <TabsContent value="items">
              {stockInDetails.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No detail items found for this stock-in request.</p>
                  {stockInData.status === 'pending' && (
                    <p className="mt-2">Items will be created during processing.</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Barcode</th>
                        <th className="px-4 py-2 text-left">Location</th>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockInDetails.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-2">{item.product?.name || 'Unknown Product'}</td>
                          <td className="px-4 py-2">
                            <code className="bg-muted/70 px-1 py-0.5 rounded">{item.barcode}</code>
                          </td>
                          <td className="px-4 py-2">{item.location_name || 'Unknown'}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className="capitalize">
                              {item.status || 'pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockInDetailsPage;
