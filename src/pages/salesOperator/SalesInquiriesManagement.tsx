
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSalesInquiries } from '@/hooks/useSalesInquiries';
import { InquiryManagement } from '@/components/sales/InquiryManagement';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-6">
      <PageHeader 
        title="Customer Inquiries" 
        description="Manage and respond to customer inquiries"
      />
      
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesInquiriesManagement;
