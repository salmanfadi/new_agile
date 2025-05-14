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

interface StockInSubmission {
  id: string;
  product: string;
  boxes: number;
  timestamp: string;
  status: string;
  source: string;
  notes?: string;
}

interface StockOutSubmission {
  id: string;
  product: string;
  quantity: number;
  approved_quantity?: number;
  destination: string;
  status: string;
  timestamp: string;
  reason?: string;
}

const MySubmissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stock-in');

  // Use the shared hook for both stock-in and stock-out
  const { data, isLoading } = useUserStockActivity(user?.id);
  const stockInSubmissions = data?.stockIn || [];
  const stockOutSubmissions = data?.stockOut || [];

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
        description="View history of Stock In and Stock Out requests"
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock-in">Stock In</TabsTrigger>
          <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default MySubmissions;
