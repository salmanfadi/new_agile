
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface StockInDetail {
  id: string;
  stock_in_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product: {
    id: string;
    name: string;
  };
}

interface StockInData {
  loading: boolean;
  error: string | null;
}

// Add batch_id, processing_started_at, and processing_completed_at to the StockIn type used in this component
interface StockInWithExtras {
  boxes: number;
  created_at: string;
  id: string;
  notes: string;
  processed_by: string;
  product_id: string;
  rejection_reason: string;
  source: string;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  submitted_by: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
  };
  submitter: {
    id: string;
    name: string;
  };
  processor: {
    id: string;
    name: string;
  };
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

// Update the component to use StockInWithExtras and properly handle missing stockInId
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
          setStockIn(data as StockInWithExtras);
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
          setDetails(data);
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
  
  // Update the StockInDetails component props to match requirements
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
