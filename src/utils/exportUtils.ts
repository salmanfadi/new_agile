
import { jsPDF } from 'jspdf';

// Function to export data to CSV
export const exportToCsv = (data: any[], filename: string): void => {
  // Convert data to CSV format
  const csvRows: string[] = [];
  
  // Get the headers
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  
  // Add the data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Handle commas and quotes in the data
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create a CSV string
  const csvString = csvRows.join('\n');
  
  // Create a download link
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export data to PDF
export const exportToPdf = (
  data: any[], 
  filename: string, 
  title: string, 
  columns: { header: string; accessor: string }[]
): void => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add table
  const tableData = data.map(item => 
    columns.map(column => {
      const value = item[column.accessor];
      return value !== undefined && value !== null ? String(value) : '';
    })
  );
  
  doc.setFontSize(10);
  doc.table(
    14, 
    40, 
    tableData, 
    columns.map(column => column.header), 
    { autoSize: true }
  );
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

// Format numbers for display
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value);
};

// Format percentage for display
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Function to prepare data for specific chart types
export const prepareChartData = (
  data: Record<string, number>,
  sortBy: 'key' | 'value' = 'value',
  limit: number = 10
): { name: string; value: number }[] => {
  const entries = Object.entries(data);
  
  // Sort by value or key
  if (sortBy === 'value') {
    entries.sort((a, b) => b[1] - a[1]);
  } else {
    entries.sort((a, b) => a[0].localeCompare(b[0]));
  }
  
  // Limit the number of items and map to chart format
  return entries.slice(0, limit).map(([name, value]) => ({ name, value }));
};

// Date formatting functions
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

export const formatDateTime = (date: Date | string): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
};
