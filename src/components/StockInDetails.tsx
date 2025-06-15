
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ProcessableStockIn {
  id: string;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
  };
  submitter: {
    id: string;
    name: string;
    username: string;
  };
  processed_by?: string;
  processor?: {
    id: string;
    name: string;
  };
  batch_id?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

interface StockInDetailsProps {
  stockInData: {
    stockIn?: ProcessableStockIn | null;
    loading: boolean;
    error: Error | null;
  };
  stockIn: ProcessableStockIn;
  details: any[];
}

export const StockInDetails: React.FC<StockInDetailsProps> = ({ 
  stockInData, 
  stockIn, 
  details 
}) => {
  if (stockInData.loading) {
    return <p>Loading stock in details...</p>;
  }

  if (stockInData.error) {
    return <p>Error: {stockInData.error.message}</p>;
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
            <span>{stockIn.product.name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Boxes:</span>
            <span>{stockIn.boxes}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Source:</span>
            <span>{stockIn.source}</span>
          </div>
          {stockIn.notes && (
            <div className="flex items-center space-x-4">
              <span>Notes:</span>
              <span>{stockIn.notes}</span>
            </div>
          )}
          <div className="flex items-center space-x-4">
            <span>Submitted By:</span>
            <span>{stockIn.submitter.name}</span>
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
        <Button variant="outline" asChild>
          <Link to="/manager/stock-in">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock In List
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
