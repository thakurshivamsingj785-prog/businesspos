import { Product, Order, StoreSettings, DashboardMetrics } from '../types/index.ts';

const API_BASE = '/api';

export const api = {
  // Products
  async getProducts(params?: { search?: string; category?: string; lowStock?: boolean }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.lowStock) query.set('lowStock', 'true');

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProductByBarcode(barcode: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/barcode/${encodeURIComponent(barcode)}`);
    if (!res.ok) throw new Error('Product not found with this barcode');
    return res.json();
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add product');
    }
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  async adjustStock(id: string, delta: number): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    if (!res.ok) throw new Error('Failed to adjust stock');
    return res.json();
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  async createOrder(orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return res.json();
  },

  // Customer Dues (Khata / Udhar)
  async getCustomerDues(search?: string): Promise<any[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/dues${query}`);
    if (!res.ok) throw new Error('Failed to fetch customer dues');
    return res.json();
  },

  async checkCustomerDue(customerQuery: string): Promise<any> {
    if (!customerQuery.trim()) return null;
    const res = await fetch(`${API_BASE}/dues/check?query=${encodeURIComponent(customerQuery)}`);
    if (!res.ok) return null;
    return res.json();
  },

  async settleCustomerDues(customerKey: string, amount: number, paymentMethod: 'upi' | 'cash' = 'cash'): Promise<{ success: boolean; settledCount: number; remainingPayment: number }> {
    const res = await fetch(`${API_BASE}/dues/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerKey, amount, paymentMethod })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to settle dues');
    }
    return res.json();
  },

  async recordOrderPayment(orderId: string, amount: number, paymentMethod: 'upi' | 'cash' = 'cash'): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/record-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethod })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  },

  // Dashboard & Settings
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  async getSettings(): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch store settings');
    return res.json();
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Auth & Dukandar Security Lock
  async login(payload: { username?: string; email?: string; password?: string; pin?: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }
    return res.json();
  },

  async getSecurityConfig() {
    const res = await fetch(`${API_BASE}/auth/security`);
    if (!res.ok) throw new Error('Failed to load security config');
    return res.json();
  },

  async updateSecurityConfig(payload: {
    autoLockMinutes?: number;
    lockSettings?: boolean;
    lockInventoryEdits?: boolean;
    lockKhataSettlement?: boolean;
    hideFinancials?: boolean;
    maxDiscountPercent?: number;
    pinHint?: string;
    currentPin?: string;
    newPin?: string;
    newPassword?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/security`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update security settings');
    }
    return res.json();
  },

  async verifyPin(pin: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.ok;
  },

  async clearSecurityLogs() {
    const res = await fetch(`${API_BASE}/auth/security/clear-logs`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to clear security logs');
    return res.json();
  }
};

