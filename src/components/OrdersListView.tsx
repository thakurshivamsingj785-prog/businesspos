import React, { useState } from 'react';
import { Order, StoreSettings } from '../types/index.ts';
import { formatCurrency, formatDateTime } from '../utils/formatters.ts';
import { generateInvoicePdf } from '../utils/invoicePdf.ts';
import {
  Search,
  Receipt,
  Eye,
  Download,
  Filter,
  ArrowUpDown,
  Calendar,
  IndianRupee,
  CheckCircle2
} from 'lucide-react';

interface OrdersListViewProps {
  orders: Order[];
  settings: StoreSettings;
  onViewInvoice: (order: Order) => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders,
  settings,
  onViewInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'upi' | 'cash' | 'card'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week'>('all');

  const filteredOrders = orders.filter(order => {
    // Payment filter
    if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) {
      return false;
    }

    // Date filter
    if (dateRange === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (!order.createdAt.startsWith(todayStr)) return false;
    } else if (dateRange === 'week') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(order.createdAt) < oneWeekAgo) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchInv = order.invoiceNumber.toLowerCase().includes(q);
      const matchCust = order.customerName.toLowerCase().includes(q);
      const matchPhone = (order.customerPhone || '').includes(q);
      return matchInv || matchCust || matchPhone;
    }

    return true;
  });

  const totalFilteredSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export in current filter.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Payment Method',
      'Payment Status',
      'UPI Reference',
      'Subtotal (INR)',
      'Discount (INR)',
      'GST Rate (%)',
      'GST Amount (INR)',
      'Total Amount (INR)',
      'Cost Price (INR)',
      'Gross Profit (INR)',
      'Items Count',
      'Items Detail'
    ];

    const rows = filteredOrders.map(order => {
      const itemsDetail = order.items
        .map(i => `${i.name} (x${i.quantity})`)
        .join('; ');

      return [
        `"${order.invoiceNumber}"`,
        `"${formatDateTime(order.createdAt)}"`,
        `"${(order.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
        `"${(order.customerPhone || '').replace(/"/g, '""')}"`,
        `"${order.paymentMethod.toUpperCase()}"`,
        `"${order.paymentStatus.toUpperCase()}"`,
        `"${(order.upiRefNumber || '').replace(/"/g, '""')}"`,
        order.subtotal.toFixed(2),
        order.discountAmount.toFixed(2),
        order.gstRate,
        order.gstAmount.toFixed(2),
        order.totalAmount.toFixed(2),
        (order.totalCostPrice || 0).toFixed(2),
        (order.profit || 0).toFixed(2),
        order.items.reduce((sum, i) => sum + i.quantity, 0),
        `"${itemsDetail.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Past bills and transaction ledger</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono">
            <span className="font-bold text-slate-900">{filteredOrders.length} bills</span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span className="font-bold text-emerald-700">{formatCurrency(totalFilteredSales)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. INV-20261107-001) or customer phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Payment method selector */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-700"
          >
            <option value="all">All Payments</option>
            <option value="upi">UPI QR Only</option>
            <option value="cash">Cash Only</option>
            <option value="card">Card Only</option>
          </select>

          {/* Date range selector */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-700"
          >
            <option value="all">All Time</option>
            <option value="today">Today Only</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Items Count</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching invoices found in this time period.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {formatDateTime(order.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="text-[11px] font-mono text-slate-500">{order.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        order.paymentMethod === 'upi'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {order.paymentMethod === 'upi' ? 'UPI QR' : 'Cash'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} units
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {order.gstAmount > 0 ? formatCurrency(order.gstAmount) : '₹ 0.00'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(order)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                          title="View / Print Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => generateInvoicePdf(order, settings).save(`${order.invoiceNumber}.pdf`)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
