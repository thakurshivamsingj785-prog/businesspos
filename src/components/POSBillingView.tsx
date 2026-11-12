import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Product, CartItem, Order, StoreSettings } from '../types/index.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { getProductImage } from '../utils/productImages.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { sendInvoiceViaWhatsApp, sanitizeWhatsAppPhone } from '../services/whatsappService.ts';
import { api } from '../services/api.ts';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  X,
  Check,
  ShoppingBag,
  Send,
  Printer,
  Phone,
  CheckSquare,
  Square,
  Store,
  Edit3,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface POSBillingViewProps {
  products: Product[];
  settings: StoreSettings;
  onCompleteSale: (orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<Order>;
  onSaleSuccess: (order: Order, options?: { autoPrint?: boolean }) => void;
  onUpdateSettings?: (updates: Partial<StoreSettings>) => Promise<void>;
  onOpenCustomerDues?: (searchQuery?: string) => void;
}

export const POSBillingView: React.FC<POSBillingViewProps> = ({
  products,
  settings,
  onCompleteSale,
  onSaleSuccess,
  onUpdateSettings,
  onOpenCustomerDues
}) => {
  const { t } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Customer Due / Udhar checking state
  const [customerDueInfo, setCustomerDueInfo] = useState<{
    customerName: string;
    customerPhone: string;
    totalDue: number;
    pendingOrdersCount: number;
  } | null>(null);

  // Check customer dues when phone or name changes
  useEffect(() => {
    const q = customerPhone.trim() || (customerName.trim() !== 'Walk-in Customer' ? customerName.trim() : '');
    if (!q || q.length < 3) {
      setCustomerDueInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const info = await api.checkCustomerDue(q);
        setCustomerDueInfo(info && info.totalDue > 0 ? info : null);
      } catch (err) {
        setCustomerDueInfo(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerPhone, customerName]);

  // Bill dispatch & print options
  const [sendToWhatsApp, setSendToWhatsApp] = useState(true);
  const [autoPrintBill, setAutoPrintBill] = useState(true);

  // Quick Shop Name & UPI ID Modal
  const [showShopSettingsModal, setShowShopSettingsModal] = useState(false);
  const [tempStoreName, setTempStoreName] = useState(settings.storeName || '');
  const [tempUpiId, setTempUpiId] = useState(settings.upiId || '');
  const [isSavingShopSettings, setIsSavingShopSettings] = useState(false);

  useEffect(() => {
    setTempStoreName(settings.storeName || '');
    setTempUpiId(settings.upiId || '');
  }, [settings.storeName, settings.upiId]);

  const handleSaveQuickShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempStoreName.trim() || !tempUpiId.trim()) return;
    setIsSavingShopSettings(true);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings({
          storeName: tempStoreName.trim(),
          upiId: tempUpiId.trim()
        });
      }
      setShowShopSettingsModal(false);
    } catch (err) {
      console.error('Failed to update shop details:', err);
    } finally {
      setIsSavingShopSettings(false);
    }
  };

  // Discount & Tax
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(settings.defaultGstRate || 5);

  // Payment Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'credit'>('upi');
  const [creditAmountPaid, setCreditAmountPaid] = useState<number | ''>(0);
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    return matchesCategory && matchesSearch;
  });

  // Hotkeys: F2 focus search, F4 clear, F8 checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setCart([]);
      } else if (e.key === 'F8' && cart.length > 0 && !showCheckoutModal) {
        e.preventDefault();
        openCheckout();
      } else if (e.key === 'Escape' && showCheckoutModal) {
        setShowCheckoutModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showCheckoutModal]);

  // Handle Search Input Enter (Auto-add if exact barcode or SKU)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      const matched = products.find(
        p => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
      );

      if (matched) {
        addToCart(matched);
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Add Product to Cart
  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (currentQtyInCart + 1 > product.stock) {
      alert(`Only ${product.stock} units available in stock.`);
      return;
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        total: newQty * updated[existingIndex].finalPrice
      };
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          discount: 0,
          finalPrice: product.price,
          total: product.price
        }
      ]);
    }
  };

  // Update Item Quantity
  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    if (newQty > item.product.stock) {
      alert(`Only ${item.product.stock} available in stock.`);
      return;
    }

    setCart(
      cart.map(i => {
        if (i.product.id === productId) {
          return {
            ...i,
            quantity: newQty,
            total: newQty * i.finalPrice
          };
        }
        return i;
      })
    );
  };

  // Remove Item
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = (taxableAmount * gstRate) / 100;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  const totalCostPrice = cart.reduce((sum, item) => sum + (item.product.costPrice * item.quantity), 0);
  const estimatedProfit = Math.max(0, grandTotal - totalCostPrice);

  const numericCashTendered = typeof cashTendered === 'number' ? cashTendered : 0;
  const changeDue = Math.max(0, numericCashTendered - grandTotal);

  const openCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal);
    setCheckoutError(null);
    setShowCheckoutModal(true);
  };

  // Complete Sale with optional send to phone and print trigger
  const handleFinalizeSale = async (opts?: { sendDigital?: boolean; printDirectly?: boolean }) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setCheckoutError(null);

    const shouldSend = opts?.sendDigital !== undefined ? opts.sendDigital : sendToWhatsApp;
    const shouldPrint = opts?.printDirectly !== undefined ? opts.printDirectly : autoPrintBill;

    try {
      let paid = grandTotal;
      let due = 0;
      let status: 'paid' | 'pending' | 'partial' = 'paid';

      if (paymentMethod === 'credit') {
        const partialPaid = typeof creditAmountPaid === 'number' ? Math.max(0, creditAmountPaid) : 0;
        paid = Math.min(grandTotal, partialPaid);
        due = Math.max(0, grandTotal - paid);
        status = due === 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending');
      }

      const orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'> = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: cart.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          sku: i.product.sku,
          barcode: i.product.barcode,
          category: i.product.category,
          price: i.product.price,
          costPrice: i.product.costPrice,
          quantity: i.quantity,
          unit: i.product.unit,
          discount: i.discount,
          total: i.total
        })),
        subtotal,
        discountType: 'fixed',
        discountValue,
        discountAmount,
        gstRate,
        gstAmount,
        totalAmount: grandTotal,
        totalCostPrice,
        profit: estimatedProfit,
        paymentMethod,
        paymentStatus: status,
        amountPaid: paid,
        amountDue: due,
        upiRefNumber: paymentMethod === 'upi' ? upiRefNumber : undefined,
        cashReceived: paymentMethod === 'cash' ? numericCashTendered : (paymentMethod === 'credit' && paid > 0 ? paid : undefined),
        changeGiven: paymentMethod === 'cash' ? changeDue : undefined
      };

      const completedOrder = await onCompleteSale(orderData);

      // If customer phone is present and send is checked, dispatch via WhatsApp service
      if (shouldSend && customerPhone.trim()) {
        sendInvoiceViaWhatsApp(completedOrder, settings, customerPhone.trim());
      }

      setShowCheckoutModal(false);
      setCart([]);
      setDiscountValue(0);
      setCustomerName('');
      setCustomerPhone('');

      onSaleSuccess(completedOrder, { autoPrint: shouldPrint });
    } catch (err: any) {
      setCheckoutError(err.message || 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upiUri = `upi://pay?pa=${encodeURIComponent(settings.upiId || 'shivamretail@okaxis')}&pn=${encodeURIComponent(settings.storeName || 'Retail Store')}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Store POS Bill`)}`;

  const hasPhone = customerPhone.replace(/\D/g, '').length >= 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Unified Product Search & Catalog (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Quick Shop & UPI Identifier Header */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-800">{settings.storeName || 'My Store'}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-mono text-slate-500">UPI: {settings.upiId || 'Not set'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTempStoreName(settings.storeName || '');
              setTempUpiId(settings.upiId || '');
              setShowShopSettingsModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ml-2"
          >
            <Edit3 className="w-3 h-3 text-slate-600" />
            <span>{t('pos_change_shop_upi', 'Change Shop / UPI ID')}</span>
          </button>
        </div>

        {/* Single clean search & barcode bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('pos_search_placeholder', 'Search product or scan barcode... (Press Enter to add)')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Simple category selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Product Grid with Studio Product Photos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockThreshold;

            return (
              <button
                key={product.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product)}
                className={`group rounded-xl border text-left transition-all flex flex-col justify-between bg-white overflow-hidden cursor-pointer ${
                  isOutOfStock
                    ? 'border-slate-200 opacity-45 cursor-not-allowed'
                    : 'border-slate-200 hover:border-slate-900 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="relative h-28 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                      {product.category}
                    </span>
                    <span
                      className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isOutOfStock
                          ? 'bg-red-600 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/90 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {product.stock > 0 ? `${product.stock} ${product.unit}` : 'Out of stock'}
                    </span>
                  </div>

                  <div className="p-2.5 pb-1">
                    <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                      {product.barcode}
                    </div>
                  </div>
                </div>

                <div className="px-2.5 pb-2.5 pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    +
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Clean Billing Cart (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 sticky top-20 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">{t('pos_current_bill', 'Current Bill')}</h2>
            <span className="text-xs font-mono text-slate-500">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-600 hover:underline cursor-pointer"
            >
              {t('pos_clear_cart', 'Clear Cart')}
            </button>
          )}
        </div>

        {/* Customer Inputs & Digital Bill Dispatch Options */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={t('pos_customer_name', 'Customer Name (Optional)')}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none"
            />
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder={t('pos_customer_phone', 'Mobile (e.g. 9876543210)')}
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Due / Udhar Alert Banner */}
          {customerDueInfo && customerDueInfo.totalDue > 0 && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <span className="font-semibold text-red-900">
                    Previous Due (Udhar):
                  </span>
                  <span className="font-mono font-bold text-red-700 ml-1.5">
                    {formatCurrency(customerDueInfo.totalDue)}
                  </span>
                  <span className="text-[10px] text-red-600 block">
                    {customerDueInfo.pendingOrdersCount} unpaid invoice(s)
                  </span>
                </div>
              </div>
              {onOpenCustomerDues && (
                <button
                  type="button"
                  onClick={() => onOpenCustomerDues(customerPhone || customerName)}
                  className="px-2 py-1 text-[11px] font-bold text-red-700 bg-white border border-red-200 hover:bg-red-100 rounded transition-colors cursor-pointer shrink-0"
                >
                  View Khata
                </button>
              )}
            </div>
          )}

          {/* Quick Bill Dispatch & Print Toggles */}
          <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendToWhatsApp}
                onChange={e => setSendToWhatsApp(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
              <span className="flex items-center gap-1 font-medium">
                <Send className="w-3 h-3 text-emerald-600" />
                <span>{t('pos_send_whatsapp', 'Send bill to WhatsApp')}</span>
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPrintBill}
                onChange={e => setAutoPrintBill(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
              <span className="flex items-center gap-1 font-medium">
                <Printer className="w-3 h-3 text-slate-600" />
                <span>{t('pos_print_invoice', 'Print invoice')}</span>
              </span>
            </label>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No items in cart. Click products or scan barcodes to add.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2.5 text-xs">
                <img
                  src={getProductImage(item.product)}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {formatCurrency(item.product.price)} each
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-semibold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="w-16 text-right font-mono font-semibold text-slate-900">
                  {formatCurrency(item.total)}
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-slate-300 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t('pos_subtotal', 'Subtotal')}</span>
            <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>{t('pos_discount', 'Discount (₹)')}</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={discountValue || ''}
              onChange={e => setDiscountValue(Number(e.target.value) || 0)}
              className="w-20 px-2 py-0.5 text-right font-mono text-xs bg-white border border-slate-200 rounded focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>GST ({gstRate}%)</span>
            <span className="font-mono">{formatCurrency(gstAmount)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">{t('pos_total_payable', 'Total Payable')}</span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={openCheckout}
            className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t('pos_pay_generate', 'Pay & Generate Invoice')}</span>
            {hasPhone && sendToWhatsApp && (
              <span className="text-[10px] font-normal bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                + WhatsApp
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CLEAN CHECKOUT MODAL WITH DIRECT SEND & PRINT CONTROLS */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment & Bill Dispatch</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Total: {formatCurrency(grandTotal)}
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Tabs: UPI QR, Cash, or Credit / Udhar */}
            <div className="flex gap-2 my-4">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                UPI QR
              </button>

              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cash
              </button>

              <button
                onClick={() => {
                  setPaymentMethod('credit');
                  setCreditAmountPaid(0);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  paymentMethod === 'credit'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Credit (Udhar)
              </button>
            </div>

            {checkoutError && (
              <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded-lg">
                {checkoutError}
              </div>
            )}

            {/* UPI View */}
            {paymentMethod === 'upi' && (
              <div className="text-center py-2 space-y-3">
                <div className="inline-block p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <QRCodeSVG value={upiUri} size={180} />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {formatCurrency(grandTotal)}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-slate-500 font-mono">
                    <span>UPI ID: {settings.upiId || 'shivamretail@okaxis'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempStoreName(settings.storeName || '');
                        setTempUpiId(settings.upiId || '');
                        setShowShopSettingsModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-800 underline text-[11px] font-sans font-medium cursor-pointer"
                    >
                      Change UPI ID
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cash View */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Cash Received (₹)</label>
                  <input
                    type="number"
                    min={grandTotal}
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-lg font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center font-medium">
                  <span className="text-slate-600">Change Due:</span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            {/* Credit / Khata (Udhar) View */}
            {paymentMethod === 'credit' && (
              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Bill Amount:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Partial Advance Paid Now (₹, optional):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={grandTotal}
                      value={creditAmountPaid}
                      onChange={e => setCreditAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0 if fully unpaid"
                      className="w-full px-3 py-1.5 font-mono text-sm bg-white border border-amber-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-amber-200/70 flex justify-between items-center">
                    <span className="font-bold text-red-700">Net Due Added to Customer:</span>
                    <span className="font-mono font-bold text-base text-red-700">
                      {formatCurrency(Math.max(0, grandTotal - (typeof creditAmountPaid === 'number' ? creditAmountPaid : 0)))}
                    </span>
                  </div>
                </div>

                {customerDueInfo && customerDueInfo.totalDue > 0 && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800">
                    Note: Customer already has <strong>{formatCurrency(customerDueInfo.totalDue)}</strong> previous pending due. Total due after this bill will be{' '}
                    <strong>{formatCurrency(customerDueInfo.totalDue + Math.max(0, grandTotal - (typeof creditAmountPaid === 'number' ? creditAmountPaid : 0)))}</strong>.
                  </div>
                )}
              </div>
            )}

            {/* Phone & Dispatch status banner */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Customer Mobile:</span>
                <span className="font-mono font-bold text-slate-900">
                  {customerPhone.trim() ? `+91 ${customerPhone.trim()}` : 'None provided'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToWhatsApp}
                    onChange={e => setSendToWhatsApp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>Send WhatsApp Bill</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrintBill}
                    onChange={e => setAutoPrintBill(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  <span>Print Receipt</span>
                </label>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="mt-4 pt-2 flex flex-col gap-2">
              <button
                disabled={isSubmitting || (paymentMethod === 'cash' && numericCashTendered < grandTotal)}
                onClick={() => handleFinalizeSale({ sendDigital: sendToWhatsApp, printDirectly: autoPrintBill })}
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : paymentMethod === 'credit'
                    ? (hasPhone && sendToWhatsApp
                        ? 'Confirm Credit Bill & Send WhatsApp'
                        : 'Confirm & Record in Customer Khata')
                    : hasPhone && sendToWhatsApp && autoPrintBill
                    ? 'Confirm, Send to WhatsApp & Print'
                    : hasPhone && sendToWhatsApp
                    ? 'Confirm & Send to WhatsApp'
                    : autoPrintBill
                    ? 'Confirm & Print Receipt'
                    : 'Confirm Payment Only'}
                </span>
              </button>

              <div className="flex justify-between items-center text-xs px-1">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-slate-400 hover:text-slate-700 py-1"
                >
                  Cancel
                </button>

                {hasPhone && (
                  <button
                    type="button"
                    disabled={isSubmitting || (paymentMethod === 'cash' && numericCashTendered < grandTotal)}
                    onClick={() => handleFinalizeSale({ sendDigital: true, printDirectly: false })}
                    className="text-emerald-700 hover:underline font-medium py-1 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Only (No Print)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Change Shop Name & UPI ID Modal */}
      {showShopSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change Shop Name & UPI ID</h3>
                  <p className="text-[11px] text-slate-500">Updates receipts and live customer payment QR codes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShopSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickShopSettings} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Name (Dukaan / Store Name)
                </label>
                <input
                  type="text"
                  required
                  value={tempStoreName}
                  onChange={e => setTempStoreName(e.target.value)}
                  placeholder="e.g. Shivam Kirana & General Store"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store UPI ID (VPA)
                </label>
                <input
                  type="text"
                  required
                  value={tempUpiId}
                  onChange={e => setTempUpiId(e.target.value)}
                  placeholder="e.g. mobileNumber@upi or merchant@okaxis"
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Customers scan this to pay directly via PhonePe, Google Pay, or Paytm.
                </p>
              </div>

              {/* Dynamic QR Preview */}
              {tempUpiId.trim() && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0">
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent(tempUpiId.trim())}&pn=${encodeURIComponent(tempStoreName.trim() || 'Store')}&cu=INR`}
                      size={64}
                    />
                  </div>
                  <div className="text-[11px] min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {tempStoreName.trim() || 'Preview Store'}
                    </span>
                    <span className="font-mono text-slate-600 block truncate">
                      {tempUpiId.trim()}
                    </span>
                    <span className="text-emerald-600 text-[10px] font-medium mt-0.5 block">
                      Live QR updates automatically
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowShopSettingsModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingShopSettings || !tempStoreName.trim() || !tempUpiId.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSavingShopSettings ? 'Saving...' : 'Save & Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
