
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BarcodeGenerator } from '@/components/barcode/BarcodeGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { BarcodePreview } from '@/components/barcode/BarcodePreview';
import { BarcodePrinter } from '@/components/barcode/BarcodePrinter';
import { QrCode, Barcode, Printer } from 'lucide-react';

const barcodeSchema = z.object({
  type: z.enum(['code128', 'qrcode', 'datamatrix', 'ean13']),
  value: z.string().min(1, 'Barcode value is required'),
  labelPosition: z.enum(['bottom', 'top', 'none']),
  displayValue: z.boolean(),
  showLabel: z.boolean(),
  width: z.number().min(1).max(5),
  height: z.number().min(20).max(200),
  fontSize: z.number().min(6).max(24),
  quantity: z.number().int().min(1).max(100)
});

type BarcodeFormValues = z.infer<typeof barcodeSchema>;

const defaultValues: BarcodeFormValues = {
  type: 'code128',
  value: 'BC123456789',
  labelPosition: 'bottom',
  displayValue: true,
  showLabel: true,
  width: 2,
  height: 80,
  fontSize: 12,
  quantity: 1
};

const BarcodeManagement: React.FC = () => {
  const [generatedBarcodes, setGeneratedBarcodes] = useState<string[]>([]);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  
  const form = useForm<BarcodeFormValues>({
    resolver: zodResolver(barcodeSchema),
    defaultValues
  });
  
  const { watch } = form;
  
  // Watch form values for live preview
  const barcodeType = watch('type');
  const barcodeValue = watch('value');
  const labelPosition = watch('labelPosition');
  const displayValue = watch('displayValue');
  const showLabel = watch('showLabel');
  const width = watch('width');
  const height = watch('height');
  const fontSize = watch('fontSize');
  const quantity = watch('quantity');
  
  const handleGenerate = (values: BarcodeFormValues) => {
    console.log('Generating barcodes with:', values);
    
    // Generate an array of barcodes based on quantity
    const barcodes = Array.from({ length: values.quantity }, (_, index) => {
      // If quantity > 1, append a suffix to make them unique
      const suffix = values.quantity > 1 ? `-${index + 1}` : '';
      return `${values.value}${suffix}`;
    });
    
    setGeneratedBarcodes(barcodes);
    setIsPrinterOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Management" 
        description="Generate, preview, and print barcodes for inventory items"
      />
      
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="generate">
            <Barcode className="h-4 w-4 mr-2" /> Generate
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <QrCode className="h-4 w-4 mr-2" /> Bulk Generation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Barcode Options</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a barcode type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="code128">Code 128</SelectItem>
                              <SelectItem value="qrcode">QR Code</SelectItem>
                              <SelectItem value="datamatrix">Data Matrix</SelectItem>
                              <SelectItem value="ean13">EAN-13</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode Value</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter value to encode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="labelPosition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label Position</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Label position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bottom">Bottom</SelectItem>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size: {field.value}px</FormLabel>
                            <FormControl>
                              <Slider
                                min={6}
                                max={24}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={0.5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height: {field.value}px</FormLabel>
                            <FormControl>
                              <Slider
                                min={20}
                                max={200}
                                step={10}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="displayValue"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="accent-primary h-4 w-4"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Show Code
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="showLabel"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="accent-primary h-4 w-4"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Show Label
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="100"
                                value={field.value}
                                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      <Printer className="h-4 w-4 mr-2" />
                      Generate & Print
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                <BarcodePreview
                  type={barcodeType}
                  value={barcodeValue || 'BC123456789'}
                  options={{
                    format: barcodeType,
                    width,
                    height,
                    displayValue,
                    text: showLabel ? barcodeValue : undefined,
                    textPosition: labelPosition,
                    fontSize
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Barcode Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input id="prefix" placeholder="BC" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Starting Number</Label>
                    <Input id="start" type="number" placeholder="1000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count">Number of Barcodes</Label>
                    <Input id="count" type="number" placeholder="100" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="digits">Number of Digits</Label>
                  <Input id="digits" type="number" placeholder="6" />
                  <p className="text-sm text-muted-foreground">
                    Example: BC000001, BC000002, etc.
                  </p>
                </div>
                
                <Button className="w-full" disabled>
                  <QrCode className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {isPrinterOpen && generatedBarcodes.length > 0 && (
        <BarcodePrinter
          open={isPrinterOpen}
          onOpenChange={setIsPrinterOpen}
          barcodes={generatedBarcodes}
          batchItems={[]}
        />
      )}
    </div>
  );
};

export default BarcodeManagement;
