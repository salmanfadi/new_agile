
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserStockActivity } from '@/hooks/useUserStockActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockMovementAudit } from '@/types/database';

const FieldOperatorSubmissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stockActivities, isLoading } = useUserStockActivity(user?.id);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Submissions" 
        description="View and track your submitted requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/field')}
        className="flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Tabs defaultValue="stock-in" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="stock-in">Stock In Submissions</TabsTrigger>
          <TabsTrigger value="stock-out">Stock Out Requests</TabsTrigger>
          <TabsTrigger value="transfers">Transfer Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock-in">
          <Card>
            <CardHeader>
              <CardTitle>Stock In Submissions</CardTitle>
              <CardDescription>Your recent stock in submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading stock in submissions...</p>
              ) : stockActivities?.stockIn && stockActivities.stockIn.length > 0 ? (
                <div className="space-y-4">
                  {stockActivities.stockIn.map(item => (
                    <div key={item.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.product?.name || 'Unknown Product'}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Source: {item.source}</p>
                        <p>Boxes: {item.boxes}</p>
                        <p>Submitted: {new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No stock in submissions found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock-out">
          <Card>
            <CardHeader>
              <CardTitle>Stock Out Requests</CardTitle>
              <CardDescription>Your recent stock out requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading stock out requests...</p>
              ) : stockActivities?.stockOut && stockActivities.stockOut.length > 0 ? (
                <div className="space-y-4">
                  {stockActivities.stockOut.map(item => (
                    <div key={item.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.product?.name || 'Unknown Product'}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Quantity: {item.quantity}</p>
                        <p>Destination: {item.destination}</p>
                        <p>Submitted: {new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No stock out requests found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Requests</CardTitle>
              <CardDescription>Your recent inventory transfer requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading transfer requests...</p>
              ) : stockActivities?.transfers && stockActivities.transfers.length > 0 ? (
                <div className="space-y-4">
                  {stockActivities.transfers.map((item: StockMovementAudit) => (
                    <div key={item.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">Transfer #{item.id.substring(0, 8)}</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Quantity: {item.quantity}</p>
                        <p>Type: {item.movement_type}</p>
                        <p>Performed at: {new Date(item.performed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No transfer requests found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldOperatorSubmissions;
