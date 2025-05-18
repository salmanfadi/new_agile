import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

/**
 * Generates a unique barcode string
 * @param category Optional category prefix
 * @param sku Optional SKU prefix
 * @param boxNumber Optional box number
 * @returns A unique barcode string
 */
export const generateBarcodeString = async (
  category?: string,
  sku?: string,
  boxNumber?: number
): Promise<string> => {
  // Format and validate inputs
  const formattedCategory = category 
    ? category.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) 
    : 'GEN';
    
  const formattedSku = sku 
    ? sku.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) 
    : '';
    
  // Generate a batch identifier (using part of a UUID)
  const batchId = uuidv4().substring(0, 8);
  
  // Format box number with leading zeros (001, 002, etc)
  const formattedBoxNumber = boxNumber 
    ? boxNumber.toString().padStart(3, '0') 
    : '001';
  
  // Combine parts to create the barcode
  // Format: CAT-SKU-BATCH-BOX
  const parts = [
    formattedCategory,
    formattedSku,
    batchId,
    formattedBoxNumber
  ].filter(Boolean); // Remove empty parts
  
  let barcode = parts.join('-');
  
  // Calculate and append check digit
  const checkDigit = calculateCheckDigit(barcode.replace(/-/g, ''));
  barcode = `${barcode}-${checkDigit}`;
  
  // Check if the barcode already exists in the inventory or batch_items
  let exists = true;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (exists && attempts < maxAttempts) {
    attempts++;
    
    // Check inventory table
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('barcode')
      .eq('barcode', barcode)
      .limit(1);
      
    // Check batch_items table
    const { data: batchItemsData } = await supabase
      .from('batch_items')
      .select('barcode')
      .eq('barcode', barcode)
      .limit(1);
    
    // Check stock_in_details table (to avoid conflicts on unique constraint)
    const { data: detailsData } = await supabase
      .from('stock_in_details')
      .select('barcode')
      .eq('barcode', barcode)
      .limit(1);
    
    // If barcode exists in either table, generate a new one
    if ((inventoryData && inventoryData.length > 0) || 
        (batchItemsData && batchItemsData.length > 0) ||
        (detailsData && detailsData.length > 0)) {
      // Generate new batch ID for uniqueness
      const newBatchId = uuidv4().substring(0, 8);
      const newParts = [
        formattedCategory,
        formattedSku,
        newBatchId,
        formattedBoxNumber
      ].filter(Boolean);
      
      barcode = newParts.join('-');
      const newCheckDigit = calculateCheckDigit(barcode.replace(/-/g, ''));
      barcode = `${barcode}-${newCheckDigit}`;
    } else {
      exists = false;
    }
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate a unique barcode after multiple attempts');
  }
  
  return barcode;
};

/**
 * Formats a barcode for display by adding dashes or other formatting
 * @param barcode The raw barcode string
 * @returns Formatted barcode for display
 */
export const formatBarcodeForDisplay = (barcode: string): string => {
  if (!barcode) return '';
  
  // If it's already in a standard format like XXX-XXX-XXX, return as is
  if (barcode.includes('-')) return barcode;
  
  // For UUIDs, format with dashes to make them more readable
  if (barcode.length >= 32) {
    return `${barcode.substring(0, 8)}-${barcode.substring(8, 12)}-${barcode.substring(12, 16)}-${barcode.substring(16, 20)}-${barcode.substring(20)}`;
  }
  
  // For numeric barcodes, format in groups of 4
  if (/^\d+$/.test(barcode)) {
    return barcode.match(/.{1,4}/g)?.join('-') || barcode;
  }
  
  // For other formats, try to group in a reasonable way
  if (barcode.length > 8) {
    return `${barcode.substring(0, 4)}-${barcode.substring(4, 8)}-${barcode.substring(8)}`;
  }
  
  return barcode;
};

/**
 * Normalizes a barcode by removing formatting characters
 * @param barcode The formatted barcode string
 * @returns Normalized barcode without formatting
 */
