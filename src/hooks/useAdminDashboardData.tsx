
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminDashboardData = () => {
  // Fetch dashboard statistics
  const statsQuery = useQuery({
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
    }
  });

  // Fetch recent activities
  const activitiesQuery = useQuery({
    queryKey: ['admin-dashboard-activities'],
    queryFn: async () => {
      // Fetch recent stock_in records with proper relationship hints
      const stockIns = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          submitter:submitted_by(id, name, username)
          status,
          created_at,
          boxes
        `);
        
      // Fetch recent stock_out records with proper relationship hints
      const stockOuts = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          requester:requested_by(id, name, username),
          status,
          created_at,
          quantity
        `);
        
      const stockInActivities = (stockIns.data || []).map(item => {
        const submitterName = item.submitter ? 
          `${item.submitter.name || 'Unknown'} (${item.submitter.username || 'Unknown'})` : 
          'Unknown User';
        
        return {
          type: 'Stock In',
          product: item.product?.name || 'Unknown',
          user: submitterName,
          quantity: `${item.boxes} boxes`,
          status: item.status,
          date: new Date(item.created_at).toLocaleDateString()
        };
      });
      
      const stockOutActivities = (stockOuts.data || []).map(item => {
        const requesterName = item.requester ? 
          `${item.requester.name || 'Unknown'} (${item.requester.username || 'Unknown'})` : 
          'Unknown User';
        
        return {
          type: 'Stock Out',
          product: item.product?.name || 'Unknown',
          user: requesterName,
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

  return {
    stats: statsQuery.data || { users: 0, warehouses: 0, products: 0, inventory: 0 },
    activities: activitiesQuery.data || [],
    isLoadingStats: statsQuery.isLoading,
    isLoadingActivities: activitiesQuery.isLoading
  };
};
