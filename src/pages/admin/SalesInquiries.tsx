
import React, { useState } from 'react';
import { InquiryList } from '@/components/admin/sales-inquiries/InquiryList';
import { SearchFilters } from '@/components/admin/sales-inquiries/SearchFilters';
import { InquiryDetails } from '@/components/admin/sales-inquiries/InquiryDetails';
import { useSalesInquiries } from '@/hooks/useSalesInquiries';
import { PageHeader } from '@/components/ui/PageHeader';

const SalesInquiries = () => {
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
    refreshInquiries
  } = useSalesInquiries();

  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setShowDetails(true);
  };

  const handleStatusUpdate = async (id: string, status: 'new' | 'in_progress' | 'completed') => {
    const success = await updateInquiryStatus(id, status);
    if (success) {
      refreshInquiries();
    }
    return success;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status as 'all' | 'new' | 'in_progress' | 'completed');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Sales Inquiries" description="Manage incoming sales inquiries" />

      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilterChange}
      />

      <InquiryList
        inquiries={inquiries}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        formatDate={formatDate}
      />

      <InquiryDetails
        inquiry={selectedInquiry}
        open={showDetails}
        onOpenChange={setShowDetails}
        onStatusChange={handleStatusUpdate}
        formatDate={formatDate}
      />
    </div>
  );
};

export default SalesInquiries;
