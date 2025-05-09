
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';

const AdminBatchStockInPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Reuse the Warehouse Manager BatchStockInPage component */}
      <BatchStockInPage />
    </div>
  );
};

export default AdminBatchStockInPage;
