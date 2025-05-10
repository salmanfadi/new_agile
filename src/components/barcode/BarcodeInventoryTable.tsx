import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';

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

const BarcodeInventoryTable: React.FC = () => {
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

  // Fetch barcodes and metadata
  const fetchBarcodes = async () => {
    setLoading(true);
    // Example: join barcode_logs with inventory/products/warehouses for metadata
    const { data, error } = await supabase
      .from('barcode_logs')
      .select(`
        id,
        barcode,
        details->>batch_id as batch_id,
        details->>product_id as product_id,
        details->>product_name as product_name,
        details->>warehouse as warehouse,
        details->>location as location,
        user_id as created_by,
        created_at
      `)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setBarcodes(data);
    }
    setLoading(false);
  };

  // Real-time subscription
  useEffect(() => {
    fetchBarcodes();
    const channel = supabase
      .channel('barcode_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcode_logs' }, () => {
        fetchBarcodes();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex flex-wrap gap-2 mb-4">
        <Input placeholder="Barcode" value={filters.barcode} onChange={e => setFilters(f => ({ ...f, barcode: e.target.value }))} className="w-32" />
        <Input placeholder="Batch ID" value={filters.batch_id} onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))} className="w-32" />
        <Input placeholder="Product ID" value={filters.product_id} onChange={e => setFilters(f => ({ ...f, product_id: e.target.value }))} className="w-32" />
        <Input placeholder="Warehouse" value={filters.warehouse} onChange={e => setFilters(f => ({ ...f, warehouse: e.target.value }))} className="w-32" />
        <Input placeholder="Location" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="w-32" />
        <Input placeholder="Created By" value={filters.created_by} onChange={e => setFilters(f => ({ ...f, created_by: e.target.value }))} className="w-32" />
        <Button variant="outline" onClick={handleExportCSV} className="ml-auto"><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading barcodes...</div>
      ) : filteredBarcodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No barcodes found.</div>
      ) : (
        <div className="overflow-x-auto">
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
                      {/* Barcode preview (SVG or image) could go here */}
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
                    <Button size="icon" variant="ghost" onClick={() => handleCopy(b.barcode)} title="Copy barcode"><Copy className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BarcodeInventoryTable; 