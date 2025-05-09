
import React, { useState } from 'react';
import { SalesInquiry } from '@/types/database';
import { InquiryList } from '@/components/admin/sales-inquiries/InquiryList';
import { InquiryDetails } from '@/components/admin/sales-inquiries/InquiryDetails';
import { SearchFilters } from '@/components/admin/sales-inquiries/SearchFilters';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface InquiryManagementProps {
  inquiries: SalesInquiry[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string | undefined;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string | undefined) => void;
  updateInquiryStatus: (id: string, status: 'new' | 'in_progress' | 'completed') => Promise<boolean>;
  formatDate: (dateString: string) => string;
  refreshInquiries: () => void;
}

export const InquiryManagement: React.FC<InquiryManagementProps> = ({
  inquiries,
  isLoading,
  searchTerm,
  statusFilter,
  setSearchTerm,
  setStatusFilter,
  updateInquiryStatus,
  formatDate,
  refreshInquiries
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleViewDetails = (inquiry: SalesInquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailsOpen(true);
  };

  const handleRefresh = () => {
    refreshInquiries();
    toast({
      title: "Refreshed",
      description: "Inquiry data has been updated"
    });
  };

  const handleExportCSV = () => {
    // Generate CSV data
    const csvData = inquiries.map(inquiry => ({
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      company: inquiry.customer_company || '',
      status: inquiry.status,
      created_at: formatDate(inquiry.created_at),
      items_count: inquiry.items?.length || 0
    }));

    // Convert to CSV
    const headers = ['Customer Name', 'Customer Email', 'Company', 'Status', 'Created At', 'Items'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales_inquiries.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export complete",
      description: "Sales inquiries exported to CSV"
    });
  };

  // Filter and paginate inquiries
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = !searchTerm || 
      inquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.customer_company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <InquiryList
        inquiries={paginatedInquiries}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        formatDate={formatDate}
      />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      
      <InquiryDetails
        inquiry={selectedInquiry}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStatusChange={updateInquiryStatus}
        formatDate={formatDate}
      />
    </>
  );
};
