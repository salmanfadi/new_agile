
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import BarcodePreview from './BarcodePreview';
import jsPDF from 'jspdf';
import bwipjs from 'bwip-js';

interface BarcodeBox {
  id: string;
  barcode: string;
  product_name: string;
  sku: string;
  quantity: number;
}

const BarcodePrinter: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Fetch product categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .order('category');
        
      if (error) throw error;
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
        .filter(Boolean)
        .sort() as string[];
      
      return uniqueCategories;
    },
  });

  // Fetch boxes for selected category
  const { data: boxes, isLoading: boxesLoading } = useQuery({
    queryKey: ['category-boxes', selectedCategory],
    enabled: !!selectedCategory,
    queryFn: async () => {
      // First get products in the category
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('category', selectedCategory);

      if (productError) throw productError;
      if (!products.length) return [];

      // Then get inventory items for these products
      const productIds = products.map(p => p.id);
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, barcode, product_id, quantity')
        .in('product_id', productIds)
        .eq('status', 'available');

      if (inventoryError) throw inventoryError;

      // Map inventory to include product details
      return inventory.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          id: item.id,
          barcode: item.barcode,
          product_name: product.name,
          sku: product.sku,
          quantity: item.quantity
        };
      });
    }
  });

  // Generate PDF with barcode labels
  const handleGeneratePDF = async () => {
    if (!boxes || boxes.length === 0) {
      toast({
        title: "No boxes to print",
        description: "There are no boxes available for the selected category.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Define label dimensions (Avery 5160 or similar)
      const labelWidth = 63.5; // mm
      const labelHeight = 25.4; // mm
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // mm
      const labelsPerRow = 3;
      const labelsPerCol = 10;

      // For each box, create a label
      boxes.forEach((box, index) => {
        // Calculate position for this label
        const row = Math.floor(index / labelsPerRow);
        const col = index % labelsPerRow;
        
        // If we need a new page
        if (row >= labelsPerCol && row % labelsPerCol === 0 && col === 0) {
          doc.addPage();
        }
        
        // Calculate position on current page
        const actualRow = row % labelsPerCol;
        const x = margin + (col * labelWidth);
        const y = margin + (actualRow * labelHeight);

        // Generate barcode image using bwip-js (client-side rendering)
        // We'll use a temporary canvas
        const canvas = document.createElement('canvas');
        try {
          bwipjs.toCanvas(canvas, {
            bcid: 'code128',
            text: box.barcode,
            scale: 2,
            height: 10,
            includetext: false,
          });
          
          // Add barcode image to PDF
          doc.addImage(
            canvas.toDataURL('image/png'), 
            'PNG', 
            x + 5, 
            y + 3, 
            labelWidth - 10, 
            10
          );
        } catch (error) {
          console.error('Error generating barcode for PDF:', error);
        }
        
        // Add text details
        doc.setFontSize(8);
        doc.text(box.barcode, x + labelWidth/2, y + 15, { align: 'center' });
        doc.text(`Product: ${box.product_name}`, x + 5, y + 18);
        doc.text(`SKU: ${box.sku}`, x + 5, y + 21);
        doc.text(`Box ID: ${box.id.substring(0, 8)}...`, x + 5, y + 24);
        doc.text(`Qty: ${box.quantity}`, x + labelWidth - 15, y + 24);
      });

      // Save the PDF
      doc.save(`barcode-labels-${selectedCategory}.pdf`);

      // Log the printing action
      if (user?.id) {
        for (const box of boxes) {
          await supabase.from('barcode_logs').insert({
            barcode: box.barcode,
            action: 'printed',
            user_id: user.id,
            timestamp: new Date().toISOString(),
            details: { method: 'pdf-export' }
          });
        }
      }

      toast({
        title: "Success",
        description: `Generated barcode labels for ${boxes.length} boxes.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate barcode labels.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Print Barcodes</CardTitle>
        <CardDescription>Generate and print barcode labels by product category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Select Product Category</label>
          <Select
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>Loading categories...</SelectItem>
              ) : categories && categories.length > 0 ? (
                categories.map((category, index) => (
                  <SelectItem key={index} value={category}>
                    {category}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No categories available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Available Boxes</h3>
              <span className="text-xs text-muted-foreground">
                {boxesLoading ? 'Loading...' : boxes ? `${boxes.length} boxes found` : '0 boxes'}
              </span>
            </div>
            {boxesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : boxes && boxes.length > 0 ? (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                <div className="divide-y">
                  {boxes.map((box) => (
                    <div key={box.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{box.product_name}</div>
                        <div className="text-sm text-gray-500">SKU: {box.sku} • Qty: {box.quantity}</div>
                        <div className="text-sm text-gray-400 mt-1">{box.barcode}</div>
                      </div>
                      <div className="ml-4">
                        <BarcodePreview barcode={box.barcode} width={100} height={40} scale={1.5} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-md">
                No boxes available for this category
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGeneratePDF}
          disabled={!selectedCategory || boxesLoading || (boxes && boxes.length === 0) || generating}
          className="w-full"
        >
          {generating ? (
            <>Generating PDF...</>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" /> Generate Barcode Labels PDF
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BarcodePrinter;
