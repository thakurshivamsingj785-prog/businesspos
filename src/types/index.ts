export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number; // Selling Price in ₹
  costPrice: number; // Cost Price in ₹
  stock: number;
  minStockThreshold: number;
  unit: string; // e.g. "pcs", "kg", "pack", "ltr"
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // item level discount in ₹
  finalPrice: number; // price per unit after discount
  total: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  gstRate: number; // e.g., 0, 5, 12, 18
  gstAmount: number;
  totalAmount: number;
  totalCostPrice: number;
  profit: number;
  paymentMethod: 'upi' | 'cash' | 'card' | 'split' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'partial';
  amountPaid?: number; // actual amount paid
  amountDue?: number; // remaining due / udhar
  upiRefNumber?: string;
  cashReceived?: number;
  changeGiven?: number;
  notes?: string;
  createdAt: string;
}

export interface CustomerDue {
  customerName: string;
  customerPhone: string;
  totalOrders: number;
  totalBilled: number;
  totalPaid: number;
  totalDue: number; // net outstanding balance (Udhar)
  lastOrderDate: string;
  orders: Order[];
}

export interface StoreSettings {
  storeName: string;
  ownerName: string;
  upiId: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  invoicePrefix: string;
  defaultGstRate: number;
  lowStockThreshold: number;
  currency: string;
  footerNote: string;
}

export interface DashboardMetrics {
  todaySales: number;
  todayOrdersCount: number;
  todayProfit: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCustomerDues: number;
  customersWithDuesCount: number;
  topSellingProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentOrders: Order[];
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  role: 'admin' | 'cashier';
}
