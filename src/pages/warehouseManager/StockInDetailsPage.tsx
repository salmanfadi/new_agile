
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Updated interface to better match what Supabase returns
interface StockInDetail {
  id: string;
  stock_in_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
  } | null;
  barcode: string;
  color?: string;
  size?: string;
  batch_number?: string;
  processing_order?: number;
  processed_at?: string;
  error_message?: string;
  status?: string;
  inventory_id?: string;
  warehouse_id: string;
  location_id: string;
}

interface StockInData {
  loading: boolean;
  error: string | null;
}

// Updated interface to better match what Supabase returns and handle null/undefined better
interface StockInWithExtras {
  boxes: number;
  created_at: string;
  id: string;
  notes: string;
  processed_by: string | null;
  product_id: string;
  rejection_reason: string | null;
  source: string;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  submitted_by: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
  } | null;
  submitter?: {
    id: string;
    name: string | null;
  } | null;
  processor?: {
    id: string;
    name: string | null;
  } | null;
  batch_id?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

interface StockInDetailsProps {
  stockInData: StockInData;
  stockIn: StockInWithExtras;
  details: StockInDetail[];
}

const StockInDetails: React.FC<StockInDetailsProps> = ({ stockInData, stockIn, details }) => {
  if (stockInData.loading) {
    return <p>Loading stock in details...</p>;
  }

  if (stockInData.error) {
    return <p>Error: {stockInData.error}</p>;
  }

  if (!stockIn) {
    return <p>Stock In details not found.</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stock In Details</CardTitle>
        <CardDescription>Details of stock in {stockIn.id}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center space-x-4">
            <span>Status:</span>
            <Badge variant="secondary">{stockIn.status}</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span>Product:</span>
            <span>{stockIn.product?.name || 'Unknown Product'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Boxes:</span>
            <span>{stockIn.boxes}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Source:</span>
            <span>{stockIn.source}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Notes:</span>
            <span>{stockIn.notes}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Submitted By:</span>
            <span>{stockIn.submitter?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Created At:</span>
            <span>{new Date(stockIn.created_at).toLocaleDateString()}</span>
          </div>
          {stockIn.batch_id && (
            <div className="flex items-center space-x-4">
              <span>Batch ID:</span>
              <span>{stockIn.batch_id}</span>
            </div>
          )}
          {stockIn.processing_started_at && (
            <div className="flex items-center space-x-4">
              <span>Processing Started At:</span>
              <span>{new Date(stockIn.processing_started_at).toLocaleDateString()}</span>
            </div>
          )}
          {stockIn.processing_completed_at && (
            <div className="flex items-center space-x-4">
              <span>Processing Completed At:</span>
              <span>{new Date(stockIn.processing_completed_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link to="/manager/stock-in">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock In List
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const StockInDetailsPage: React.FC = () => {
  const { stockInId } = useParams<{ stockInId: string }>();
  const navigate = useNavigate();
  const [stockInData, setStockInData] = useState<StockInData>({ loading: true, error: null });
  const [stockIn, setStockIn] = useState<StockInWithExtras | null>(null);
  const [details, setDetails] = useState<StockInDetail[]>([]);

  // Add effect to check for valid stockInId early
  useEffect(() => {
    if (!stockInId) {
      console.error("StockIn ID is missing in URL parameters");
      toast({
        variant: "destructive",
        title: "Error",
        description: "StockIn ID is missing. Redirecting to stock in list."
      });
      
      // Redirect back to the stock in list after a short delay
      const timer = setTimeout(() => {
        navigate("/manager/stock-in");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [stockInId, navigate]);

  useEffect(() => {
    const fetchStockInDetails = async () => {
      if (!stockInId) {
        setStockInData({ loading: false, error: 'StockIn ID is missing' });
        return;
      }

      try {
        // Update the query to use explicit column hints for joins to avoid ambiguity
        const { data, error } = await supabase
          .from('stock_in')
          .select(`
            *,
            product:product_id (id, name),
            submitter:submitted_by (id, name),
            processor:processed_by (id, name)
          `)
          .eq('id', stockInId)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          setStockInData({ loading: false, error: error.message });
          toast({
            variant: "destructive",
            title: "Failed to fetch stock in details",
            description: error.message
          });
          return;
        }

        if (data) {
          // Parse the data and handle potential missing properties or type issues
          const safeStockIn: StockInWithExtras = {
            id: data.id,
            boxes: data.boxes || 0,
            created_at: data.created_at,
            updated_at: data.updated_at,
            product_id: data.product_id,
            source: data.source,
            notes: data.notes || '',
            submitted_by: data.submitted_by,
            processed_by: data.processed_by,
            rejection_reason: data.rejection_reason,
            status: data.status,
            batch_id: data.batch_id,
            processing_started_at: data.processing_started_at,
            processing_completed_at: data.processing_completed_at,
            // Handle the nested objects with safe defaults
            product: data.product || null,
            submitter: data.submitter || null,
            processor: data.processed_by ? (data.processor || null) : null
          };
          
          setStockIn(safeStockIn);
          setStockInData({ loading: false, error: null });
          toast({
            title: "Success",
            description: "Stock in details fetched successfully"
          });
        } else {
          setStockInData({ loading: false, error: 'Stock In details not found' });
          toast({
            variant: "destructive",
            title: "Error",
            description: "Stock In details not found"
          });
        }
      } catch (error: any) {
        console.error('Unexpected error:', error);
        setStockInData({ loading: false, error: error.message });
        toast({
          variant: "destructive",
          title: "Unexpected error",
          description: error.message
        });
      }
    };

    fetchStockInDetails();
  }, [stockInId]);

  useEffect(() => {
    const fetchStockInDetailsData = async () => {
      if (!stockInId) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stock_in_details')
          .select(`
            *,
            product:product_id (id, name)
          `)
          .eq('stock_in_id', stockInId);

        if (error) {
          console.error('Supabase error:', error);
          toast({
            variant: "destructive",
            title: "Failed to fetch stock in details data",
            description: error.message
          });
          return;
        }

        if (data) {
          // Process the data to ensure it matches our StockInDetail interface
          const safeDetails: StockInDetail[] = data.map(item => {
            // First create a base object with required properties
            const detailObj: StockInDetail = {
              id: item.id,
              stock_in_id: item.stock_in_id,
              product_id: item.product_id,
              quantity: item.quantity,
              created_at: item.created_at,
              barcode: item.barcode,
              color: item.color,
              size: item.size,
              batch_number: item.batch_number,
              processing_order: item.processing_order,
              processed_at: item.processed_at,
              error_message: item.error_message,
              status: item.status,
              inventory_id: item.inventory_id,
              warehouse_id: item.warehouse_id,
              location_id: item.location_id
            };
            
            // Then conditionally add the product if it exists and is valid
            if (item.product && typeof item.product === 'object' && 'id' in item.product && 'name' in item.product) {
              detailObj.product = {
                id: item.product.id,
                name: item.product.name
              };
            } else {
              detailObj.product = null;
            }
            
            return detailObj;
          });
          
          setDetails(safeDetails);
          toast({
            title: "Success",
            description: "Stock in details data fetched successfully"
          });
        }
      } catch (error: any) {
        console.error('Unexpected error:', error);
        toast({
          variant: "destructive",
          title: "Unexpected error",
          description: error.message
        });
      }
    };

    fetchStockInDetailsData();
  }, [stockInId]);
  
  // If stockInId is missing, show a better error message and navigation option
  if (!stockInId) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>StockIn ID is missing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Unable to display details because the StockIn ID is missing from the URL.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/manager/stock-in")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stock In List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="outline"
        onClick={() => navigate("/manager/stock-in")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Stock In List
      </Button>
      
      {stockIn ? (
        <StockInDetails
          stockInData={stockInData}
          stockIn={stockIn}
          details={details}
        />
      ) : stockInData.loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-center mt-4">Loading stock in details...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{stockInData.error || "Failed to load stock in details"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockInDetailsPage;
