
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBatchItems } from '@/hooks/useBatchItems';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchItem } from '@/types/barcode';
import BarcodePreview from '@/components/barcode/BarcodePreview';

// Update imports if jspdf is needed
// import jsPDF from 'jspdf';

const BarcodePrintPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { data: batchItems, isLoading, error } = useBatchItems(batchId);
  
  const [selectedBarcodes, setSelectedBarcodes] = useState<BatchItem[]>([]);
  const [printLayout, setPrintLayout] = useState<'labels' | 'sheet'>('labels');
  
  // When data loads, select all barcodes by default
  useEffect(() => {
    if (batchItems && batchItems.length > 0) {
      setSelectedBarcodes(batchItems);
    }
  }, [batchItems]);
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const toggleBarcodeSelection = (barcode: BatchItem) => {
    const isSelected = selectedBarcodes.some(item => item.id === barcode.id);
    
    if (isSelected) {
      setSelectedBarcodes(selectedBarcodes.filter(item => item.id !== barcode.id));
    } else {
      setSelectedBarcodes([...selectedBarcodes, barcode]);
    }
  };
  
  const selectAllBarcodes = () => {
    setSelectedBarcodes(batchItems || []);
  };
  
  const clearSelection = () => {
    setSelectedBarcodes([]);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportPDF = () => {
    // Commented out since jsPDF might not be installed
    /*
    const doc = new jsPDF();
    let yPos = 20;
    
    // Add header
    doc.setFontSize(18);
    doc.text('Batch Barcodes', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Add batch info
    doc.setFontSize(12);
    doc.text(`Batch ID: ${batchId}`, 20, yPos);
    yPos += 10;
    doc.text(`Total Items: ${selectedBarcodes.length}`, 20, yPos);
    yPos += 20;
    
    // Add barcodes
    selectedBarcodes.forEach((item, index) => {
      // Add new page if needed
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`Code: ${item.barcode}`, 20, yPos);
      
      if (item.color || item.size) {
        let details = '';
        if (item.color) details += `Color: ${item.color} `;
        if (item.size) details += `Size: ${item.size}`;
        doc.text(details, 20, yPos + 5);
      }
      
      yPos += 30;
    });
    
    doc.save(`batch-${batchId}-barcodes.pdf`);
    */
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader 
          title="Barcode Print Page" 
          description="Loading batch barcodes..."
        />
        <div className="flex justify-center mt-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader 
          title="Error" 
          description="Failed to load batch barcodes"
        />
        <div className="bg-red-50 border border-red-200 rounded p-4 mt-6">
          <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button variant="outline" onClick={handleGoBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PageHeader 
          title="Print Barcodes" 
          description={`${batchItems?.length || 0} barcodes available for printing`}
        />
      </div>
      
      <div className="flex justify-between mb-6">
        <div>
          <Button variant="outline" onClick={selectAllBarcodes} className="mr-2">
            Select All
          </Button>
          <Button variant="outline" onClick={clearSelection} disabled={selectedBarcodes.length === 0}>
            Clear Selection
          </Button>
        </div>
        <div>
          <Button 
            variant="default" 
            onClick={handlePrint}
            disabled={selectedBarcodes.length === 0}
            className="mr-2"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Selected ({selectedBarcodes.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={selectedBarcodes.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="labels" onValueChange={(value) => setPrintLayout(value as 'labels' | 'sheet')}>
        <TabsList>
          <TabsTrigger value="labels">Label Mode</TabsTrigger>
          <TabsTrigger value="sheet">Sheet Mode</TabsTrigger>
        </TabsList>
        
        <TabsContent value="labels" className="print:block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchItems?.map((item) => (
              <Card 
                key={item.id}
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedBarcodes.some(selected => selected.id === item.id)
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
                onClick={() => toggleBarcodeSelection(item)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-center mb-2">
                    <BarcodePreview 
                      barcode={item.barcode}
                      height={100}
                    />
                  </div>
                  <div className="text-center text-sm">
                    <div className="font-mono mb-1">{item.barcode}</div>
                    <div className="text-xs text-gray-500">
                      {item.color && <span className="mr-2">Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="text-xs mt-1">Qty: {item.quantity}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="sheet" className="print:block">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 print:gap-0">
            {batchItems?.map((item) => (
              <div 
                key={item.id}
                className={`border p-2 print:border-0 ${
                  selectedBarcodes.some(selected => selected.id === item.id)
                    ? 'bg-blue-50 print:bg-transparent'
                    : ''
                }`}
                onClick={() => toggleBarcodeSelection(item)}
              >
                <div className="flex justify-center">
                  <BarcodePreview 
                    barcode={item.barcode}
                    height={50}
                  />
                </div>
                <div className="text-center text-xs">
                  <div className="font-mono mt-1">{item.barcode}</div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>{item.color || '-'}</span>
                    <span>{item.size || '-'}</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Print-only section that won't display on screen */}
      <div className="hidden print:block mt-8">
        <h2 className="text-xl font-semibold mb-2">Batch Barcodes</h2>
        <p className="mb-4">Batch ID: {batchId}</p>
        <p className="mb-4">Total Items: {selectedBarcodes.length}</p>
        
        <div className={`grid ${
          printLayout === 'labels' 
            ? 'grid-cols-2' 
            : 'grid-cols-3'
        } gap-4`}>
          {selectedBarcodes.map((item) => (
            <div key={item.id} className="border p-4 text-center">
              <BarcodePreview 
                barcode={item.barcode}
                height={printLayout === 'labels' ? 100 : 60}
              />
              <div className="font-mono mt-2">{item.barcode}</div>
              <div className="flex justify-between text-xs mt-1">
                <span>{item.color || '-'}</span>
                <span>{item.size || '-'}</span>
                <span>Qty: {item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarcodePrintPage;
