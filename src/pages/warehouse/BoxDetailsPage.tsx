
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useBoxDetails } from '@/hooks/useBoxDetails';
import { BoxDetailsView } from '@/components/warehouse/BoxDetailsView';
import { Skeleton } from '@/components/ui/skeleton';

const BoxDetailsPage = () => {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const { data: boxDetails, isLoading, error, refetch } = useBoxDetails(barcode || null);
  
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading box details',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [error]);
  
  const handleRefresh = () => {
    toast({
      title: 'Refreshing data',
      description: 'Getting the latest box details'
    });
    refetch();
  };
  
  const handlePrint = () => {
    if (!boxDetails) return;
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Print failed',
        description: 'Could not open print window. Please check your popup settings.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create the print content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Box Barcode - ${boxDetails.barcode}</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 20px;
          }
          .barcode-container {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #ccc;
          }
          .details {
            margin-top: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          @media print {
            .no-print {
              display: none;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()">Print</button>
          <hr>
        </div>
        
        <h1>Box Barcode - ${boxDetails.barcode}</h1>
        
        <div class="barcode-container">
          <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(boxDetails.barcode)}&scale=3&includetext&textsize=13" />
          <p style="font-family: monospace; margin-top: 10px;">${boxDetails.barcode}</p>
        </div>
        
        <div class="details">
          <table>
            <tr>
              <th>Product:</th>
              <td>${boxDetails.productName} ${boxDetails.productSku ? `(${boxDetails.productSku})` : ''}</td>
            </tr>
            <tr>
              <th>Quantity:</th>
              <td>${boxDetails.quantity}</td>
            </tr>
            <tr>
              <th>Batch ID:</th>
              <td>${boxDetails.batchId.substring(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <th>Status:</th>
              <td>${boxDetails.status}</td>
            </tr>
            <tr>
              <th>Location:</th>
              <td>${boxDetails.warehouseName} - ${boxDetails.locationDetails}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for resources to load then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
    };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <PageHeader 
        title={isLoading ? "Loading Box Details..." : `Box ${barcode}`}
        description={isLoading ? "Please wait" : boxDetails?.productName}
      />
      
      <div>
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        ) : !boxDetails ? (
          <div className="text-center py-10 border rounded-md bg-background">
            <h3 className="text-xl font-semibold mb-2">Box Not Found</h3>
            <p className="text-muted-foreground">
              The box with barcode <code>{barcode}</code> could not be found.
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        ) : (
          <BoxDetailsView 
            box={boxDetails} 
            onRefresh={handleRefresh}
            onPrint={handlePrint}
          />
        )}
      </div>
    </div>
  );
};

export default BoxDetailsPage;
