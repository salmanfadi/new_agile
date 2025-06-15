
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCustomerInquiries } from '@/hooks/useCustomerInquiries';
import { InquiryManagement } from '@/components/sales/InquiryManagement';
import { TestDataCreator } from '@/components/dev/TestDataCreator';
import { Card, CardContent } from '@/components/ui/card';
import { SalesInquiry } from '@/types/inquiries';

const SalesInquiriesManagement: React.FC = () => {
  const {
    inquiries,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    updateInquiryStatus,
    convertInquiryToOrder,
    refreshInquiries
  } = useCustomerInquiries();

  // Simple date formatter
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Convert CustomerInquiry to SalesInquiry format for compatibility
  const salesInquiries = inquiries.map(inquiry => ({
    ...inquiry,
    message: inquiry.message || inquiry.notes || '', // Ensure message field exists and is not null
  }));

  // Wrapper function to handle type conversion
  const handleConvertToOrder = async (inquiry: SalesInquiry) => {
    // Find the original CustomerInquiry
    const originalInquiry = inquiries.find(ci => ci.id === inquiry.id);
    if (originalInquiry) {
      return await convertInquiryToOrder(originalInquiry);
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Customer Inquiries" 
        description="Manage and respond to customer inquiries and convert them to orders"
      />
      
      <TestDataCreator />
      
      <Card>
        <CardContent className="pt-6">
          <InquiryManagement
            inquiries={salesInquiries}
            isLoading={isLoading}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            setSearchTerm={setSearchTerm}
            setStatusFilter={(status: string) => setStatusFilter(status as "all" | "completed" | "new" | "in_progress")}
            updateInquiryStatus={updateInquiryStatus}
            convertInquiryToOrder={handleConvertToOrder}
            formatDate={formatDate}
            refreshInquiries={refreshInquiries}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesInquiriesManagement;
