
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSalesInquiries } from '@/hooks/useSalesInquiries';
import { InquiryList } from '@/components/admin/sales-inquiries/InquiryList';
import { InquiryDetails } from '@/components/admin/sales-inquiries/InquiryDetails';
import { SearchFilters } from '@/components/admin/sales-inquiries/SearchFilters';

const SalesInquiriesManagement: React.FC = () => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const {
    inquiries,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedInquiry,
    setSelectedInquiry,
    updateInquiryStatus,
    formatDate
  } = useSalesInquiries();

  const handleViewDetails = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Inquiries" 
        description="View and manage customer pricing inquiries"
      />
      
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>
      
      <InquiryList
        inquiries={inquiries}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        formatDate={formatDate}
      />
      
      <InquiryDetails
        inquiry={selectedInquiry}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStatusChange={updateInquiryStatus}
        formatDate={formatDate}
      />
    </div>
  );
};

export default SalesInquiriesManagement;
