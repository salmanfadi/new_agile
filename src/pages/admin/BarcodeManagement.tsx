
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodePrinter from '@/components/barcode/BarcodePrinter';
import BarcodeGenerator from '@/components/barcode/BarcodeGenerator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { NotificationsList } from '@/components/notification/NotificationsList';

const BarcodeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('generator');
  
  // Only allow admins and warehouse managers to access this page
  if (user?.role !== 'admin' && user?.role !== 'warehouse_manager') {
    navigate('/unauthorized');
    return null;
  }

  const handleBarcodeGenerated = (barcode: string) => {
    toast({
      title: "Barcode Generated",
      description: `Generated barcode: ${barcode}`
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Management" 
        description="Generate, print and manage barcodes for inventory items"
      />
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/manager')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        {/* Only admins can see all notifications */}
        {user?.role === 'admin' && (
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('notifications')}
          >
            View Notification History
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="generator">Single Barcode Generator</TabsTrigger>
          <TabsTrigger value="printer">Bulk Generate by Category</TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="generator" className="max-w-xl mx-auto">
          <div className="bg-muted/30 p-6 rounded-lg">
            <BarcodeGenerator 
              productName="" 
              productSku="" 
              category="" 
              onGenerateBarcode={handleBarcodeGenerated} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="printer">
          <BarcodePrinter />
        </TabsContent>
        
        {user?.role === 'admin' && (
          <TabsContent value="notifications">
            <NotificationsList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BarcodeManagement;
