
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import BatchStockInComponent from '@/components/warehouse/BatchStockInComponent';

const AdminBatchStockInPage: React.FC = () => {
  const navigate = useNavigate();
  const { stockInId } = useParams<{ stockInId?: string }>();

  return (
    <MainLayout>
      <div className="container p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/stock-in')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock In Management
        </Button>

        {/* Reuse the BatchStockInComponent */}
        <BatchStockInComponent adminMode={true} />
      </div>
    </MainLayout>
  );
};

export default AdminBatchStockInPage;
