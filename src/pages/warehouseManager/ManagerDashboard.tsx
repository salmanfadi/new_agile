
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  
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
      const stockIns = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(3);
        
      const stockOuts = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(2);
        
      const stockInActivity = (stockIns.data || []).map(item => ({
        action: 'Stock In Processed',
        product: item.product.name,
        timestamp: item.created_at,
        status: item.status
      }));
      
      const stockOutActivity = (stockOuts.data || []).map(item => ({
        action: 'Stock Out Processed',
        product: item.product.name,
        timestamp: item.created_at,
        status: item.status
      }));
      
      return [...stockInActivity, ...stockOutActivity]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    initialData: [
      { action: 'Stock In Processed', product: 'LED Wall Clock', timestamp: '2025-05-01 10:30 AM', status: 'completed' },
      { action: 'Stock Out Approved', product: 'Desktop Clock', timestamp: '2025-05-01 09:45 AM', status: 'approved' },
      { action: 'Stock In Processed', product: 'Table Clock', timestamp: '2025-04-30 04:20 PM', status: 'completed' },
      { action: 'Stock Out Rejected', product: 'Wall Clock', timestamp: '2025-04-30 02:15 PM', status: 'rejected' },
      { action: 'Stock In Processed', product: 'Alarm Clock', timestamp: '2025-04-30 11:05 AM', status: 'completed' }
    ]
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
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{activity.action}</TableCell>
                        <TableCell>{activity.product}</TableCell>
                        <TableCell>{typeof activity.timestamp === 'string' 
                          ? new Date(activity.timestamp).toLocaleString() 
                          : activity.timestamp}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={activity.status as any} />
                        </TableCell>
                      </TableRow>
                    ))}
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
              {/* Add more buttons as needed */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
