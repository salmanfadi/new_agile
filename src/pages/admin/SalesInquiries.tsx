
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowLeft, Package } from 'lucide-react';

// Import the components we just created
import { SearchFilters } from '@/components/admin/sales-inquiries/SearchFilters';
import { InquiryList } from '@/components/admin/sales-inquiries/InquiryList';
import { InquiryDetails } from '@/components/admin/sales-inquiries/InquiryDetails';
import { useSalesInquiries } from '@/hooks/useSalesInquiries';

const SalesInquiries: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Inquiries" 
        description="Manage customer pricing inquiries"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <SearchFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Sales Inquiries
          </CardTitle>
          <CardDescription>
            Total: {inquiries?.length || 0} inquiries
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <InquiryList 
            inquiries={inquiries}
            isLoading={isLoading}
            onViewDetails={setSelectedInquiry}
            formatDate={formatDate}
          />
        </CardContent>
      </Card>

      {/* Inquiry Detail Dialog */}
      <InquiryDetails 
        inquiry={selectedInquiry}
        open={!!selectedInquiry}
        onOpenChange={(open) => !open && setSelectedInquiry(null)}
        onStatusChange={updateInquiryStatus}
        formatDate={formatDate}
      />
    </div>
  );
};

export default SalesInquiries;
