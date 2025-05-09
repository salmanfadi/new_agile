
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { Card } from '@/components/ui/card';

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Sales Dashboard" 
        description={`Welcome back, ${user?.name || 'Sales Operator'}`}
      />
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 h-32 flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </Card>
          ))}
        </div>
      ) : (
        <SalesDashboard
          totalInquiries={dashboardStats?.totalInquiries || 0}
          newInquiries={dashboardStats?.newInquiries || 0}
          totalProducts={dashboardStats?.totalProducts || 0}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default SalesOperatorDashboard;