export const normalizeBarcode = (barcode: string): string => {
  if (!barcode) return '';
  
  // Remove dashes, spaces, and other common formatting characters
  return barcode.replace(/[-\s]/g, '');
};

/**
 * Validates a barcode against common barcode formats
 * @param barcode The barcode to validate
 * @returns Boolean indicating if the barcode is valid
 */
export const validateBarcode = (barcode: string): boolean => {
  if (!barcode) return false;
  
  // Basic validation - should be at least 4 characters
  if (barcode.length < 4) return false;
  
  // This is a simplified validation. Add specific rules here as needed.
  // Examples could include check digit validation for specific barcode types
  
  return true;
};

/**
 * Creates a barcode image URL for display purposes
 * This is a mock implementation - in production you would use a real barcode library
 * @param barcode The barcode data
 * @param format The barcode format (e.g., 'code128', 'qrcode')
 * @returns URL to a barcode image
 */
export const createBarcodeImageUrl = (barcode: string, format: string = 'code128'): string => {
  // This is a placeholder. In a real app, you'd generate an actual barcode.
  // You could use a library like JSBarcode for frontend rendering
  // or a service that returns an image URL.
  
  // Placeholder SVG for a barcode:
  return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48ZyBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiPjxsaW5lIHgxPSIxMCIgeTE9IjEwIiB4Mj0iMTAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTUiIHkxPSIxMCIgeDI9IjE1IiB5Mj0iOTAiIC8+PGxpbmUgeDE9IjIwIiB5MT0iMTAiIHgyPSIyMCIgeTI9IjkwIiAvPjxsaW5lIHgxPSIzMCIgeTE9IjEwIiB4Mj0iMzAiIHkyPSI5MCIgLz48bGluZSB4MT0iNDAiIHkxPSIxMCIgeDI9IjQwIiB5Mj0iOTAiIC8+PGxpbmUgeDE9IjUwIiB5MT0iMTAiIHgyPSI1MCIgeTI9IjkwIiAvPjxsaW5lIHgxPSI2MCIgeTE9IjEwIiB4Mj0iNjAiIHkyPSI5MCIgLz48bGluZSB4MT0iNzAiIHkxPSIxMCIgeDI9IjcwIiB5Mj0iOTAiIC8+PGxpbmUgeDE9IjgwIiB5MT0iMTAiIHgyPSI4MCIgeTI9IjkwIiAvPjxsaW5lIHgxPSI5MCIgeTE9IjEwIiB4Mj0iOTAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTAwIiB5MT0iMTAiIHgyPSIxMDAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTE1IiB5MT0iMTAiIHgyPSIxMTUiIHkyPSI5MCIgLz48bGluZSB4MT0iMTIwIiB5MT0iMTAiIHgyPSIxMjAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTMwIiB5MT0iMTAiIHgyPSIxMzAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTQwIiB5MT0iMTAiIHgyPSIxNDAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTUwIiB5MT0iMTAiIHgyPSIxNTAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTYwIiB5MT0iMTAiIHgyPSIxNjAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTcwIiB5MT0iMTAiIHgyPSIxNzAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTgwIiB5MT0iMTAiIHgyPSIxODAiIHkyPSI5MCIgLz48bGluZSB4MT0iMTkwIiB5MT0iMTAiIHgyPSIxOTAiIHkyPSI5MCIgLz48L2c+PC9zdmc+`;
};

/**
 * Calculate check digit for CODE128 barcode
 * @param data The barcode data without check digit
 * @returns The check digit
 */
export const calculateCheckDigit = (data: string): number => {
  let sum = 0;
  
  // Weighted sum calculation
  for (let i = 0; i < data.length; i++) {
    // Use position-based weighting (1-based index)
    const weight = i + 1;
    // Convert character to ASCII code and subtract 32 (start of printable ASCII)
    const charValue = data.charCodeAt(i) - 32;
    sum += charValue * weight;
  }
  
  // Calculate modulo 103 and add 32 to get back into printable ASCII range
  const checkDigit = (sum % 103) + 32;
  
  return checkDigit;
};
