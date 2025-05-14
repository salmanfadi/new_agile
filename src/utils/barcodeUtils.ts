
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
