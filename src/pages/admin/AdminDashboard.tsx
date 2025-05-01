
import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Warehouse, Package, Users, BarChart3, Box } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard: React.FC = () => {
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [warehouses, products, inventory, stockIn, stockOut, users] = await Promise.all([
        supabase.from('warehouses').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('inventory').select('quantity').throwOnError(),
        supabase.from('stock_in').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('stock_out').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);
      
      // Calculate total inventory
      const totalInventory = inventory.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      
      return {
        warehousesCount: warehouses.count || 0,
        productsCount: products.count || 0,
        inventoryCount: totalInventory,
        pendingStockIn: stockIn.count || 0,
        pendingStockOut: stockOut.count || 0,
        usersCount: users.count || 0,
      };
    },
    initialData: {
      warehousesCount: 0,
      productsCount: 0,
      inventoryCount: 0,
      pendingStockIn: 0,
      pendingStockOut: 0,
      usersCount: 0,
    }
  });

  // Fetch recent activity
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      // Get recent stock in activities
      const { data: stockInData } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          submitter:submitted_by(username),
          boxes,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(3);
      
      // Get recent stock out activities
      const { data: stockOutData } = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          requester:requested_by(username),
          quantity,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(2);
      
      const stockInActivity = (stockInData || []).map(item => ({
        action: 'Stock In Submitted',
        user: item.submitter?.username || 'Unknown',
        details: `${item.boxes} boxes of ${item.product?.name || 'Unknown Product'}`,
        timestamp: item.created_at,
        status: item.status
      }));
      
      const stockOutActivity = (stockOutData || []).map(item => ({
        action: 'Stock Out Requested',
        user: item.requester?.username || 'Unknown',
        details: `${item.quantity} units of ${item.product?.name || 'Unknown Product'}`,
        timestamp: item.created_at,
        status: item.status
      }));
      
      return [...stockInActivity, ...stockOutActivity]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    initialData: []
  });
  
  const mockStats = [
    { 
      title: 'Total Warehouses', 
      value: statsLoading ? '...' : dashboardStats.warehousesCount, 
      icon: <Warehouse className="h-5 w-5" /> 
    },
    { 
      title: 'Total Inventory', 
      value: statsLoading ? '...' : `${dashboardStats.inventoryCount} Units`, 
      icon: <Box className="h-5 w-5" /> 
    },
    { 
      title: 'Pending Stock In', 
      value: statsLoading ? '...' : dashboardStats.pendingStockIn, 
      icon: <Package className="h-5 w-5" /> 
    },
    { 
      title: 'Pending Stock Out', 
      value: statsLoading ? '...' : dashboardStats.pendingStockOut, 
      icon: <Package className="h-5 w-5" /> 
    },
    { 
      title: 'Total Users', 
      value: statsLoading ? '...' : dashboardStats.usersCount, 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      title: 'Total Products', 
      value: statsLoading ? '...' : dashboardStats.productsCount, 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Overview of system status and recent activity"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                      <div className="mt-2">Loading activity...</div>
                    </TableCell>
                  </TableRow>
                ) : recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No recent activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{activity.action}</TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>{activity.details}</TableCell>
                      <TableCell>{typeof activity.timestamp === 'string' 
                        ? new Date(activity.timestamp).toLocaleString() 
                        : activity.timestamp}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={activity.status as any} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
