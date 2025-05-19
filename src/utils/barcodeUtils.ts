
/**
 * Utility functions for handling barcodes in the inventory system
 */

/**
 * Generates a unique barcode string using product information and other parameters
 * 
 * @param category Product category code (optional)
 * @param sku Product SKU (optional)
 * @param boxNumber Box number within a batch
 * @param timestamp Optional timestamp to ensure uniqueness (defaults to current time)
 * @returns A unique barcode string
 */
export const generateBarcodeString = async (
  category?: string,
  sku?: string,
  boxNumber?: number,
  timestamp = Date.now()
): Promise<string> => {
  // Clean and format category (default to "PRD" if not provided)
  const cleanCategory = (category || "PRD")
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  
  // Clean and format SKU (default to random string if not provided)
  const cleanSku = sku 
    ? sku.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase()
    : generateRandomString(5);
  
  // Format box number (default to random number if not provided)
  const boxStr = boxNumber 
    ? boxNumber.toString().padStart(3, '0') 
    : Math.floor(Math.random() * 999).toString().padStart(3, '0');
  
  // Get timestamp portion (last 6 digits)
  const timeStr = timestamp.toString().slice(-6);
  
  // Combine all parts
  const barcode = `${cleanCategory}-${cleanSku}-${boxStr}-${timeStr}`;
  
  return barcode;
};

/**
 * Generates a random alphanumeric string of the specified length
 * 
 * @param length Length of the string to generate
 * @returns Random alphanumeric string
 */
const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Checks if a barcode is well-formed according to our system's format
 * 
 * @param barcode The barcode to validate
 * @returns True if the barcode is valid, false otherwise
 */
export const isValidBarcode = (barcode: string): boolean => {
  // Simple pattern matching validation
  const pattern = /^[A-Z]{3}-[A-Z0-9]{1,5}-[0-9]{1,3}-[0-9]{1,6}$/;
  return pattern.test(barcode);
};
