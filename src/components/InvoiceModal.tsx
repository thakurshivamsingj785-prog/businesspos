import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, StoreSettings } from '../types/index.ts';
import { formatCurrency, formatDateTime, numberToWords } from '../utils/formatters.ts';
import { sendInvoiceViaWhatsApp, formatInvoiceWhatsAppMessage } from '../services/whatsappService.ts';
import { generateInvoicePdf } from '../utils/invoicePdf.ts';
import {
  Printer,
  Download,
  Share2,
  X,
  CheckCircle2,
  Send,
  Phone,
  Layout,
  FileText,
  Receipt,
  Sparkles
} from 'lucide-react';

export type InvoiceThemeStyle = 'classic' | 'thermal' | 'modern' | 'compact';

interface InvoiceModalProps {
  order: Order;
  settings: StoreSettings;
  autoPrint?: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  settings,
  autoPrint = false,
  onClose,
  onNewSale
}) => {
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(order.customerPhone || '');
  const [showPhoneInput, setShowPhoneInput] = useState(!order.customerPhone);
  const [invoiceStyle, setInvoiceStyle] = useState<InvoiceThemeStyle>('classic');

  // Auto-print effect if requested at checkout
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // Handle PDF Download
  const handleDownloadPdf = () => {
    const doc = generateInvoicePdf(order, settings);
    doc.save(`${order.invoiceNumber}.pdf`);
  };

  // Handle Native Print
  const handlePrint = () => {
    window.print();
  };

  // Send to Customer Phone via WhatsApp Service
  const handleSendToWhatsApp = () => {
    const phoneToSend = customPhone.trim() || order.customerPhone;
    if (!phoneToSend) {
      setShowPhoneInput(true);
      return;
    }
    sendInvoiceViaWhatsApp(order, settings, phoneToSend);
  };

  const verificationQr = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.storeName)}&am=${order.totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${order.invoiceNumber}`)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 ${
        invoiceStyle === 'thermal' ? 'max-w-md' : 'max-w-3xl'
      }`}>
        {/* Header Action Bar (No-Print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-sm font-bold text-slate-900">
                {order.invoiceNumber}
              </span>
              <span className="block text-[11px] text-slate-500 font-mono">
                {formatCurrency(order.totalAmount)} · {order.paymentMethod.toUpperCase()} ({order.paymentStatus.toUpperCase()})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Send Button */}
            <button
              onClick={handleSendToWhatsApp}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Send itemized digital bill directly to customer's phone"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print receipt on thermal or A4 printer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Bill</span>
            </button>

            {/* PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Style Selector Toolbar (No-Print) */}
        <div className="no-print px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Invoice Style:</span>
          </div>

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setInvoiceStyle('classic')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                invoiceStyle === 'classic'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classic A4
            </button>

            <button
              onClick={() => setInvoiceStyle('thermal')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                invoiceStyle === 'thermal'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thermal POS (80mm)
            </button>

            <button
              onClick={() => setInvoiceStyle('modern')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                invoiceStyle === 'modern'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern Minimalist
            </button>

            <button
              onClick={() => setInvoiceStyle('compact')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                invoiceStyle === 'compact'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compact Slip
            </button>
          </div>
        </div>

        {/* Optional Quick Phone Input Prompt if not entered */}
        {showPhoneInput && (
          <div className="no-print p-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <input
                type="tel"
                placeholder="Enter customer mobile number (e.g. 9876543210)"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                className="w-full px-2.5 py-1 bg-white border border-emerald-300 rounded text-xs font-mono focus:outline-none"
              />
            </div>
            <button
              onClick={handleSendToWhatsApp}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs whitespace-nowrap cursor-pointer"
            >
              Send WhatsApp Bill
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STYLE 1: CLASSIC A4 / RETAIL INVOICE                           */}
        {/* ============================================================== */}
        {invoiceStyle === 'classic' && (
          <div id="printable-invoice" className="p-8 text-slate-800 bg-white">
            {/* Store Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {settings.storeName}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
                </p>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Phone: <strong>{settings.phone}</strong></span>
                  <span>GSTIN: <strong>{settings.gstin || 'UNREGISTERED'}</strong></span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  <span>UPI ID: <strong>{settings.upiId}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block text-xs font-bold tracking-wider uppercase bg-slate-100 text-slate-900 px-2.5 py-1 rounded">
                  Tax Invoice
                </span>
                <div className="text-xs text-slate-600 mt-2 font-mono">
                  <div>Inv No: <strong className="text-slate-900">{order.invoiceNumber}</strong></div>
                  <div>Date: {formatDateTime(order.createdAt)}</div>
                  <div className="mt-1">
                    Payment: <strong className="text-emerald-700 uppercase">{order.paymentMethod}</strong> ({order.paymentStatus})
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details Strip */}
            <div className="py-3 border-b border-slate-200 text-xs flex justify-between items-center text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">Billed To: </span>
                <span>{order.customerName || 'Walk-in Customer'}</span>
                {(customPhone || order.customerPhone) && (
                  <span className="ml-2 font-mono text-slate-500">
                    (Mobile: {customPhone || order.customerPhone})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Point of Sale Terminal #01
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 bg-slate-50/50">
                    <th className="py-2 px-2 w-8">#</th>
                    <th className="py-2 px-2">Item Description</th>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                    <th className="py-2 px-2 text-right">Disc</th>
                    <th className="py-2 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2.5 px-2 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500">{item.sku}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium">{item.quantity} {item.unit}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">{item.price.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                        {item.discount > 0 ? `-${item.discount.toFixed(2)}` : '0.00'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900">
                        {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Tax Split */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Left: QR Code and Terms (5 cols) */}
              <div className="sm:col-span-5 flex items-start gap-3">
                <div className="p-1 bg-white border border-slate-200 rounded">
                  <QRCodeSVG value={verificationQr} size={70} />
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-700">Digital Verification</p>
                  <p className="mt-0.5">Scan to verify invoice details or make digital UPI payment.</p>
                  <p className="mt-1 font-mono">{settings.upiId}</p>
                </div>
              </div>

              {/* Right: Subtotal, Taxes, Grand Total (7 cols) */}
              <div className="sm:col-span-7 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-medium">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}

                {order.gstAmount > 0 && (
                  <>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>CGST ({(order.gstRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono">{formatCurrency(order.gstAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>SGST ({(order.gstRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono">{formatCurrency(order.gstAmount / 2)}</span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-bold text-slate-900">
                  <span className="text-sm">Grand Total (INR):</span>
                  <span className="text-lg font-mono tabular-nums text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                {/* Due / Udhar Breakdown if applicable */}
                {order.amountDue !== undefined && order.amountDue > 0 && (
                  <div className="pt-1.5 mt-1 border-t border-dashed border-red-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Amount Paid:</span>
                      <span className="font-mono font-medium">{formatCurrency(order.amountPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-red-700 font-bold bg-red-50 p-1.5 rounded">
                      <span>Balance Due (Udhar):</span>
                      <span className="font-mono">{formatCurrency(order.amountDue)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amount in words */}
            <div className="mt-4 p-2.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 italic border border-slate-100">
              Amount in words: {numberToWords(order.totalAmount)}
            </div>

            {/* Footer terms & Signatory */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
              <div className="max-w-xs">
                <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                <p className="mt-0.5 leading-snug">
                  {settings.footerNote || 'Goods once sold can be exchanged within 7 days with invoice.'}
                </p>
              </div>

              <div className="text-right">
                <div className="h-8"></div>
                <p className="font-semibold text-slate-800">Authorized Signatory</p>
                <p className="text-[10px] text-slate-400">For {settings.storeName}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STYLE 2: THERMAL POS RECEIPT (80mm ROLL FORMAT)                */}
        {/* ============================================================== */}
        {invoiceStyle === 'thermal' && (
          <div id="printable-invoice" className="p-6 text-slate-900 bg-white font-mono text-xs max-w-sm mx-auto">
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              <h2 className="text-base font-bold uppercase tracking-wider">{settings.storeName}</h2>
              <p className="text-[11px] text-slate-600">{settings.address}, {settings.city}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone} | GSTIN: {settings.gstin || 'N/A'}</p>
              <div className="pt-1 text-[11px] font-bold">
                *** CASH / RETAIL MEMO ***
              </div>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Inv: {order.invoiceNumber}</span>
                <span>{order.createdAt.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cust: {order.customerName || 'Customer'}</span>
                <span>{order.customerPhone ? `+91-${order.customerPhone}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment: {order.paymentMethod.toUpperCase()}</span>
                <span className="font-bold">{order.paymentStatus.toUpperCase()}</span>
              </div>
            </div>

            {/* Thermal Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold pb-1 text-[11px]">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-right">Qty/Rate</span>
                <span className="w-1/4 text-right">Amt</span>
              </div>
              <div className="divide-y divide-dotted divide-slate-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-1 text-[11px]">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>{item.quantity} {item.unit} × ₹{item.price.toFixed(2)}</span>
                      <span className="font-bold text-slate-900 font-mono">₹{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thermal Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal ({order.items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Discount:</span>
                  <span>-₹{order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {order.gstAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST ({order.gstRate}%):</span>
                  <span>₹{order.gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-800">
                <span>TOTAL PAYABLE:</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>

              {/* Paid and Due breakdown */}
              {order.amountDue !== undefined && order.amountDue > 0 && (
                <div className="pt-1 mt-1 border-t border-dashed border-red-300 text-red-700 font-bold">
                  <div className="flex justify-between">
                    <span>Paid Now:</span>
                    <span>₹{(order.amountPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>BALANCE DUE:</span>
                    <span>₹{order.amountDue.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Thermal UPI QR & Footer */}
            <div className="pt-3 text-center space-y-2">
              <div className="inline-block p-1 bg-white border border-slate-300">
                <QRCodeSVG value={verificationQr} size={85} />
              </div>
              <p className="text-[10px] text-slate-600">UPI: {settings.upiId}</p>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-dotted border-slate-300">
                {settings.footerNote || 'THANK YOU! VISIT AGAIN'}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STYLE 3: MODERN MINIMALIST (Clean Tech-First Design)            */}
        {/* ============================================================== */}
        {invoiceStyle === 'modern' && (
          <div id="printable-invoice" className="p-8 text-slate-900 bg-white">
            {/* Top Minimal Banner */}
            <div className="flex justify-between items-center pb-6 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  {settings.storeName.charAt(0) || 'V'}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{settings.storeName}</h2>
                  <p className="text-xs text-slate-500 font-mono">UPI: {settings.upiId} · {settings.phone}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase tracking-widest font-semibold text-slate-400 block">INVOICE</span>
                <span className="text-base font-bold font-mono text-slate-900">{order.invoiceNumber}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-4 py-5 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Date & Time</span>
                <span className="font-medium text-slate-800 mt-0.5 block">{formatDateTime(order.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Customer</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{order.customerName || 'Walk-in'}</span>
                {order.customerPhone && (
                  <span className="text-[11px] font-mono text-slate-500">+91 {order.customerPhone}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Payment Status</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {order.paymentMethod} · {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Modern Items List */}
            <div className="py-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-600">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modern Bottom Summary */}
            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <QRCodeSVG value={verificationQr} size={64} />
                </div>
                <div className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700 block">Instant Payment Verification</span>
                  <span>Scan via PhonePe, GPay, or Paytm</span>
                </div>
              </div>

              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-₹{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {order.gstAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>GST ({order.gstRate}%)</span>
                    <span className="font-mono">₹{order.gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                  <span>Total Due</span>
                  <span className="text-xl font-mono">₹{order.totalAmount.toFixed(2)}</span>
                </div>

                {order.amountDue !== undefined && order.amountDue > 0 && (
                  <div className="pt-1 text-red-700 font-bold flex justify-between text-xs">
                    <span>Remaining Due:</span>
                    <span className="font-mono">₹{order.amountDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STYLE 4: COMPACT SLIP (Fast Counter Token)                      */}
        {/* ============================================================== */}
        {invoiceStyle === 'compact' && (
          <div id="printable-invoice" className="p-6 text-slate-900 bg-white text-xs">
            <div className="p-4 border-2 border-slate-900 rounded-xl space-y-3">
              <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{settings.storeName}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Bill #{order.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">{formatDateTime(order.createdAt)}</span>
                  <span className="font-bold text-emerald-700 text-[11px] uppercase">{order.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-1 divide-y divide-slate-100">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-[11px]">
                    <span className="truncate max-w-[200px]">{i.name} (x{i.quantity})</span>
                    <span className="font-mono font-bold">₹{i.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-900 flex justify-between items-center font-bold">
                <span className="text-sm">TOTAL AMOUNT:</span>
                <span className="text-lg font-mono">{formatCurrency(order.totalAmount)}</span>
              </div>

              {order.amountDue !== undefined && order.amountDue > 0 && (
                <div className="p-1.5 bg-red-50 text-red-700 rounded flex justify-between text-xs font-bold font-mono">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(order.amountDue)}</span>
                </div>
              )}

              <div className="text-center pt-1 text-[10px] text-slate-400">
                Customer: {order.customerName || 'Walk-in'} {order.customerPhone ? `(${order.customerPhone})` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions (No-Print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close View
          </button>

          {onNewSale && (
            <button
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Start Next Bill (F2)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
