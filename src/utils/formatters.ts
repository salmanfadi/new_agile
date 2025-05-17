
/**
 * Format a number as currency
 * @param value The value to format
 * @param currency The currency code, defaults to USD
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format a number with commas for thousands
 * @param value The value to format
 * @returns Formatted number string with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format a date to a human-readable string
 * @param date The date to format
 * @param includeTime Whether to include the time
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, includeTime = false): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (includeTime) {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Truncate text to a specified length
 * @param text The text to truncate
 * @param length Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, length = 50): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return `${text.substring(0, length)}...`;
};
