
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for submissions
const mockStockIn = [
  { id: 1, product: 'LED Wall Clock', boxes: 10, timestamp: '2025-05-01 10:30 AM', status: 'pending' },
  { id: 2, product: 'Desktop Clock', boxes: 5, timestamp: '2025-04-30 09:45 AM', status: 'processed' },
  { id: 3, product: 'Wall Clock', boxes: 7, timestamp: '2025-04-29 02:15 PM', status: 'processed' },
];

const mockStockOut = [
  { id: 1, product: 'LED Wall Clock', quantity: 20, destination: 'ABC Store, 123 Main St', status: 'pending' },
  { id: 2, product: 'Table Clock', quantity: 15, destination: 'XYZ Store, 456 Oak Ave', status: 'approved' },
  { id: 3, product: 'Alarm Clock', quantity: 10, destination: 'PQR Store, 789 Pine Rd', status: 'rejected' },
  { id: 4, product: 'Wall Clock', quantity: 25, destination: 'LMN Store, 101 Cedar Ln', status: 'completed' },
];

const MySubmissions: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock-in');
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Submissions" 
        description="View history of Stock In and Stock Out requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/operator')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <Tabs defaultValue="stock-in" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock-in">Stock In</TabsTrigger>
          <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock-in">
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Boxes</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockStockIn.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product}</TableCell>
                        <TableCell>{item.boxes}</TableCell>
                        <TableCell>{item.timestamp}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status as any} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock-out">
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockStockOut.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.destination}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status as any} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MySubmissions;
