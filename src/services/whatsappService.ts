import { Order, StoreSettings } from '../types/index.ts';
import { formatDateTime, formatCurrency } from '../utils/formatters.ts';

/**
 * Sanitizes and normalizes phone number for WhatsApp wa.me API.
 * Handles 10-digit Indian numbers by prefixing '91', strips non-digit characters.
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');

  // If 10 digits (standard Indian mobile e.g. 9876543210), prepend '91'
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }

  // If 11 digits starting with '0' (e.g. 09876543210), replace leading '0' with '91'
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.slice(1)}`;
  }

  return digitsOnly;
}

/**
 * Validates if the phone number can receive a WhatsApp message.
 */
export function isValidWhatsAppPhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = sanitizeWhatsAppPhone(phone);
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Formats a comprehensive, professional WhatsApp invoice message
 * based on order and store settings.
 */
export function formatInvoiceWhatsAppMessage(order: Order, settings: StoreSettings): string {
  const storeName = settings.storeName || 'Retail Store';
  const helpline = settings.phone || '';
  const gstin = settings.gstin ? `GSTIN: ${settings.gstin}\n` : '';

  // Format line items
  const itemsText = order.items
    .map((item, index) => {
      const unitStr = item.unit ? ` ${item.unit}` : '';
      return `${index + 1}. *${item.name}*\n   ${item.quantity}${unitStr} × ₹${item.price.toFixed(2)} = *₹${item.total.toFixed(2)}*`;
    })
    .join('\n');

  // Format discounts and taxes
  let discountLine = '';
  if (order.discountAmount > 0) {
    const discLabel = order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat';
    discountLine = `\n🏷️ Discount (${discLabel}): -₹${order.discountAmount.toFixed(2)}`;
  }

  let gstLine = '';
  if (order.gstAmount > 0) {
    gstLine = `\n📊 GST (${order.gstRate}%): ₹${order.gstAmount.toFixed(2)}`;
  }

  let paymentDetails = `💳 Payment Mode: *${order.paymentMethod.toUpperCase()}* (${order.paymentStatus.toUpperCase()})`;
  if (order.amountPaid !== undefined) {
    paymentDetails += `\n💵 Amount Paid: *₹${order.amountPaid.toFixed(2)}*`;
  }
  if (order.amountDue !== undefined && order.amountDue > 0) {
    paymentDetails += `\n⚠️ *BALANCE DUE (UDHAR): ₹${order.amountDue.toFixed(2)}*`;
  }
  if (order.upiRefNumber) {
    paymentDetails += `\n🔗 UTR/Ref: ${order.upiRefNumber}`;
  }

  return `🧾 *TAX INVOICE - ${storeName}*
━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${order.invoiceNumber}
📅 *Date & Time:* ${formatDateTime(order.createdAt)}
👤 *Customer:* ${order.customerName || 'Valued Customer'}
━━━━━━━━━━━━━━━━━━━━

*ITEMS PURCHASED:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${order.subtotal.toFixed(2)}${discountLine}${gstLine}
💰 *TOTAL AMOUNT: ₹${order.totalAmount.toFixed(2)}*
${paymentDetails}
━━━━━━━━━━━━━━━━━━━━
📍 ${settings.address || ''}, ${settings.city || ''}
${gstin}📞 Helpline: ${helpline}

_Thank you for shopping with us! Please retain this message as your official digital invoice._`;
}

/**
 * Generates the official WhatsApp Click-to-Chat URL using the https://wa.me/ API.
 * Example: https://wa.me/919876543210?text=...
 */
export function createWhatsAppInvoiceUrl(
  order: Order,
  settings: StoreSettings,
  phoneOverride?: string
): string {
  const phone = phoneOverride || order.customerPhone || '';
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const message = formatInvoiceWhatsAppMessage(order, settings);
  const encodedMessage = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  // Fallback if no phone number provided: opens WhatsApp share dialog
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Service function that triggers sending the WhatsApp invoice to the customer's phone number.
 * Opens the WhatsApp Web/Mobile chat preloaded with the invoice message.
 *
 * @param order - The invoice order data
 * @param settings - Store settings (store name, GSTIN, contact details)
 * @param phoneOverride - Optional phone number override
 * @returns object with success status, the target phone, and generated URL
 */
export function sendInvoiceViaWhatsApp(
  order: Order,
  settings: StoreSettings,
  phoneOverride?: string
): { success: boolean; phone: string; url: string; error?: string } {
  try {
    const rawPhone = phoneOverride || order.customerPhone || '';
    const cleanPhone = sanitizeWhatsAppPhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        phone: rawPhone,
        url: '',
        error: 'Invalid or missing customer phone number (minimum 10 digits required).'
      };
    }

    const url = createWhatsAppInvoiceUrl(order, settings, cleanPhone);

    // Open WhatsApp in new tab/app window
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    return {
      success: true,
      phone: cleanPhone,
      url
    };
  } catch (error: any) {
    console.error('Error dispatching WhatsApp invoice:', error);
    return {
      success: false,
      phone: phoneOverride || order.customerPhone || '',
      url: '',
      error: error.message || 'Failed to dispatch WhatsApp invoice'
    };
  }
}
