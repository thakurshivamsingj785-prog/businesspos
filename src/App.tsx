import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { api } from './services/api.ts';
import { Product, Order, StoreSettings, DashboardMetrics, CustomerDue } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { POSBillingView } from './components/POSBillingView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { OrdersListView } from './components/OrdersListView.tsx';
import { CustomerDuesView } from './components/CustomerDuesView.tsx';
import { SecurityCenterView } from './components/SecurityCenterView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { LockScreen } from './components/LockScreen.tsx';
import { Loader2, AlertCircle } from 'lucide-react';

function POSApp() {
  const { isLocked, isAuthenticated, user, securityConfig, requireDukandarPin } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'pos' | 'inventory' | 'orders' | 'dues' | 'security' | 'settings'>('dashboard');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dues, setDues] = useState<CustomerDue[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  const [inventoryLowStockFilter, setInventoryLowStockFilter] = useState(false);
  const [duesSearchQuery, setDuesSearchQuery] = useState('');

  // Load all initial data from server
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [prodsData, ordersData, duesData, settingsData, metricsData] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getCustomerDues(),
        api.getSettings(),
        api.getDashboardMetrics()
      ]);
      setProducts(prodsData);
      setOrders(ordersData);
      setDues(duesData);
      setSettings(settingsData);
      setMetrics(metricsData);
    } catch (err: any) {
      console.error('Failed to load initial POS data:', err);
      setError('Could not connect to the backend server. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global F2 shortcut to jump to POS billing
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('pos');
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const [autoPrintRequested, setAutoPrintRequested] = useState(false);

  // Handlers for POS Sale Completion
  const handleCompleteSale = async (orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Order> => {
    const newOrder = await api.createOrder(orderData);
    // Refresh products, metrics, orders to reflect stock deduction immediately
    loadData();
    return newOrder;
  };

  const handleSaleSuccess = (order: Order, options?: { autoPrint?: boolean }) => {
    setAutoPrintRequested(!!options?.autoPrint);
    setActiveInvoice(order);
  };

  // Handlers for Inventory management
  const handleAddProduct = async (newProd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    await api.addProduct(newProd);
    await loadData();
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    if (securityConfig.lockInventoryEdits && user?.role === 'cashier') {
      requireDukandarPin('Edit Inventory Product', async () => {
        await api.updateProduct(id, updates);
        await loadData();
      });
      return;
    }
    await api.updateProduct(id, updates);
    await loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (securityConfig.lockInventoryEdits) {
      requireDukandarPin('Delete Product from Inventory', async () => {
        await api.deleteProduct(id);
        await loadData();
      });
      return;
    }
    await api.deleteProduct(id);
    await loadData();
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    await api.adjustStock(id, delta);
    await loadData();
  };

  // Handlers for Settings
  const handleUpdateSettings = async (updates: Partial<StoreSettings>) => {
    const updated = await api.updateSettings(updates);
    setSettings(updated);
  };

  // Handler for Customer Due Settlement
  const handleSettlePayment = async (customerKey: string, amount: number, paymentMethod: 'upi' | 'cash') => {
    if (securityConfig.lockKhataSettlement) {
      requireDukandarPin(`Settle Khata Payment (₹${amount})`, async () => {
        await api.settleCustomerDues(customerKey, amount, paymentMethod);
        await loadData();
      });
      return;
    }
    await api.settleCustomerDues(customerKey, amount, paymentMethod);
    await loadData();
  };

  if (loading && !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
        <h2 className="text-sm font-semibold text-slate-800">Starting BusinessPOS Retail Engine...</h2>
        <p className="text-xs text-slate-500 mt-1">Initializing stock database and billing services</p>
      </div>
    );
  }

  const lowStockCount = products.filter(p => p.stock <= p.minStockThreshold).length;
  const customersWithDuesCount = dues.filter(d => d.totalDue > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* 3D Sign-in & Lock screen overlay if unauthenticated or locked */}
      {(!isAuthenticated || isLocked) && <LockScreen />}

      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={tab => {
          setInventoryLowStockFilter(false);
          if ((tab === 'settings' || tab === 'security') && securityConfig.lockSettings && user?.role === 'cashier') {
            requireDukandarPin(`Access ${tab === 'security' ? 'Security Center' : 'Store Settings'}`, () => setCurrentTab(tab));
            return;
          }
          setCurrentTab(tab);
        }}
        lowStockCount={lowStockCount}
        duesCount={customersWithDuesCount}
        storeName={settings?.storeName}
        upiId={settings?.upiId}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-2.5 py-1 bg-white border border-red-200 rounded text-red-700 font-semibold hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            products={products}
            orders={orders}
            onOpenPOS={() => setCurrentTab('pos')}
            onOpenInventory={(filterLowStock) => {
              setInventoryLowStockFilter(!!filterLowStock);
              setCurrentTab('inventory');
            }}
            onOpenAddProduct={() => setCurrentTab('inventory')}
            onViewInvoice={order => setActiveInvoice(order)}
            onOpenCustomerDues={() => setCurrentTab('dues')}
            onOpenSecurity={() => setCurrentTab('security')}
          />
        )}

        {/* Tab 2: POS BILLING */}
        {currentTab === 'pos' && settings && (
          <POSBillingView
            products={products}
            settings={settings}
            onCompleteSale={handleCompleteSale}
            onSaleSuccess={handleSaleSuccess}
            onUpdateSettings={handleUpdateSettings}
            onOpenCustomerDues={(searchQ) => {
              setDuesSearchQuery(searchQ || '');
              setCurrentTab('dues');
            }}
          />
        )}

        {/* Tab 3: INVENTORY & STOCK */}
        {currentTab === 'inventory' && (
          <InventoryView
            products={products}
            initialFilterLowStock={inventoryLowStockFilter}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {/* Tab 4: INVOICES & ORDERS */}
        {currentTab === 'orders' && settings && (
          <OrdersListView
            orders={orders}
            settings={settings}
            onViewInvoice={order => setActiveInvoice(order)}
          />
        )}

        {/* Tab 5: CUSTOMER DUES (KHATA / UDHAR) */}
        {currentTab === 'dues' && settings && (
          <CustomerDuesView
            dues={dues}
            settings={settings}
            onSettlePayment={handleSettlePayment}
            onViewInvoice={order => setActiveInvoice(order)}
            onOpenPOS={() => setCurrentTab('pos')}
            initialSearchQuery={duesSearchQuery}
          />
        )}

        {/* Tab 6: DUKANDAR SECURITY CENTER */}
        {currentTab === 'security' && <SecurityCenterView />}

        {/* Tab 7: STORE SETTINGS */}
        {currentTab === 'settings' && settings && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Invoice Modal for View / Print / PDF */}
      {activeInvoice && settings && (
        <InvoiceModal
          order={activeInvoice}
          settings={settings}
          autoPrint={autoPrintRequested}
          onClose={() => {
            setActiveInvoice(null);
            setAutoPrintRequested(false);
          }}
          onNewSale={() => {
            setActiveInvoice(null);
            setAutoPrintRequested(false);
            setCurrentTab('pos');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <POSApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
