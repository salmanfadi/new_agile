
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesDashboard } from '@/components/sales/SalesDashboard';

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
      
      <SalesDashboard
        totalInquiries={dashboardStats?.totalInquiries || 0}
        newInquiries={dashboardStats?.newInquiries || 0}
        totalProducts={dashboardStats?.totalProducts || 0}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SalesOperatorDashboard;
