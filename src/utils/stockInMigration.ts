
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Function to migrate data from stock_in to unified_stock_in
export const migrateStockInData = async () => {
  try {
    const { error } = await supabase.rpc('migrate_stock_in_data');
    
    if (error) {
      console.error('Error migrating stock in data:', error);
      toast({
        title: 'Migration Failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Migration Complete',
      description: 'Stock In data has been migrated to the new unified structure',
    });
    return true;
  } catch (error) {
    console.error('Exception during migration:', error);
    toast({
      title: 'Migration Failed',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      variant: 'destructive',
    });
    return false;
  }
};

// Function to check if there is pending data to migrate
export const checkPendingMigrations = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('stock_in')
      .select('id')
      .not('status', 'eq', 'completed');
      
    if (error) {
      console.error('Error checking pending migrations:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Exception checking migrations:', error);
    return 0;
  }
};
