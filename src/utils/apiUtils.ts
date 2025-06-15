import { supabase } from '@/integrations/supabase/client';

/**
 * Handles API request errors and provides detailed error information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validates barcodes against the inventory system
 * 
 * @param barcodes - Array of barcodes to validate
 * @returns Object containing existing and non-existing barcodes
 */
export const validateBarcodesAgainstInventory = async (barcodes: string[]) => {
  try {
    // Ensure we have valid barcodes to check
    if (!barcodes || barcodes.length === 0) {
      throw new ApiError('No barcodes provided for validation');
    }

    // Format barcodes for the query
    const formattedBarcodes = barcodes.map(b => `"${b}"`).join(',');
    
    // Query inventory for existing barcodes
    const { data, error } = await supabase
      .from('inventory')
      .select('barcode, product_id, status')
      .in('barcode', barcodes);

    if (error) {
      console.error('Error validating barcodes:', error);
      throw new ApiError(
        'Failed to validate barcodes',
        error.code ? parseInt(error.code) : undefined,
        error.code,
        error
      );
    }

    // Separate existing and non-existing barcodes
    const existingBarcodes = data || [];
    const existingBarcodeSet = new Set(existingBarcodes.map(item => item.barcode));
    const nonExistingBarcodes = barcodes.filter(barcode => !existingBarcodeSet.has(barcode));

    return {
      existing: existingBarcodes,
      nonExisting: nonExistingBarcodes
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Unexpected error during barcode validation',
      undefined,
      'UNKNOWN_ERROR',
      error
    );
  }
};

/**
 * Checks if the Supabase client is properly configured
 */
export const validateSupabaseConfig = async () => {
  if (!supabase) {
    throw new ApiError('Supabase client is not initialized');
  }

  try {
    // Test the connection with a simple query
    await supabase
      .from('inventory')
      .select('count')
      .limit(1);
    return true;
  } catch (error: any) {
    throw new ApiError(
      'Failed to connect to Supabase',
      error.code ? parseInt(error.code) : undefined,
      error.code,
      error
    );
  }
};

/**
 * Retries a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in milliseconds
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}; 