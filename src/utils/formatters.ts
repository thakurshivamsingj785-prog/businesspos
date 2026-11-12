export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Convert number to Indian Rupees words
export function numberToWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const wholeNumber = Math.floor(num);
  const decimals = Math.round((num - wholeNumber) * 100);

  if (wholeNumber === 0) return 'Zero Rupees Only';

  function convertGroup(n: number): string {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  }

  let result = '';

  const crore = Math.floor(wholeNumber / 10000000);
  let remainder = wholeNumber % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  const hundreds = remainder;

  if (crore > 0) {
    result += convertGroup(crore) + 'Crore ';
  }
  if (lakh > 0) {
    result += convertGroup(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    result += convertGroup(thousand) + 'Thousand ';
  }
  if (hundreds > 0) {
    result += convertGroup(hundreds);
  }

  result = result.trim() + ' Rupees';

  if (decimals > 0) {
    result += ' and ' + convertGroup(decimals).trim() + ' Paise';
  }

  return result + ' Only';
}

// Clean phone number (e.g. removes spaces, dashes, prepends 91 for 10-digit Indian numbers)
export function sanitizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

// Generate formatted WhatsApp digital tax invoice
export function generateWhatsAppReceiptMessage(order: any, settings: any): string {
  const itemsText = order.items
    .map((item: any) => `• ${item.name} (${item.quantity} ${item.unit || ''}) × ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}`)
    .join('\n');

  return `🧾 *TAX INVOICE - ${settings.storeName || 'BusinessPOS'}*
━━━━━━━━━━━━━━━━━━━━
📄 *Invoice:* ${order.invoiceNumber}
📅 *Date:* ${formatDateTime(order.createdAt)}
👤 *Customer:* ${order.customerName || 'Customer'}

*ITEMS PURCHASED:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${order.subtotal.toFixed(2)}
${order.discountAmount > 0 ? `Discount: -₹${order.discountAmount.toFixed(2)}\n` : ''}${order.gstAmount > 0 ? `GST (${order.gstRate}%): ₹${order.gstAmount.toFixed(2)}\n` : ''}💰 *TOTAL AMOUNT: ₹${order.totalAmount.toFixed(2)}*
💳 *Payment Mode:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━
📍 ${settings.address || ''}, ${settings.city || ''}
📞 Helpline: ${settings.phone || ''}
GSTIN: ${settings.gstin || 'UNREGISTERED'}

_Thank you for your visit! Goods can be exchanged with this bill._`;
}

// Generate direct WhatsApp click-to-send link
export function getWhatsAppBillUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
