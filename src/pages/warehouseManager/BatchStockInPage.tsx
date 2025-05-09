
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import BatchStockInComponent from '@/components/warehouse/BatchStockInComponent';

const BatchStockInPage: React.FC = () => {
  const navigate = useNavigate();
  const { stockInId } = useParams<{ stockInId?: string }>();

  return (
    <MainLayout>
      <div className="container p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manager/stock-in')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock In Processing
        </Button>

        <BatchStockInComponent />
      </div>
    </MainLayout>
  );
};

export default BatchStockInPage;
