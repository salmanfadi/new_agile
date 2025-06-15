
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

/**
 * Export data as CSV
 * @param data The data to export
 * @param filename The filename to save as
 */
export const exportToCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.csv'
): void => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Get headers from first data item
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV rows
    const csvRows = [
      headers.join(','), // Column headers
      ...data.map(row => headers.map(header => {
        const value = row[header];
        
        // Handle strings with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        
        // Format dates if they are Date objects
        if (value instanceof Date) {
          return format(value, 'yyyy-MM-dd');
        }
        
        // Convert objects to JSON strings
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        return value === null || value === undefined ? '' : value;
      }).join(','))
    ];
    
    // Join rows with newlines
    const csvString = csvRows.join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Feature detection for browsers that support download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Error exporting CSV:', err);
  }
};

/**
 * Export table data as PDF
 * @param data The table data
 * @param headers Table column headers
 * @param title PDF title
 * @param filename The filename to save as
 */
export const exportTableToPdf = (
  data: Record<string, any>[],
  title: string,
  filename: string = 'export.pdf'
): void => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Format data for PDF table
    const headers = Object.keys(data[0]);
    const rows = data.map(item => Object.values(item).map(value => {
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd');
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value === null || value === undefined ? '' : String(value);
    }));

    // Create PDF document
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(title, 14, 20);
    
    // Add date
    pdf.setFontSize(10);
    pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);
    
    // Add table
    pdf.setFontSize(12);
    const tableY = 40;
    
    if (headers && rows) {
      // Convert headers and rows to string arrays
      const headerStrings = headers.map(header => String(header));
      const rowStrings = rows.map(row => row.map(cell => String(cell)));
    
      // Generate table with strings
      pdf.table(14, tableY, rowStrings as unknown as { [key: string]: string }[], headerStrings, { autoSize: true });
    }
    
    // Save PDF
    pdf.save(filename);
  } catch (err) {
    console.error('Error exporting PDF:', err);
  }
};

/**
 * Export chart data as PDF
 * @param chartRef Reference to the chart component
 * @param title PDF title
 * @param filename The filename to save as
 */
export const exportChartToPdf = (
  chartRef: React.RefObject<HTMLElement>,
  title: string,
  filename: string = 'chart-export.pdf'
): void => {
  if (!chartRef.current) {
    console.warn('No chart reference provided');
    return;
  }

  try {
    // Create a canvas from the chart div
    const chartElement = chartRef.current;
    
    // Use html2canvas or other library to convert to image
    // For this example, we'll just use a placeholder approach
    // In a real implementation, you would use html2canvas or similar
    
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(title, 14, 20);
    
    // Add date
    pdf.setFontSize(10);
    pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);
    
    // In a real implementation, you would add the chart image here
    pdf.setFontSize(12);
    pdf.text('Chart image would be inserted here in a production implementation', 14, 50);
    
    // Save PDF
    pdf.save(filename);
  } catch (err) {
    console.error('Error exporting chart to PDF:', err);
  }
};
