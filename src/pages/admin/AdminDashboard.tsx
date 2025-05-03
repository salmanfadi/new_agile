import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, Package, Users, BarChart, User, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Fetch dashboard statistics
  const { data: stats = {} } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [usersCount, warehousesCount, productsCount, inventorySum] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('warehouses').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('inventory').select('quantity').then(res => 
          res.data ? res.data.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0
        )
      ]);
      
      return {
        users: usersCount.count || 0,
        warehouses: warehousesCount.count || 0,
        products: productsCount.count || 0,
        inventory: inventorySum
      };
    },
    initialData: {
      users: 0,
      warehouses: 0,
      products: 0,
      inventory: 0
    }
  });
  
  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ['admin-dashboard-activities'],
    queryFn: async () => {
      // Fetch recent stock_in records
      const stockIns = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          submitter:submitted_by(name, username),
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
          requester:requested_by(name, username),
          status,
          created_at,
          quantity
        `)
        .order('created_at', { ascending: false })
        .limit(3);
        
      const stockInActivities = (stockIns.data || []).map(item => {
        const submitter = item.submitter && !item.submitter.error 
          ? `${item.submitter.name} (${item.submitter.username})` 
          : 'Unknown User';
        
        return {
          type: 'Stock In',
          product: item.product?.name || 'Unknown',
          user: submitter,
          quantity: `${item.boxes} boxes`,
          status: item.status,
          date: new Date(item.created_at).toLocaleDateString()
        };
      });
      
      const stockOutActivities = (stockOuts.data || []).map(item => {
        const requester = item.requester && !item.requester.error 
          ? `${item.requester.name} (${item.requester.username})` 
          : 'Unknown User';
        
        return {
          type: 'Stock Out',
          product: item.product?.name || 'Unknown',
          user: requester,
          quantity: `${item.quantity} units`,
          status: item.status,
          date: new Date(item.created_at).toLocaleDateString()
        };
      });
      
      return [...stockInActivities, ...stockOutActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    }
  });

  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.users, 
      icon: <Users className="h-5 w-5" />,
    },
    { 
      title: 'Warehouses', 
      value: stats.warehouses, 
      icon: <Warehouse className="h-5 w-5" />,
    },
    { 
      title: 'Products', 
      value: stats.products, 
      icon: <Package className="h-5 w-5" />,
    },
    { 
      title: 'Total Inventory', 
      value: stats.inventory, 
      icon: <BarChart className="h-5 w-5" />,
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Overview of system status and recent activity"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
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
                {recentActivities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.type}</TableCell>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{activity.details}</TableCell>
                    <TableCell>{activity.date}</TableCell>
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
  );
};

export default AdminDashboard;
