
import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import BatchStockInComponent from '@/components/warehouse/BatchStockInComponent';

const BatchStockInPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <BatchStockInComponent />
      </div>
    </MainLayout>
  );
};

export default BatchStockInPage;
