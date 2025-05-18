
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LogIn, LogOut, Clock, ArrowRight, BarcodeIcon, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from "react-router-dom";
import { useUserStockActivity } from "@/hooks/useUserStockActivity";

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch user's stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['operator-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { stockInCount: 0, stockOutCount: 0, transfersCount: 0 };
      
      const [stockInCount, stockOutCount, transfersCount, pendingStockIn, pendingStockOut, pendingTransfers] = await Promise.all([
        supabase.from('stock_in').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
        supabase.from('stock_out').select('*', { count: 'exact', head: true }).eq('requested_by', user.id),
        supabase.from('inventory_transfers').select('*', { count: 'exact', head: true }).eq('initiated_by', user.id),
        supabase.from('stock_in').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id).eq('status', 'pending'),
        supabase.from('stock_out').select('*', { count: 'exact', head: true }).eq('requested_by', user.id).eq('status', 'pending'),
        supabase.from('inventory_transfers').select('*', { count: 'exact', head: true }).eq('initiated_by', user.id).eq('status', 'pending')
      ]);
      
      return {
        stockInCount: stockInCount.count || 0,
        stockOutCount: stockOutCount.count || 0,
        transfersCount: transfersCount.count || 0,
        pendingStockIn: pendingStockIn.count || 0,
        pendingStockOut: pendingStockOut.count || 0,
        pendingTransfers: pendingTransfers.count || 0
      };
    },
    enabled: !!user?.id,
    initialData: { 
      stockInCount: 0, 
      stockOutCount: 0, 
      transfersCount: 0,
      pendingStockIn: 0, 
      pendingStockOut: 0,
      pendingTransfers: 0
    }
  });
  
  // Use the updated hook with the correct property names
  const { isActivityLoading, stockInActivity, stockOutActivity, transferActivity } = useUserStockActivity(user?.id, { limit: 5 });

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
      value: statsLoading ? '...' : (userStats.pendingStockIn + userStats.pendingStockOut + userStats.pendingTransfers), 
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {isActivityLoading ? (
                  <p className="text-muted-foreground">Loading activity...</p>
                ) : (
                  <>
                    {stockInActivity.length === 0 && stockOutActivity.length === 0 && transferActivity.length === 0 ? (
                      <p className="text-muted-foreground">No recent activity</p>
                    ) : (
                      <>
                        {stockInActivity.map((activity: any) => (
                          <div key={activity.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">{activity.product?.name || 'Product'}</p>
                              <p className="text-sm text-muted-foreground">Stock In - {activity.boxes} boxes from {activity.source}</p>
                            </div>
                            <StatusBadge status={activity.status} />
                          </div>
                        ))}
                        {stockOutActivity.map((activity: any) => (
                          <div key={activity.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">{activity.product?.name || 'Product'}</p>
                              <p className="text-sm text-muted-foreground">Stock Out - {activity.quantity} units to {activity.destination}</p>
                            </div>
                            <StatusBadge status={activity.status} />
                          </div>
                        ))}
                        {transferActivity.map((activity: any) => (
                          <div key={activity.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">{activity.product?.name || 'Product'}</p>
                              <p className="text-sm text-muted-foreground">
                                Transfer - {activity.quantity} units from {activity.source_warehouse?.name || 'Unknown'} to {activity.destination_warehouse?.name || 'Unknown'}
                              </p>
                            </div>
                            <StatusBadge status={activity.status} />
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/field/submissions">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
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
                onClick={() => navigate('/field/transfers')}
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                New Transfer
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/field/barcode')}
                className="w-full flex items-center justify-center gap-2"
              >
                <BarcodeIcon className="h-4 w-4" />
                Barcode Lookup
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
