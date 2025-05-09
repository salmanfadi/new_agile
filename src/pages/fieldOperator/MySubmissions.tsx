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

const MySubmissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stock-in');

  // Fetch user's stock in submissions
  const { data: stockInSubmissions, isLoading: stockInLoading } = useQuery({
    queryKey: ['user-stock-in', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log("Fetching submissions for user ID:", user.id);
      
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          boxes,
          status,
          created_at,
          source
        `)
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching stock in submissions:", error);
        toast({
          variant: 'destructive',
          title: 'Failed to load submissions',
          description: error.message
        });
        throw error;
      }
      
      console.log("Stock in submissions:", data);
      
      return data.map(item => ({
        id: item.id,
        product: item.product?.name || 'Unknown Product',
        boxes: item.boxes,
        timestamp: item.created_at,
        status: item.status,
        source: item.source,
      }));
    },
    enabled: !!user?.id,
    initialData: [],
  });

  // Fetch user's stock out submissions
  const { data: stockOutSubmissions, isLoading: stockOutLoading } = useQuery({
    queryKey: ['user-stock-out', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          quantity,
          approved_quantity,
          destination,
          status,
          created_at
        `)
        .eq('requested_by', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data.map(item => ({
        id: item.id,
        product: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        approved_quantity: item.approved_quantity,
        destination: item.destination,
        status: item.status,
      }));
    },
    enabled: !!user?.id,
    initialData: [],
  });
  
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
        onClick={() => navigate('/operator')}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockInLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                          <div className="mt-2">Loading submissions...</div>
                        </TableCell>
                      </TableRow>
                    ) : stockInSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No stock in submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockInSubmissions.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product}</TableCell>
                          <TableCell>{item.boxes}</TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>{typeof item.timestamp === 'string' 
                            ? new Date(item.timestamp).toLocaleString() 
                            : item.timestamp}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status as any} />
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockOutLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                          <div className="mt-2">Loading submissions...</div>
                        </TableCell>
                      </TableRow>
                    ) : stockOutSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No stock out submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockOutSubmissions.map((item) => (
                        <TableRow key={item.id} className="bg-blue-50">
                          <TableCell className="font-medium">{item.product}</TableCell>
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
                            <StatusBadge status={item.status as any} />
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
