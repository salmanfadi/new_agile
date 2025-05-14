
import React from 'react';
import { useParams } from 'react-router-dom';
import { StockInDetailView } from '@/components/warehouse/StockInDetailView';
import { StockInApprovalForm } from '@/components/warehouse/StockInApprovalForm';
import { useStockInProcessing } from '@/hooks/useStockInProcessing';

const ProcessStockInPage: React.FC = () => {
  const { stockInId } = useParams<{ stockInId: string }>();
  
  const {
    stockInData,
    currentStockIn,
    details,
    approvalNotes,
    setApprovalNotes,
    handleApproval,
    isSubmitting,
    navigate
  } = useStockInProcessing(stockInId);

  if (stockInData.loading) {
    return <div>Loading stock in details...</div>;
  }

  if (stockInData.error) {
    return <div>Error: {stockInData.error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Process Stock In</h1>
      
      {currentStockIn && (
        <StockInDetailView
          stockIn={currentStockIn}
          details={details}
          isLoading={stockInData.loading}
        />
      )}
      
      <StockInApprovalForm
        approvalNotes={approvalNotes}
        setApprovalNotes={setApprovalNotes}
        onApprove={() => handleApproval(true)}
        onReject={() => handleApproval(false)}
        onCancel={() => navigate('/manager/stock-in')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ProcessStockInPage;
