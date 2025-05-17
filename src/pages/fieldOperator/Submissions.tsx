import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStockActivity } from '@/hooks/useUserStockActivity';

const Submissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stock-in');

  // Use the updated hook for stock-in, stock-out, and transfers
  const { data, isLoading } = useUserStockActivity(user?.id);
  const stockInSubmissions = data?.stockIn || [];
  const stockOutSubmissions = data?.stockOut || [];
  const transferSubmissions = data?.transfers || [];

  useEffect(() => {
    if (user?.id) {
      console.log("User is authenticated, user ID:", user.id);
    } else {
      console.log("User is not authenticated");
    }
  }, [user]);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Submissions" 
        description="View history of Stock In, Stock Out, and Transfer requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/field')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <Tabs defaultValue="stock-in" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock-in">Stock In</TabsTrigger>
          <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock-in">
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Boxes</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                          <div className="mt-2">Loading submissions...</div>
                        </TableCell>
                      </TableRow>
                    ) : stockInSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No stock in submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockInSubmissions.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product?.name || item.product || 'Unknown Product'}</TableCell>
                          <TableCell>{item.boxes}</TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>
                            {new Date(item.created_at || item.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock-out">
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                          <div className="mt-2">Loading submissions...</div>
                        </TableCell>
                      </TableRow>
                    ) : stockOutSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No stock out submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockOutSubmissions.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product?.name || item.product || 'Unknown Product'}</TableCell>
                          <TableCell>
                            {item.quantity}
                            {item.approved_quantity !== null && item.approved_quantity !== undefined && (
                              <span className="text-sm text-gray-500 ml-1">
                                (Approved: {item.approved_quantity})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{item.destination}</TableCell>
                          <TableCell>
                            {new Date(item.created_at || item.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfers">
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                          <div className="mt-2">Loading transfers...</div>
                        </TableCell>
                      </TableRow>
                    ) : transferSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No transfer submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transferSubmissions.map((item: any) => {
                        // Parse details to get direction information safely
                        let direction = 'In';
                        
                        if (item.details) {
                          // Handle string or object format of details
                          const detailsObj = typeof item.details === 'string' 
                            ? JSON.parse(item.details) 
                            : item.details;
                          
                          // Get direction from details if available, otherwise infer from quantity
                          direction = detailsObj && typeof detailsObj === 'object' && detailsObj.direction 
                            ? detailsObj.direction 
                            : (item.quantity > 0 ? 'In' : 'Out');
                        }
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product?.name || item.product || 'Unknown Product'}</TableCell>
                            <TableCell>{Math.abs(item.quantity || 0)}</TableCell>
                            <TableCell>{item.warehouse?.name || 'Unknown Warehouse'}</TableCell>
                            <TableCell>
                              <span className={`font-medium ${direction.toLowerCase() === 'in' ? 'text-green-600' : 'text-amber-600'}`}>
                                {direction.toLowerCase() === 'in' ? 'Receiving' : 'Sending'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(item.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={item.status} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Submissions;
