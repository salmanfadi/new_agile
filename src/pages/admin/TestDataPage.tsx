
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TestDataGenerator } from '@/components/dev/TestDataGenerator';

const TestDataPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <PageHeader
        title="Test Data Generation"
        description="Create sample data to test all aspects of the inventory management system"
      />
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">About Test Data</h2>
          <div className="prose prose-slate max-w-none">
            <p>
              This utility creates a comprehensive set of test data to help identify issues in the 
              inventory management system. It will generate:
            </p>
            
            <ul>
              <li>
                <strong>Base Data:</strong> Warehouses, locations, and products to form the foundation of the system.
              </li>
              <li>
                <strong>Stock-In Requests:</strong> Various requests in different states (pending, approved, processing, completed).
              </li>
              <li>
                <strong>Inventory Items:</strong> Processed items from completed stock-ins with different statuses.
              </li>
              <li>
                <strong>Transfers:</strong> Movement of inventory between warehouse locations.
              </li>
            </ul>
            
            <p>
              After generating the data, navigate through the application to test:
            </p>
            
            <ol>
              <li>Inventory listing and filtering</li>
              <li>Stock-in request processing</li>
              <li>Inventory transfer functionality</li>
              <li>Barcode scanning and lookup</li>
              <li>Report generation</li>
            </ol>
            
            <p>
              This test data is designed to surface potential issues in:
            </p>
            
            <ul>
              <li>Data consistency across related tables</li>
              <li>Processing flow from stock-in to inventory</li>
              <li>UI rendering with varied data values</li>
              <li>System performance with multiple records</li>
            </ul>
          </div>
        </div>
        
        <div>
          <TestDataGenerator />
        </div>
      </div>
    </div>
  );
};

export default TestDataPage;
