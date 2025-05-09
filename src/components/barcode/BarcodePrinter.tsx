
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
import { Printer, Download, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import BarcodePreview from './BarcodePreview';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import jsPDF from 'jspdf';
import bwipjs from 'bwip-js';
import { v4 as uuidv4 } from 'uuid';

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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  // Fetch products by selected category with pagination
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', selectedCategory, page],
    enabled: !!selectedCategory,
    queryFn: async () => {
      const { data: products, error: productError, count } = await supabase
        .from('products')
        .select('id, name, sku, category', { count: 'exact' })
        .eq('category', selectedCategory)
        .eq('is_active', true)
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (productError) throw productError;
      if (!products.length) return { products: [], count: 0 };

      return { products, count };
    }
  });

  // Create notification for barcode generation
  const createNotificationMutation = useMutation({
    mutationFn: async ({
      user_id,
      role,
      action_type,
      metadata
    }: {
      user_id: string;
      role: string;
      action_type: string;
      metadata: any;
    }) => {
      const { error } = await supabase.from('notifications').insert({
        user_id,
        role,
        action_type,
        metadata
      });
      
      if (error) throw error;
    },
    onError: (error) => {
      console.error('Error creating notification:', error);
    }
  });

  // Generate PDF with barcode labels
  const handleGeneratePDF = async () => {
    if (!products || products.products.length === 0) {
      toast({
        title: "No products to print",
        description: "There are no products available for the selected category.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    const batchId = uuidv4();

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

      // For each product, create a barcode label
      products.products.forEach((product, index) => {
        const barcode = generateBarcodeString(
          product.category || 'MISC',
          product.sku || product.name.substring(0, 6).toUpperCase().replace(/\s+/g, ''),
          index + 1
        );

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
            text: barcode,
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
        doc.text(barcode, x + labelWidth/2, y + 15, { align: 'center' });
        doc.text(`Product: ${product.name.substring(0, 20)}`, x + 5, y + 18);
        doc.text(`SKU: ${product.sku || 'N/A'}`, x + 5, y + 21);
        doc.text(`Category: ${product.category}`, x + 5, y + 24);

        // Log the barcode generation
        if (user?.id) {
          supabase.from('barcode_logs').insert({
            barcode: barcode,
            action: 'generated',
            user_id: user.id,
            event_type: 'barcode_generated',
            batch_id: batchId,
            timestamp: new Date().toISOString(),
            details: { 
              product_id: product.id,
              product_name: product.name,
              category: product.category,
              method: 'bulk-generation'
            }
          }).then(null);
        }
      });

      // Save the PDF
      doc.save(`barcode-labels-${selectedCategory}.pdf`);

      // Create notification for the bulk generation
      if (user?.id) {
        createNotificationMutation.mutate({
          user_id: user.id,
          role: user.role,
          action_type: 'barcode_generated',
          metadata: {
            category: selectedCategory,
            count: products.products.length,
            product_ids: products.products.map(p => p.id),
            batch_id: batchId
          }
        });
      }

      toast({
        title: "Success",
        description: `Generated barcode labels for ${products.products.length} products.`,
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

  // Handle pagination
  const totalPages = products?.count ? Math.ceil(products.count / PAGE_SIZE) : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Generate Barcodes</CardTitle>
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
              <h3 className="text-sm font-medium">Available Products</h3>
              <span className="text-xs text-muted-foreground">
                {productsLoading ? 'Loading...' : products ? `${products.count || 0} products found` : '0 products'}
              </span>
            </div>
            {productsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : products && products.products.length > 0 ? (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                <div className="divide-y">
                  {products.products.map((product) => (
                    <div key={product.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku || 'N/A'} • Category: {product.category}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {generateBarcodeString(
                            product.category || 'MISC',
                            product.sku || product.name.substring(0, 6).toUpperCase().replace(/\s+/g, ''),
                            1
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <BarcodePreview 
                          barcode={generateBarcodeString(
                            product.category || 'MISC',
                            product.sku || product.name.substring(0, 6).toUpperCase().replace(/\s+/g, ''),
                            1
                          )} 
                          width={100} 
                          height={40} 
                          scale={1.5} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-md">
                No products available for this category
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGeneratePDF}
          disabled={!selectedCategory || productsLoading || (products && products.products.length === 0) || generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
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
