import { jsPDF } from 'jspdf';
import { Order, StoreSettings } from '../types/index.ts';
import { formatCurrency, formatDateTime, numberToWords } from './formatters.ts';

export function generateInvoicePdf(order: Order, settings: StoreSettings): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.storeName || 'BusinessPOS Retail Store', 14, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  y += 5;
  doc.text(`${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`, 14, y);
  y += 4;
  doc.text(`Phone: ${settings.phone}  |  Email: ${settings.email}`, 14, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`GSTIN: ${settings.gstin || 'UNREGISTERED'}  |  UPI ID: ${settings.upiId}`, 14, y);

  // TAX INVOICE title pill on right
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', pageWidth - 14, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${order.invoiceNumber}`, pageWidth - 14, 24, { align: 'right' });
  doc.text(`Date & Time: ${formatDateTime(order.createdAt)}`, pageWidth - 14, 29, { align: 'right' });
  doc.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})`, pageWidth - 14, 34, { align: 'right' });

  // Divider
  y += 8;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  // Customer Details Block
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('BILL TO:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  y += 4;
  doc.text(`Customer Name: ${order.customerName || 'Walk-in Customer'}`, 14, y);
  y += 4;
  doc.text(`Contact: ${order.customerPhone || 'N/A'}`, 14, y);

  // Table Header
  y += 8;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y - 4, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text('#', 16, y);
  doc.text('Item Description', 24, y);
  doc.text('SKU', 88, y);
  doc.text('Qty', 115, y, { align: 'right' });
  doc.text('Rate (Rs.)', 140, y, { align: 'right' });
  doc.text('Disc', 162, y, { align: 'right' });
  doc.text('Amount (Rs.)', pageWidth - 16, y, { align: 'right' });

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  y += 4;

  order.items.forEach((item, index) => {
    y += 6;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.text((index + 1).toString(), 16, y);
    // Truncate name if too long
    const itemName = item.name.length > 34 ? item.name.substring(0, 32) + '...' : item.name;
    doc.text(itemName, 24, y);
    doc.text(item.sku || '-', 88, y);
    doc.text(`${item.quantity} ${item.unit || ''}`, 115, y, { align: 'right' });
    doc.text(item.price.toFixed(2), 140, y, { align: 'right' });
    doc.text(item.discount > 0 ? `-${item.discount.toFixed(2)}` : '0.00', 162, y, { align: 'right' });
    doc.text(item.total.toFixed(2), pageWidth - 16, y, { align: 'right' });

    // Hairline between rows
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 2, pageWidth - 14, y + 2);
  });

  // Summary section
  y += 8;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  const summaryX = pageWidth - 80;

  doc.setFontSize(9);
  doc.text('Subtotal:', summaryX, y);
  doc.text(order.subtotal.toFixed(2), pageWidth - 16, y, { align: 'right' });

  if (order.discountAmount > 0) {
    y += 5;
    doc.text(`Discount (${order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat'}):`, summaryX, y);
    doc.text(`-${order.discountAmount.toFixed(2)}`, pageWidth - 16, y, { align: 'right' });
  }

  if (order.gstAmount > 0) {
    y += 5;
    const halfGst = (order.gstAmount / 2).toFixed(2);
    const halfRate = (order.gstRate / 2).toFixed(1);
    doc.text(`CGST (${halfRate}%):`, summaryX, y);
    doc.text(halfGst, pageWidth - 16, y, { align: 'right' });

    y += 5;
    doc.text(`SGST (${halfRate}%):`, summaryX, y);
    doc.text(halfGst, pageWidth - 16, y, { align: 'right' });
  }

  // Grand Total Box
  y += 7;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(summaryX - 4, y - 4, pageWidth - summaryX + 4 - 14, 9, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total (INR):', summaryX, y + 2);
  doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, pageWidth - 16, y + 2, { align: 'right' });

  // Paid and Due amounts in breakdown
  if (order.amountDue !== undefined && order.amountDue > 0) {
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Amount Paid:', summaryX, y);
    doc.text(`Rs. ${(order.amountPaid || 0).toFixed(2)}`, pageWidth - 16, y, { align: 'right' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('Balance Due (Udhar):', summaryX, y);
    doc.text(`Rs. ${order.amountDue.toFixed(2)}`, pageWidth - 16, y, { align: 'right' });
  }

  // Amount in words
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Amount in Words: ${numberToWords(order.totalAmount)}`, 14, y);

  // Payment note
  if (order.paymentMethod === 'credit') {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`Credit Bill (Khata) · Unpaid Balance Due: Rs. ${(order.amountDue || order.totalAmount).toFixed(2)}`, 14, y);
  } else if (order.paymentMethod === 'upi') {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`UPI Payment Verified · Store UPI: ${settings.upiId}${order.upiRefNumber ? ` · Ref: ${order.upiRefNumber}` : ''}`, 14, y);
  } else if (order.paymentMethod === 'cash') {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Paid in Cash · Tendered: Rs. ${(order.cashReceived || order.amountPaid || order.totalAmount).toFixed(2)} · Change: Rs. ${(order.changeGiven || 0).toFixed(2)}`, 14, y);
  }

  // Footer notes and authorization
  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageWidth - 14, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.footerNote || 'Thank you for shopping with us! Visit again.', 14, y);

  doc.text('Authorized Signatory', pageWidth - 14, y + 10, { align: 'right' });
  doc.text(`For ${settings.storeName}`, pageWidth - 14, y + 14, { align: 'right' });

  return doc;
}
