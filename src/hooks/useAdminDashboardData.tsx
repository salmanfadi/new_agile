
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
      const { data: stockInsData, error: stockInsError } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(name),
          boxes,
          status,
          created_at,
          submitted_by
        `)
        .order('created_at', { ascending: false })
        .limit(10);
        
      // Fetch recent stock_out records with proper relationship hints
      const { data: stockOutsData, error: stockOutsError } = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name),
          quantity,
          status,
          created_at,
          requested_by
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Fetch profiles to properly map user IDs to names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, username');
      
      // Create a map of user IDs to profile data for easy lookup
      const profilesMap = profilesData ? 
        profilesData.reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {}) : {};
        
      const stockInActivities = (stockInsData || []).map(item => {
        const submitter = profilesMap[item.submitted_by];
        const submitterName = submitter ? 
          `${submitter.name || 'Unknown'} (${submitter.username || 'Unknown'})` : 
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
      
      const stockOutActivities = (stockOutsData || []).map(item => {
        const requester = profilesMap[item.requested_by];
        const requesterName = requester ? 
          `${requester.name || 'Unknown'} (${requester.username || 'Unknown'})` : 
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
