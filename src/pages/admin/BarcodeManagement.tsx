
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BarcodePrinter from '@/components/barcode/BarcodePrinter';

const BarcodeManagement: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Management" 
        description="Generate and print barcodes for inventory items"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="max-w-xl mx-auto">
        <BarcodePrinter />
      </div>
    </div>
  );
};

export default BarcodeManagement;
