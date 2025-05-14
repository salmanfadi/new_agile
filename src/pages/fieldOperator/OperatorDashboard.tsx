import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch user's stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['operator-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { stockInCount: 0, stockOutCount: 0 };
      
      const [stockInCount, stockOutCount, pendingStockIn, pendingStockOut] = await Promise.all([
        supabase.from('stock_in').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
        supabase.from('stock_out').select('*', { count: 'exact', head: true }).eq('requested_by', user.id),
        supabase.from('stock_in').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id).eq('status', 'pending'),
        supabase.from('stock_out').select('*', { count: 'exact', head: true }).eq('requested_by', user.id).eq('status', 'pending')
      ]);
      
      return {
        stockInCount: stockInCount.count || 0,
        stockOutCount: stockOutCount.count || 0,
        pendingStockIn: pendingStockIn.count || 0,
        pendingStockOut: pendingStockOut.count || 0
      };
    },
    enabled: !!user?.id,
    initialData: { stockInCount: 0, stockOutCount: 0, pendingStockIn: 0, pendingStockOut: 0 }
  });
  
  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['operator-recent-activities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch recent stock_in records
      const stockIns = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          status,
          created_at,
          boxes
        `)
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      // Fetch recent stock_out records
      const stockOuts = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          status,
          created_at,
          quantity,
          destination
        `)
        .eq('requested_by', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      const stockInActivity = (stockIns.data || []).map(item => ({
        type: 'stock_in',
        product: item.product?.name || 'Unknown',
        details: `${item.boxes} boxes`,
        timestamp: item.created_at,
        status: item.status
      }));
      
      const stockOutActivity = (stockOuts.data || []).map(item => ({
        type: 'stock_out',
        product: item.product?.name || 'Unknown',
        details: `${item.quantity} units to ${item.destination}`,
        timestamp: item.created_at,
        status: item.status
      }));
      
      return [...stockInActivity, ...stockOutActivity]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    enabled: !!user?.id,
    initialData: []
  });

  const statsCards = [
    { 
      title: 'Total Stock In', 
      value: statsLoading ? '...' : userStats.stockInCount, 
      icon: <LogIn className="h-5 w-5" /> 
    },
    { 
      title: 'Total Stock Out', 
      value: statsLoading ? '...' : userStats.stockOutCount, 
      icon: <LogOut className="h-5 w-5" /> 
    },
    { 
      title: 'Pending Requests', 
      value: statsLoading ? '...' : (userStats.pendingStockIn + userStats.pendingStockOut), 
      icon: <Clock className="h-5 w-5" /> 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Field Operator Dashboard" 
        description="Submit and track stock requests"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activities found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivities.map((activity, index) => (
                      <TableRow 
                        key={index} 
                        className={activity.type === 'stock_in' ? 'bg-green-50' : 'bg-blue-50'}
                      >
                        <TableCell className="font-medium">
                          {activity.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                        </TableCell>
                        <TableCell>{activity.product}</TableCell>
                        <TableCell>{activity.details}</TableCell>
                        <TableCell>
                          <StatusBadge status={activity.status as any} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/field/stock-in')}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                New Stock In
              </Button>
              <Button 
                onClick={() => navigate('/field/stock-out')}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                New Stock Out
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/field/submissions')}
                className="w-full"
              >
                View All Submissions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
