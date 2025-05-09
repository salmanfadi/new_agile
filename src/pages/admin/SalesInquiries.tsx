
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesInquiry } from '@/types/database';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Package, Search } from 'lucide-react';

const SalesInquiries: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);

  // Fetch sales inquiries
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['sales-inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_inquiries')
        .select(`
          *,
          items:sales_inquiry_items(
            *,
            product:product_id(name, description)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as SalesInquiry[];
    },
  });

  // Filter inquiries based on search term and status filter
  const filteredInquiries = React.useMemo(() => {
    if (!inquiries) return [];
    
    return inquiries.filter(inquiry => {
      const matchesSearch = !searchTerm || 
        inquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customer_company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || inquiry.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, statusFilter]);

  // Handle status change
  const updateInquiryStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('sales_inquiries')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }

    // Update the local state
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry({
        ...selectedInquiry,
        status: status as 'new' | 'in_progress' | 'completed'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">New</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Inquiries" 
        description="Manage customer pricing inquiries"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Sales Inquiries
          </CardTitle>
          <CardDescription>
            Total: {filteredInquiries?.length || 0} inquiries
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sales inquiries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>{formatDate(inquiry.created_at)}</TableCell>
                      <TableCell className="font-medium">{inquiry.customer_name}</TableCell>
                      <TableCell>{inquiry.customer_company}</TableCell>
                      <TableCell>{inquiry.customer_email}</TableCell>
                      <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                      <TableCell>{inquiry.items?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedInquiry(inquiry)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inquiry Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedInquiry && formatDate(selectedInquiry.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-500 text-sm">Name:</span>
                      <span className="col-span-2">{selectedInquiry.customer_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-500 text-sm">Company:</span>
                      <span className="col-span-2">{selectedInquiry.customer_company}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-500 text-sm">Email:</span>
                      <span className="col-span-2">{selectedInquiry.customer_email}</span>
                    </div>
                    {selectedInquiry.customer_phone && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500 text-sm">Phone:</span>
                        <span className="col-span-2">{selectedInquiry.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">Inquiry Status</h3>
                  <div className="flex items-center space-x-3">
                    <Select
                      value={selectedInquiry.status}
                      onValueChange={(value) => updateInquiryStatus(selectedInquiry.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {getStatusBadge(selectedInquiry.status)}
                  </div>
                </div>
              </div>
              
              {selectedInquiry.message && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Additional Message</h3>
                  <p className="bg-gray-50 p-3 rounded-md text-gray-700">
                    {selectedInquiry.message}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-sm mb-2">Requested Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Requirements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInquiry.items && selectedInquiry.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {item.product?.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.specific_requirements || 
                            <span className="text-gray-400 italic">None specified</span>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesInquiries;
