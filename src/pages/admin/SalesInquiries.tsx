
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSalesInquiries } from '@/hooks/useSalesInquiries';
import { InquiryManagement } from '@/components/sales/InquiryManagement';

const SalesInquiries: React.FC = () => {
  const {
    inquiries,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    updateInquiryStatus,
    formatDate,
    refreshInquiries
  } = useSalesInquiries();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Inquiries" 
        description="View and manage customer pricing inquiries"
      />
      
      <InquiryManagement
        inquiries={inquiries}
        isLoading={isLoading}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        setSearchTerm={setSearchTerm}
        setStatusFilter={setStatusFilter}
        updateInquiryStatus={updateInquiryStatus}
        formatDate={formatDate}
        refreshInquiries={refreshInquiries}
      />
    </div>
  );
};

export default SalesInquiries;
