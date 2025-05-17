
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateTestData } from '@/utils/generateTestData';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const TestDataGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCounts, setGeneratedCounts] = useState<{
    warehouses?: number;
    locations?: number;
    products?: number;
    stockIns?: number;
    inventory?: number;
    batches?: number;
    transfers?: number;
  }>({});
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const handleGenerateData = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to generate test data.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setIsComplete(false);
    
    try {
      const result = await generateTestData(user.id);
      
      setGeneratedCounts({
        warehouses: result.warehouses.length,
        locations: result.locations.length,
        products: result.products.length,
        stockIns: result.stockIns.length,
        inventory: result.inventoryItems.length,
        batches: result.batches.length,
        transfers: Math.floor(result.inventoryItems.length * 0.2) // Approximate
      });
      
      setIsComplete(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      
      toast({
        title: 'Test Data Generated',
        description: 'The test data has been successfully created.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error Generating Test Data',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleReset = () => {
    setIsComplete(false);
    setGeneratedCounts({});
    setError(null);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Test Data Generator
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-slate-500 mb-4">
          This utility will generate test data for the inventory management system, including warehouses,
          products, stock-ins, and inventory items.
        </p>
        
        {isComplete && !error && (
          <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Data Generated Successfully</span>
            </div>
            <div className="text-sm text-green-700 ml-6">
              <ul className="space-y-1 list-disc pl-4">
                <li>{generatedCounts.warehouses} warehouses</li>
                <li>{generatedCounts.locations} locations</li>
                <li>{generatedCounts.products} products</li>
                <li>{generatedCounts.stockIns} stock-in requests</li>
                <li>{generatedCounts.batches} batches</li>
                <li>{generatedCounts.inventory} inventory items</li>
                <li>{generatedCounts.transfers} transfers</li>
              </ul>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Error Generating Data</span>
            </div>
            <p className="text-sm text-red-700 ml-6">{error}</p>
          </div>
        )}
        
        <div className="text-sm text-slate-500">
          <p className="font-medium mb-1">This will create:</p>
          <ul className="space-y-1 list-disc pl-5">
            <li>3 warehouses with multiple locations</li>
            <li>5 product types</li>
            <li>Multiple stock-in requests in various states</li>
            <li>Processed inventory with different statuses</li>
            <li>Inventory transfers between locations</li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-3">
        {isComplete && !isGenerating ? (
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        ) : (
          <Button 
            onClick={handleGenerateData} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Generating Data...
              </>
            ) : (
              'Generate Test Data'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
