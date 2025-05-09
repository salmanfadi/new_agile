
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { StatsCard } from '@/components/ui/StatsCard';
import { Users, ShoppingCart, Package, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SalesOperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['sales-dashboard-stats'],
    queryFn: async () => {
      // Get total number of inquiries
      const { count: totalInquiries, error: inquiriesError } = await supabase
        .from('sales_inquiries')
        .select('*', { count: 'exact', head: true });
      
      if (inquiriesError) throw inquiriesError;
      
      // Get number of new inquiries
      const { count: newInquiries, error: newInquiriesError } = await supabase
        .from('sales_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      
      if (newInquiriesError) throw newInquiriesError;
      
      // Get total products
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (productsError) throw productsError;
      
      return {
        totalInquiries: totalInquiries || 0,
        newInquiries: newInquiries || 0,
        totalProducts: totalProducts || 0
      };
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Dashboard" 
        description={`Welcome back, ${user?.name || 'Sales Operator'}`}
      />
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Inquiries"
          value={isLoading ? "Loading..." : dashboardStats?.totalInquiries.toString() || "0"}
          description="All customer inquiries"
          icon={<ShoppingCart className="h-8 w-8 text-blue-500" />}
        />
        <StatsCard 
          title="New Inquiries"
          value={isLoading ? "Loading..." : dashboardStats?.newInquiries.toString() || "0"}
          description="Awaiting response"
          icon={<Clock className="h-8 w-8 text-yellow-500" />}
        />
        <StatsCard 
          title="Product Catalog"
          value={isLoading ? "Loading..." : dashboardStats?.totalProducts.toString() || "0"}
          description="Active products"
          icon={<Package className="h-8 w-8 text-green-500" />}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = '/sales/inquiries'}>
            <CardContent className="flex flex-col items-center text-center p-6">
              <ShoppingCart className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">Manage Inquiries</h3>
              <p className="text-sm text-gray-500">View and respond to customer inquiries</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = '/products'}>
            <CardContent className="flex flex-col items-center text-center p-6">
              <Package className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Product Catalog</h3>
              <p className="text-sm text-gray-500">View product listings</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesOperatorDashboard;
