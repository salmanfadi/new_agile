import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, LogIn, LogOut, Warehouse, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Subscribe to real-time updates for stock_in and stock_out tables
  useEffect(() => {
    const channel = supabase
      .channel('realtime-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stock_in'
      }, () => {
        // Invalidate queries when changes occur
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stock_out'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [pendingStockIn, pendingStockOut, warehouses] = await Promise.all([
        supabase.from('stock_in').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('stock_out').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('warehouses').select('*', { count: 'exact', head: true })
      ]);
      
      return {
        pendingStockIn: pendingStockIn.count || 0,
        pendingStockOut: pendingStockOut.count || 0,
        warehouses: warehouses.count || 0
      };
    },
    initialData: {
      pendingStockIn: 0,
      pendingStockOut: 0,
      warehouses: 0
    }
  });
  
  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
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
          quantity
        `)
        .order('created_at', { ascending: false })
        .limit(2);
        
      const stockInActivity = (stockIns.data || []).map(item => ({
        action: 'Stock In',
        product: item.product?.name || 'Unknown',
        details: `${item.boxes} boxes`,
        timestamp: item.created_at,
        status: item.status,
        type: 'stock_in'
      }));
      
      const stockOutActivity = (stockOuts.data || []).map(item => ({
        action: 'Stock Out',
        product: item.product?.name || 'Unknown',
        details: `${item.quantity} units`,
        timestamp: item.created_at,
        status: item.status,
        type: 'stock_out'
      }));
      
      return [...stockInActivity, ...stockOutActivity]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    initialData: []
  });

  const statsCards = [
    { 
      title: 'Pending Stock In', 
      value: isLoading ? '...' : stats.pendingStockIn, 
      icon: <LogIn className="h-5 w-5" /> 
    },
    { 
      title: 'Pending Stock Out', 
      value: isLoading ? '...' : stats.pendingStockOut, 
      icon: <LogOut className="h-5 w-5" /> 
    },
    { 
      title: 'Assigned Warehouses', 
      value: isLoading ? '...' : stats.warehouses, 
      icon: <Warehouse className="h-5 w-5" /> 
    },
  ];
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warehouse Manager Dashboard" 
        description="Overview of tasks and inventory"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity, index) => (
                      <TableRow 
                        key={index} 
                        className={activity.type === 'stock_in' ? 'bg-green-50' : activity.type === 'stock_out' ? 'bg-blue-50' : ''}
                      >
                        <TableCell className="font-medium">{activity.action}</TableCell>
                        <TableCell>{activity.product}</TableCell>
                        <TableCell>{activity.details}</TableCell>
                        <TableCell>{typeof activity.timestamp === 'string' 
                          ? new Date(activity.timestamp).toLocaleString() 
                          : activity.timestamp}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={activity.status as any} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentActivity.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No recent activity found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate('/manager/inventory')}
              >
                <BarChart className="h-4 w-4" />
                View Inventory
              </Button>
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate('/manager/stock-in')}
              >
                <LogIn className="h-4 w-4" />
                Process Stock In
              </Button>
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate('/manager/stock-out')}
              >
                <LogOut className="h-4 w-4" />
                Review Stock Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
