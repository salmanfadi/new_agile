import React, { useState } from 'react';
import { CustomerInquiry } from '@/types/database';
import { InquiryList } from '@/components/admin/customer-inquiries/InquiryList';
import { InquiryDetails } from '@/components/admin/customer-inquiries/InquiryDetails';
import { SearchFilters } from '@/components/admin/customer-inquiries/SearchFilters';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface InquiryManagementProps {
  inquiries: CustomerInquiry[];
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
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleViewDetails = (inquiry: CustomerInquiry) => {
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
      product_id: inquiry.product_id,
      quantity: inquiry.quantity,
      status: inquiry.status,
      created_at: formatDate(inquiry.created_at),
      notes: inquiry.notes || ''
    }));

    // Convert to CSV
    const headers = ['Customer Name', 'Customer Email', 'Product ID', 'Quantity', 'Status', 'Created At', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer_inquiries.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export complete",
      description: "Customer inquiries exported to CSV"
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
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
          
          <div className="flex flex-row gap-2 justify-end">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>
        
        <InquiryList
          inquiries={paginatedInquiries}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          formatDate={formatDate}
        />
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="hidden sm:inline-flex w-8 h-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <span className="sm:hidden text-sm">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onStatusChange={updateInquiryStatus}
          formatDate={formatDate}
        />
      )}
    </>
  );
};
