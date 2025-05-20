
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoxDetails } from '@/hooks/useBoxDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, Clock, Truck } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BoxDetailsView } from '@/components/warehouse/BoxDetailsView';

const BoxDetailsPage = () => {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  
  const { data: boxDetails, isLoading, error } = useBoxDetails(barcode);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <PageHeader 
          title="Box Details" 
          description="Loading box information..." 
        />
        
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error.message}</span>
        </div>
      </div>
    );
  }

  if (!boxDetails) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Box Not Found</h2>
          <p className="text-gray-500">The box with barcode {barcode} could not be found.</p>
        </div>
      </div>
    );
  }

  const handleViewBatch = () => {
    if (boxDetails.batch_id) {
      navigate(`/admin/inventory/batch/${boxDetails.batch_id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <PageHeader 
        title="Box Details" 
        description={boxDetails.productName || 'Unknown Product'} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Box Information</div>
              <Badge variant={boxDetails.status === 'available' ? 'success' : 'secondary'}>
                {boxDetails.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
                <p className="text-base">{boxDetails.productName}</p>
                {boxDetails.productSku && (
                  <p className="text-xs text-muted-foreground">SKU: {boxDetails.productSku}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Barcode</h3>
                <p className="text-base font-mono">{boxDetails.barcode}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Batch</h3>
                <div className="flex items-center">
                  <p className="text-base mr-2">{boxDetails.batch_id ? `#${boxDetails.batch_id.substring(0, 8)}` : 'N/A'}</p>
                  {boxDetails.batch_id && (
                    <Button variant="ghost" size="sm" onClick={handleViewBatch} className="h-6 px-2">
                      View
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                <p className="text-base">{boxDetails.quantity} units</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p className="text-base">{boxDetails.warehouseName || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{boxDetails.locationDetails || 'Unknown location'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="text-base">{new Date(boxDetails.updated_at).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(boxDetails.updated_at).toLocaleTimeString()}
                </p>
              </div>
              
              {(boxDetails.color || boxDetails.size) && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Attributes</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {boxDetails.color && (
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1 text-blue-500" />
                        <span>Color: {boxDetails.color}</span>
                      </div>
                    )}
                    {boxDetails.size && (
                      <div className="flex items-center ml-4">
                        <Tag className="h-4 w-4 mr-1 text-green-500" />
                        <span>Size: {boxDetails.size}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {boxDetails.history && boxDetails.history.length > 0 ? (
              <div className="space-y-4">
                {boxDetails.history.map((event) => (
                  <div key={event.id} className="border-l-2 border-gray-200 pl-4 py-1">
                    <div className="flex items-start">
                      {event.event_type === 'created' ? (
                        <Tag className="h-4 w-4 mr-2 mt-1 text-green-500" />
                      ) : event.event_type === 'moved' ? (
                        <Truck className="h-4 w-4 mr-2 mt-1 text-blue-500" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2 mt-1 text-orange-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                        </p>
                        {event.details && (
                          <p className="text-xs text-muted-foreground">{event.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.created_at).toLocaleString()} 
                          {event.user?.name && ` by ${event.user.name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No history records available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <BoxDetailsView boxDetails={boxDetails} />
    </div>
  );
};

export default BoxDetailsPage;
