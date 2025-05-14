
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import BarcodePreview from './BarcodePreview';

interface BarcodeRecord {
  id: string;
  barcode: string;
  batch_id?: string;
  product_id?: string;
  product_name?: string;
  warehouse?: string;
  location?: string;
  created_by?: string;
  created_at?: string;
}

// Define the raw data structure returned from Supabase
interface BarcodeLogRaw {
  id: string;
  barcode: string;
  batch_id: string | null;
  details: Record<string, any> | null;
  user_id: string;
  timestamp: string;
}

// Props for the BarcodeInventoryTable component
interface BarcodeInventoryTableProps {
  batchItems?: Array<any>;
  isLoading?: boolean;
  selectedBarcodes?: string[];
  onSelectBarcode?: (barcode: string, isSelected: boolean) => void;
}

const BarcodeInventoryTable: React.FC<BarcodeInventoryTableProps> = ({
  batchItems = [],
  isLoading = false,
  selectedBarcodes = [],
  onSelectBarcode = () => {}
}) => {
  const [barcodes, setBarcodes] = useState<BarcodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    barcode: '',
    batch_id: '',
    product_id: '',
    warehouse: '',
    location: '',
    created_by: '',
  });

  // Fetch barcodes and metadata if no batch items are provided
  const fetchBarcodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barcode_logs')
        .select('id, barcode, batch_id, details, user_id, timestamp')
        .order('timestamp', { ascending: false });
        
      if (error) {
        console.error('Error fetching barcode logs:', error);
        setBarcodes([]);
      } else if (data && Array.isArray(data)) {
        console.log('Received data from barcode_logs:', data);
        
        // Transform the raw data to our expected BarcodeRecord format
        const validBarcodes = data.map((item: BarcodeLogRaw) => {
          return {
            id: item.id,
            barcode: item.barcode,
            batch_id: item.batch_id || undefined,
            product_id: item.details?.product_id || undefined,
            product_name: item.details?.product_name || undefined,
            warehouse: item.details?.warehouse || undefined,
            location: item.details?.location || undefined,
            created_by: item.user_id,
            created_at: item.timestamp
          };
        });
        
        console.log('Transformed barcodes:', validBarcodes);
        setBarcodes(validBarcodes);
      } else {
        console.warn('No data or invalid data returned from barcode_logs');
        setBarcodes([]);
      }
    } catch (err) {
      console.error('Exception fetching barcodes:', err);
      setBarcodes([]);
    }
    setLoading(false);
  };

  // Use batch items if provided, otherwise fetch from barcode_logs
  useEffect(() => {
    if (batchItems && batchItems.length > 0) {
      // Using provided batch items
      const formattedBarcodes = batchItems.map(item => ({
        id: item.id || '',
        barcode: item.barcode,
        batch_id: item.batch_id,
        product_id: item.product_id,
        product_name: item.product?.name,
        warehouse: item.warehouse?.name,
        location: item.location?.zone,
        created_by: '',
        created_at: item.created_at
      }));
      setBarcodes(formattedBarcodes);
      setLoading(false);
    } else {
      // Fetch from barcode_logs if no batch items
      fetchBarcodes();
    }
  }, [batchItems]);

  // Real-time subscription for general view
  useEffect(() => {
    if (!batchItems || batchItems.length === 0) {
      const channel = supabase
        .channel('barcode_logs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'barcode_logs' }, () => {
          fetchBarcodes();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [batchItems]);

  // Filtering
  const filteredBarcodes = useMemo(() => {
    return barcodes.filter((b) =>
      (!filters.barcode || b.barcode?.toLowerCase().includes(filters.barcode.toLowerCase())) &&
      (!filters.batch_id || b.batch_id?.toLowerCase().includes(filters.batch_id.toLowerCase())) &&
      (!filters.product_id || b.product_id?.toLowerCase().includes(filters.product_id.toLowerCase())) &&
      (!filters.warehouse || b.warehouse?.toLowerCase().includes(filters.warehouse.toLowerCase())) &&
      (!filters.location || b.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (!filters.created_by || b.created_by?.toLowerCase().includes(filters.created_by.toLowerCase()))
    );
  }, [barcodes, filters]);

  // Copy barcode
  const handleCopy = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = ['Barcode', 'Batch ID', 'Product ID', 'Product Name', 'Warehouse', 'Location', 'Created By', 'Created At'];
    const rows = filteredBarcodes.map(b => [
      b.barcode,
      b.batch_id,
      b.product_id,
      b.product_name,
      b.warehouse,
      b.location,
      b.created_by,
      b.created_at
    ]);
    const csv = [header, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barcodes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle batch item selection if in selection mode
  const handleBatchItemSelect = (barcode: string) => {
    if (onSelectBarcode) {
      const isCurrentlySelected = selectedBarcodes.includes(barcode);
      onSelectBarcode(barcode, !isCurrentlySelected);
    }
  };

  const getTableContent = () => {
    // For batch items view with selection
    if (batchItems && batchItems.length > 0) {
      return (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              {onSelectBarcode && <th className="px-2 py-1 border">Select</th>}
              <th className="px-2 py-1 border">Barcode</th>
              <th className="px-2 py-1 border">Product</th>
              <th className="px-2 py-1 border">Quantity</th>
              <th className="px-2 py-1 border">Color/Size</th>
              <th className="px-2 py-1 border">Warehouse</th>
              <th className="px-2 py-1 border">Location</th>
              <th className="px-2 py-1 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batchItems.map(item => (
              <tr key={item.id} className={selectedBarcodes.includes(item.barcode) ? "bg-blue-50" : ""}>
                {onSelectBarcode && (
                  <td className="px-2 py-1 border text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedBarcodes.includes(item.barcode)}
                      onChange={() => handleBatchItemSelect(item.barcode)}
                      className="h-4 w-4"
                    />
                  </td>
                )}
                <td className="px-2 py-1 border font-mono">
                  <div className="flex items-center gap-2">
                    {item.barcode}
                    <BarcodePreview barcode={item.barcode} width={100} height={30} scale={1} />
                  </div>
                </td>
                <td className="px-2 py-1 border">{item.product?.name || '-'}</td>
                <td className="px-2 py-1 border">{item.quantity}</td>
                <td className="px-2 py-1 border">
                  {item.color && <span className="mr-1">{item.color}</span>}
                  {item.size && <span>{item.size}</span>}
                  {!item.color && !item.size && '-'}
                </td>
                <td className="px-2 py-1 border">{item.warehouse?.name || '-'}</td>
                <td className="px-2 py-1 border">
                  {item.location?.zone ? `${item.location.zone} (Floor ${item.location.floor})` : '-'}
                </td>
                <td className="px-2 py-1 border">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleCopy(item.barcode)} 
                    title="Copy barcode"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    
    // For general barcodes view
    return (
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 border">Barcode</th>
            <th className="px-2 py-1 border">Batch ID</th>
            <th className="px-2 py-1 border">Product ID</th>
            <th className="px-2 py-1 border">Product Name</th>
            <th className="px-2 py-1 border">Warehouse</th>
            <th className="px-2 py-1 border">Location</th>
            <th className="px-2 py-1 border">Created By</th>
            <th className="px-2 py-1 border">Created At</th>
            <th className="px-2 py-1 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBarcodes.map(b => (
            <tr key={b.id}>
              <td className="px-2 py-1 border font-mono">
                <div className="flex items-center gap-2">
                  <span>{b.barcode}</span>
                  <BarcodePreview barcode={b.barcode} width={100} height={40} scale={1} />
                </div>
              </td>
              <td className="px-2 py-1 border">{b.batch_id}</td>
              <td className="px-2 py-1 border">{b.product_id}</td>
              <td className="px-2 py-1 border">{b.product_name}</td>
              <td className="px-2 py-1 border">{b.warehouse}</td>
              <td className="px-2 py-1 border">{b.location}</td>
              <td className="px-2 py-1 border">{b.created_by}</td>
              <td className="px-2 py-1 border">{b.created_at ? new Date(b.created_at).toLocaleString() : ''}</td>
              <td className="px-2 py-1 border">
                <Button size="icon" variant="ghost" onClick={() => handleCopy(b.barcode)} title="Copy barcode">
                  <Copy className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      {/* Only show filters in general view */}
      {(!batchItems || batchItems.length === 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Input placeholder="Barcode" value={filters.barcode} onChange={e => setFilters(f => ({ ...f, barcode: e.target.value }))} className="w-32" />
          <Input placeholder="Batch ID" value={filters.batch_id} onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))} className="w-32" />
          <Input placeholder="Product ID" value={filters.product_id} onChange={e => setFilters(f => ({ ...f, product_id: e.target.value }))} className="w-32" />
          <Input placeholder="Warehouse" value={filters.warehouse} onChange={e => setFilters(f => ({ ...f, warehouse: e.target.value }))} className="w-32" />
          <Input placeholder="Location" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="w-32" />
          <Input placeholder="Created By" value={filters.created_by} onChange={e => setFilters(f => ({ ...f, created_by: e.target.value }))} className="w-32" />
          <Button variant="outline" onClick={handleExportCSV} className="ml-auto">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      )}

      {isLoading || loading ? (
        <div className="text-center py-8">Loading barcodes...</div>
      ) : filteredBarcodes.length === 0 && (!batchItems || batchItems.length === 0) ? (
        <div className="text-center py-8 text-gray-500">No barcodes found.</div>
      ) : batchItems && batchItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No batch items available.</div>
      ) : (
        <div className="overflow-x-auto">
          {getTableContent()}
        </div>
      )}
    </div>
  );
};

export default BarcodeInventoryTable;
