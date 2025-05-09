
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSalesInquiries } from '@/hooks/useSalesInquiries';
import { InquiryManagement } from '@/components/sales/InquiryManagement';
import { Card } from '@/components/ui/card';

const SalesInquiriesManagement: React.FC = () => {
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Customer Inquiries" 
        description="View and respond to customer pricing inquiries"
      />
      
      <Card className="border-0 shadow-sm overflow-hidden">
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
      </Card>
    </div>
  );
};

export default SalesInquiriesManagement;
