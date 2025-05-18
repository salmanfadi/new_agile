
import { useQuery } from '@tanstack/react-query';
import { 
  ProcessedBatchesOptions, 
  ProcessedBatchesResult, 
  BatchesQueryResult 
} from '@/types/processedBatches';
import { fetchProcessedBatchesData } from '@/services/processedBatchesService';
import { 
  transformToEnhancedView, 
  transformToProcessedBatches 
} from '@/utils/processedBatchesUtils';

/**
 * Hook to fetch processed batches with associated items and pagination
 * @param options Options for querying and filtering processed batches
 * @returns Query result with processed batches data
 */
export const useProcessedBatchesWithItems = (options: ProcessedBatchesOptions = {}) => {
  return useQuery({
    queryKey: [
      'processed-batches-with-items', 
      options.page, 
      options.pageSize, 
      options.productId, 
      options.warehouseId, 
      options.locationId, 
      options.startDate, 
      options.endDate, 
      options.searchTerm, 
      options.limit
    ],
    queryFn: async () => {
      try {
        // Fetch data from the database
        const { data, error, count, page, actualLimit } = 
          await fetchProcessedBatchesData(options);

        if (error) {
          console.error('Error fetching processed batches:', error);
          throw error;
        }

        // Format data based on whether limit is provided (for different views)
        if (options.limit) {
          return transformToEnhancedView(
            data, 
            options.page || 1, 
            actualLimit, 
            count || 0
          ) as BatchesQueryResult;
        }

        // Format for standard view
        const processedBatches = transformToProcessedBatches(data);
        
        return {
          data: processedBatches,
          total: count || 0,
          page: options.page || 1,
          pageSize: actualLimit
        } as ProcessedBatchesResult;
        
      } catch (error) {
        console.error('Error in useProcessedBatchesWithItems hook:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData
  });
};
