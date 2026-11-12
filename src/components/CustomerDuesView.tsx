import React, { useState } from 'react';
import { CustomerDue, Order, StoreSettings } from '../types/index.ts';
import { formatCurrency, formatDateTime } from '../utils/formatters.ts';
import { sendInvoiceViaWhatsApp, sanitizeWhatsAppPhone } from '../services/whatsappService.ts';
import {
  Search,
  Users,
  AlertCircle,
  IndianRupee,
  CheckCircle2,
  Clock,
  Phone,
  Send,
  Eye,
  CreditCard,
  X,
  Check,
  ChevronRight,
  Receipt
} from 'lucide-react';

interface CustomerDuesViewProps {
  dues: CustomerDue[];
  settings: StoreSettings;
  onSettlePayment: (customerKey: string, amount: number, paymentMethod: 'upi' | 'cash') => Promise<void>;
  onViewInvoice: (order: Order) => void;
  onOpenPOS: () => void;
  initialSearchQuery?: string;
}

export const CustomerDuesView: React.FC<CustomerDuesViewProps> = ({
  dues,
  settings,
  onSettlePayment,
  onViewInvoice,
  onOpenPOS,
  initialSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDue | null>(null);

  // Settlement modal state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState<number | ''>('');
  const [settleMethod, setSettleMethod] = useState<'cash' | 'upi'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  const filteredDues = dues.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      d.customerName.toLowerCase().includes(q) ||
      d.customerPhone.includes(q)
    );
  });

  const totalOutstandingDue = dues.reduce((sum, d) => sum + Math.max(0, d.totalDue), 0);
  const customersWithDueCount = dues.filter(d => d.totalDue > 0).length;

  const handleOpenSettleModal = (customer: CustomerDue) => {
    setSelectedCustomer(customer);
    setSettleAmount(customer.totalDue);
    setSettleError(null);
    setSettleSuccessMsg(null);
    setShowSettleModal(true);
  };

  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = typeof settleAmount === 'number' ? settleAmount : 0;
    if (amount <= 0) {
      setSettleError('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    setSettleError(null);
    try {
      const key = selectedCustomer.customerPhone || selectedCustomer.customerName;
      await onSettlePayment(key, amount, settleMethod);
      setSettleSuccessMsg(`Successfully received ${formatCurrency(amount)} from ${selectedCustomer.customerName}.`);
      setTimeout(() => {
        setShowSettleModal(false);
        setSelectedCustomer(null);
      }, 1000);
    } catch (err: any) {
      setSettleError(err.message || 'Failed to record settlement payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminderWhatsApp = (customer: CustomerDue) => {
    const phone = sanitizeWhatsAppPhone(customer.customerPhone);
    if (!phone) {
      alert('No valid mobile number available for this customer.');
      return;
    }

    const message = `Namaste ${customer.customerName},\nThis is a friendly reminder from *${settings.storeName}*.\nYour current outstanding balance due is *${formatCurrency(customer.totalDue)}*.\n\nYou can pay in-store or directly via UPI to: *${settings.upiId}*.\nFor any query, contact us at ${settings.phone}.\nThank you!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Dues & Khata (Udhar)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track outstanding balances, credit bills, and accept payments</p>
        </div>

        <button
          onClick={onOpenPOS}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          New Bill / Credit Sale
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20">
          <span className="text-xs font-semibold text-red-700">Total Outstanding Balance (Dues)</span>
          <div className="text-2xl font-bold font-mono text-red-700 mt-2">
            {formatCurrency(totalOutstandingDue)}
          </div>
          <span className="text-[11px] text-red-600 block mt-1">Pending collection across all customers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-600">Customers with Due</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {customersWithDueCount}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Accounts with active pending balance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-600">Total Khata Accounts</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {dues.length}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Customers with recorded sales</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer Dues Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Mobile</th>
                <th className="py-3 px-4 text-right">Bills Count</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Balance Due (Udhar)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredDues.map((cust, idx) => {
                  const hasDue = cust.totalDue > 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{cust.customerName}</span>
                          {hasDue && (
                            <span className="w-2 h-2 rounded-full bg-red-500" title="Pending due"></span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Last active: {formatDateTime(cust.lastOrderDate)}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {cust.customerPhone ? `+91 ${cust.customerPhone}` : 'No phone'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {cust.totalOrders}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(cust.totalBilled)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                        {formatCurrency(cust.totalPaid)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          hasDue
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {hasDue ? formatCurrency(cust.totalDue) : 'PAID (₹ 0)'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDue && (
                            <button
                              onClick={() => handleOpenSettleModal(cust)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              Receive Due
                            </button>
                          )}

                          {hasDue && cust.customerPhone && (
                            <button
                              onClick={() => handleSendReminderWhatsApp(cust)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Send WhatsApp payment reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && !showSettleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.customerName}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedCustomer.customerPhone ? `Mobile: +91 ${selectedCustomer.customerPhone}` : 'Walk-in customer account'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Pill Strip */}
            <div className="grid grid-cols-3 gap-3 py-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Total Invoiced</span>
                <span className="text-base font-mono font-bold text-slate-900 mt-1 block">
                  {formatCurrency(selectedCustomer.totalBilled)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 block">Total Received</span>
                <span className="text-base font-mono font-bold text-emerald-800 mt-1 block">
                  {formatCurrency(selectedCustomer.totalPaid)}
                </span>
              </div>
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-200">
                <span className="text-red-700 block">Current Balance Due</span>
                <span className="text-base font-mono font-bold text-red-700 mt-1 block">
                  {formatCurrency(selectedCustomer.totalDue)}
                </span>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Order History & Invoices
              </h4>
              <div className="space-y-2">
                {selectedCustomer.orders.map(order => (
                  <div
                    key={order.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100/60 transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                        <span>{order.invoiceNumber}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-sans font-medium uppercase ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(order.createdAt)} · {order.items.length} item(s) · {order.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-mono font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        {order.amountDue !== undefined && order.amountDue > 0 && (
                          <div className="text-[10px] font-mono font-bold text-red-700">
                            Due: {formatCurrency(order.amountDue)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onViewInvoice(order)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="View Full Bill"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Close
              </button>

              {selectedCustomer.totalDue > 0 && (
                <button
                  onClick={() => setShowSettleModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Receive Payment ({formatCurrency(selectedCustomer.totalDue)})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settle Due Payment Modal */}
      {showSettleModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Receive Due Payment</h3>
                <p className="text-xs text-slate-500">
                  Customer: <strong>{selectedCustomer.customerName}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowSettleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettlement} className="mt-4 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center text-xs">
                <span className="font-medium text-red-800">Current Outstanding Due:</span>
                <span className="font-mono font-bold text-base text-red-800">
                  {formatCurrency(selectedCustomer.totalDue)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCustomer.totalDue}
                  required
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-lg font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSettleMethod('cash')}
                    className={`py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                      settleMethod === 'cash'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('upi')}
                    className={`py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                      settleMethod === 'upi'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    UPI Payment
                  </button>
                </div>
              </div>

              {settleError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">
                  {settleError}
                </div>
              )}

              {settleSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{settleSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !settleAmount || settleAmount <= 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
