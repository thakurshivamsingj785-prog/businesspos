import React, { useState } from 'react';
import { DashboardMetrics, Product, Order } from '../types/index.ts';
import { formatCurrency, formatDateTime } from '../utils/formatters.ts';
import { getProductImage } from '../utils/productImages.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  AlertTriangle,
  ArrowRight,
  ScanLine,
  Lock,
  Sparkles,
  Store,
  Shield,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  products: Product[];
  orders: Order[];
  onOpenPOS: () => void;
  onOpenInventory: (filterLowStock?: boolean) => void;
  onOpenAddProduct: () => void;
  onViewInvoice: (order: Order) => void;
  onOpenCustomerDues?: () => void;
  onOpenSecurity?: () => void;
}

const STORE_VISUAL_GALLERY = [
  {
    id: 'flagship',
    title: 'Flagship Supermarket Floor',
    subtitle: 'Main Retail Hall & Checkout Lanes',
    badge: 'LIVE FLOOR',
    image: '/src/assets/images/retail_store_interior_1794242047222.jpg'
  },
  {
    id: 'pos-counter',
    title: 'Smart POS & UPI Billing Desk',
    subtitle: 'Express Barcode & QR Terminal',
    badge: 'POS TERMINAL',
    image: '/src/assets/images/pos_checkout_counter_1794242048129.jpg'
  },
  {
    id: 'aisle',
    title: 'Organized Grocery Aisles',
    subtitle: 'FMCG & Daily Essentials Display',
    badge: 'AISLE DISPLAY',
    image: '/src/assets/images/grocery_aisle_display_1794242048756.jpg'
  },
  {
    id: 'warehouse',
    title: 'Backroom & Inventory Hub',
    subtitle: 'Barcode Stock & Reorder Racks',
    badge: 'STOCKROOM',
    image: '/src/assets/images/store_warehouse_inventory_1794242049393.jpg'
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  products,
  orders,
  onOpenPOS,
  onOpenInventory,
  onViewInvoice,
  onOpenCustomerDues,
  onOpenSecurity
}) => {
  const { user, lockScreen, securityConfig, updateSecurityConfig, switchRole, requireDukandarPin } = useAuth();
  const { t } = useLanguage();
  const [selectedHeroIdx, setSelectedHeroIdx] = useState(0);
  const lowStockCount = metrics?.lowStockCount || products.filter(p => p.stock <= p.minStockThreshold).length;
  const totalCustomerDues = metrics?.totalCustomerDues || 0;
  const customersWithDuesCount = metrics?.customersWithDuesCount || 0;

  const activePhoto = STORE_VISUAL_GALLERY[selectedHeroIdx];
  const isMasked = !!securityConfig.hideFinancials || user?.role === 'cashier';

  const handleTogglePrivacy = async () => {
    if (isMasked) {
      requireDukandarPin('Reveal Today’s Sales & Gross Profit', async () => {
        if (user?.role === 'cashier') switchRole('admin');
        await updateSecurityConfig({ hideFinancials: false });
      });
    } else {
      await updateSecurityConfig({ hideFinancials: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Store Visual Showcase Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-lg bg-slate-950">
        <img
          src={activePhoto.image}
          alt={activePhoto.title}
          referrerPolicy="no-referrer"
          className="w-full h-52 sm:h-60 object-cover opacity-55 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />

        <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activePhoto.badge} • Smart Retail Hub</span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSecurity && (
                <button
                  onClick={onOpenSecurity}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dukandar Security</span>
                </button>
              )}
              <button
                onClick={lockScreen}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold rounded-lg flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer"
                title="View 3D Store Sign-In Experience"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('dash_3d_login', '3D Store Sign-In')}</span>
              </button>
              <button
                onClick={onOpenPOS}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t('dash_new_bill', 'New Bill (POS)')}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t('dash_command_center', 'Retail Store & POS Command Center')}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {activePhoto.title} ({activePhoto.subtitle}) • Real-time GST billing, barcode inventory, and customer Khata ledger.
              </p>
            </div>

            {/* Store Background Photo Selector Thumbnails */}
            <div className="flex items-center gap-2">
              {STORE_VISUAL_GALLERY.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedHeroIdx(idx)}
                  className={`group relative w-14 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    idx === selectedHeroIdx
                      ? 'border-indigo-400 ring-2 ring-indigo-500/40 scale-105'
                      : 'border-white/20 opacity-70 hover:opacity-100'
                  }`}
                  title={item.title}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DUKANDAR SECURITY & COUNTER PRIVACY CONTROL BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span>Dukandar Security Shield</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 font-semibold">
                {user?.role === 'cashier' ? 'Staff / Cashier Mode (Restricted)' : 'Owner Mode (Unlocked)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              PIN-protected settings, inventory edits, profit privacy shield, and 3D counter lock ({securityConfig.hasCustomPin ? 'Custom PIN Active' : 'Default PIN: 1234'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePrivacy}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
              isMasked
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isMasked ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isMasked ? 'Unlock Sales & Profit' : 'Hide Sales & Profit'}</span>
          </button>

          {onOpenSecurity && (
            <button
              type="button"
              onClick={onOpenSecurity}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Set PIN & Security Rules</span>
            </button>
          )}

          <button
            type="button"
            onClick={lockScreen}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Counter</span>
          </button>
        </div>
      </div>

      {/* 5 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('dash_todays_sales', "Today's Sales")}</span>
            {isMasked && <Lock className="w-3 h-3 text-amber-600" />}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {isMasked ? '₹ •••••' : formatCurrency(metrics?.todaySales || 0)}
          </div>
        </div>

        {/* Orders Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">{t('dash_orders_today', 'Orders Today')}</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {metrics?.todayOrdersCount || 0}
          </div>
        </div>

        {/* Customer Dues (Khata / Udhar) */}
        <div
          onClick={() => onOpenCustomerDues && onOpenCustomerDues()}
          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
            totalCustomerDues > 0
              ? 'bg-red-50/40 border-red-200 hover:border-red-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">{t('dash_customer_dues', 'Customer Dues')}</span>
            {customersWithDuesCount > 0 && (
              <span className="text-[10px] text-red-700 font-bold">
                {customersWithDuesCount} cust
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-2">
            {formatCurrency(totalCustomerDues)}
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('dash_gross_margin', 'Gross Margin')}</span>
            {isMasked && <Lock className="w-3 h-3 text-amber-600" />}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {isMasked ? '₹ ••••' : formatCurrency(metrics?.todayProfit || 0)}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => onOpenInventory(true)}
          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
            lowStockCount > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">{t('dash_low_stock', 'Low Stock')}</span>
            {lowStockCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${lowStockCount > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
            {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Grid: Top Selling Items & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t('dash_top_selling', 'Top Selling Items')}
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {metrics?.topSellingProducts && metrics.topSellingProducts.length > 0 ? (
              metrics.topSellingProducts.map(item => (
                <div key={item.productId} className="py-2.5 flex justify-between items-center gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img
                      src={getProductImage({ productId: item.productId, name: item.name })}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.quantity} sold</p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400">No sales recorded yet.</div>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('dash_recent_invoices', 'Recent Invoices')}
            </h2>
            <button
              onClick={onOpenPOS}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>New Bill</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2 font-normal">Invoice</th>
                  <th className="py-2 font-normal">Customer</th>
                  <th className="py-2 font-normal">Method</th>
                  <th className="py-2 font-normal text-right">Amount</th>
                  <th className="py-2 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-mono font-medium text-slate-900">
                        {order.invoiceNumber}
                      </td>
                      <td className="py-2.5 text-slate-700">
                        {order.customerName}
                      </td>
                      <td className="py-2.5">
                        <span className="uppercase text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onViewInvoice(order)}
                          className="px-2 py-0.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All Listed Store Products Photo Showcase */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('dash_all_listed_products', 'All Listed Store Products')} ({products.length} Items)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('dash_listed_subtitle', 'Live product catalog with studio photos, barcodes, and stock levels')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenInventory(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {t('dash_manage_inventory', 'Manage Inventory & Barcodes')}
            </button>
            <button
              onClick={onOpenPOS}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {t('dash_open_pos', 'Open POS Billing')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {products.map(product => {
            const isLowStock = product.stock <= product.minStockThreshold;
            return (
              <div
                key={product.id}
                onClick={onOpenPOS}
                className="group rounded-xl border border-slate-200 hover:border-slate-900 bg-white overflow-hidden transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-28 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-900/80 text-white">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                      {product.barcode}
                    </p>
                  </div>
                </div>

                <div className="px-2.5 pb-2.5 pt-1 flex items-center justify-between border-t border-slate-50">
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {formatCurrency(product.price)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      isLowStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {product.stock} {product.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
