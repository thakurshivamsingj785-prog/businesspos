import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Product, Order, StoreSettings } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface SecurityLogEntry {
  id: string;
  action: string;
  actor: string;
  status: 'success' | 'warning' | 'blocked';
  timestamp: string;
}

export interface SecurityConfig {
  autoLockMinutes: number; // 0 = disabled, or 1, 3, 5, 10, 15
  lockSettings: boolean;
  lockInventoryEdits: boolean;
  lockKhataSettlement: boolean;
  hideFinancials: boolean; // masks daily profit/sales until owner reveals
  maxDiscountPercent: number; // max discount % allowed without PIN (e.g. 10)
  pinHint?: string;
}

export interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  adminCredentials: {
    username: string;
    pin: string; // quick POS unlock pin (default 1234)
    passwordHash: string; // simple hashed or admin token
    securityConfig?: SecurityConfig;
    securityLogs?: SecurityLogEntry[];
  };
}

const defaultSettings: StoreSettings = {
  storeName: "Shree Ganesh Supermarket & Retail",
  ownerName: "Shivam Singh",
  upiId: "shivamretail@okaxis",
  gstin: "27AAACG0564M1Z2",
  phone: "+91 98765 43210",
  email: "contact@shreeganeshretail.com",
  address: "Shop No. 14-16, Galaxy Trade Center, MG Road",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  invoicePrefix: "INV",
  defaultGstRate: 5,
  lowStockThreshold: 10,
  currency: "₹",
  footerNote: "Thank you for shopping with us! Visit again. Goods once sold can be exchanged within 7 days with original invoice."
};

const PRODUCT_DEFAULT_IMAGES: Record<string, string> = {
  "prod-1": "/src/assets/images/prod_atta_5kg_1794242903635.jpg",
  "prod-2": "/src/assets/images/prod_cow_ghee_1l_1794242903605.jpg",
  "prod-3": "/src/assets/images/prod_sunflower_oil_1l_1794242904769.jpg",
  "prod-4": "/src/assets/images/prod_iodized_salt_1kg_1794242905742.jpg",
  "prod-5": "/src/assets/images/prod_basmati_rice_5kg_1794242906664.jpg",
  "prod-6": "/src/assets/images/prod_dairy_milk_silk_1794242907123.jpg",
  "prod-7": "/src/assets/images/prod_toned_milk_1l_1794242908267.jpg",
  "prod-8": "/src/assets/images/prod_liquid_detergent_1l_1794242908405.jpg",
  "prod-9": "/src/assets/images/prod_liquid_handwash_750ml_1794242909253.jpg",
  "prod-10": "/src/assets/images/prod_masala_noodles_pack_1794242910580.jpg",
  "prod-11": "/src/assets/images/prod_instant_coffee_jar_1794242910827.jpg",
  "prod-12": "/src/assets/images/prod_glucose_biscuits_1kg_1794242912396.jpg",
  "prod-13": "/src/assets/images/prod_toothpaste_150g_1794242912899.jpg",
  "prod-14": "/src/assets/images/prod_masala_chips_90g_1794242913995.jpg",
  "prod-15": "/src/assets/images/prod_energy_drink_250ml_1794242915380.jpg"
};

const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Aashirvaad Sharbati Atta 5kg",
    sku: "ATT-ASH-5KG",
    barcode: "8901030382901",
    category: "Grocery & Staples",
    price: 340,
    costPrice: 295,
    stock: 24,
    minStockThreshold: 8,
    unit: "pack",
    imageUrl: "/src/assets/images/prod_atta_5kg_1794242903635.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    name: "Amul Pure Cow Ghee 1L Tin",
    sku: "GHE-AML-1L",
    barcode: "8901262010111",
    category: "Dairy & Bakery",
    price: 645,
    costPrice: 580,
    stock: 14,
    minStockThreshold: 5,
    unit: "tin",
    imageUrl: "/src/assets/images/prod_cow_ghee_1l_1794242903605.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    name: "Fortune Sunlite Refined Oil 1L",
    sku: "OIL-FTN-1L",
    barcode: "8906007280123",
    category: "Grocery & Staples",
    price: 145,
    costPrice: 125,
    stock: 35,
    minStockThreshold: 10,
    unit: "pouch",
    imageUrl: "/src/assets/images/prod_sunflower_oil_1l_1794242904769.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-4",
    name: "Tata Salt Vacuum Evaporated 1kg",
    sku: "SLT-TAT-1KG",
    barcode: "8904043901005",
    category: "Grocery & Staples",
    price: 28,
    costPrice: 22,
    stock: 90,
    minStockThreshold: 20,
    unit: "pack",
    imageUrl: "/src/assets/images/prod_iodized_salt_1kg_1794242905742.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-5",
    name: "India Gate Basmati Rice Rozzana 5kg",
    sku: "RIC-ING-5KG",
    barcode: "8901725181055",
    category: "Grocery & Staples",
    price: 499,
    costPrice: 410,
    stock: 18,
    minStockThreshold: 6,
    unit: "bag",
    imageUrl: "/src/assets/images/prod_basmati_rice_5kg_1794242906664.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-6",
    name: "Cadbury Dairy Milk Silk 150g",
    sku: "CHC-CDB-150G",
    barcode: "7622201438902",
    category: "Chocolates & Snacks",
    price: 180,
    costPrice: 145,
    stock: 45,
    minStockThreshold: 12,
    unit: "pcs",
    imageUrl: "/src/assets/images/prod_dairy_milk_silk_1794242907123.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-7",
    name: "Amul Taaza Fresh Toned Milk 1L",
    sku: "MLK-AML-1L",
    barcode: "8901262150022",
    category: "Dairy & Bakery",
    price: 56,
    costPrice: 49,
    stock: 4, // LOW STOCK TRIGGER!
    minStockThreshold: 15,
    unit: "pouch",
    imageUrl: "/src/assets/images/prod_toned_milk_1l_1794242908267.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-8",
    name: "Surf Excel Matic Front Load 1L",
    sku: "DET-SRF-1L",
    barcode: "8901030748921",
    category: "Household & Cleaning",
    price: 230,
    costPrice: 185,
    stock: 16,
    minStockThreshold: 6,
    unit: "bottle",
    imageUrl: "/src/assets/images/prod_liquid_detergent_1l_1794242908405.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-9",
    name: "Dettol Original Liquid Handwash 750ml",
    sku: "HW-DTL-750M",
    barcode: "8901396112211",
    category: "Personal Care",
    price: 119,
    costPrice: 92,
    stock: 3, // LOW STOCK TRIGGER!
    minStockThreshold: 8,
    unit: "pouch",
    imageUrl: "/src/assets/images/prod_liquid_handwash_750ml_1794242909253.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-10",
    name: "Maggi 2-Minute Masala Noodles 420g",
    sku: "NDL-MGI-420G",
    barcode: "8901058852331",
    category: "Instant Food",
    price: 96,
    costPrice: 78,
    stock: 50,
    minStockThreshold: 15,
    unit: "pack",
    imageUrl: "/src/assets/images/prod_masala_noodles_pack_1794242910580.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-11",
    name: "Nescafe Classic Coffee Glass Jar 100g",
    sku: "BEV-NSC-100G",
    barcode: "7613035987112",
    category: "Beverages",
    price: 320,
    costPrice: 260,
    stock: 22,
    minStockThreshold: 8,
    unit: "jar",
    imageUrl: "/src/assets/images/prod_instant_coffee_jar_1794242910827.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-12",
    name: "Parle-G Gold Glucose Biscuits 1kg",
    sku: "BSC-PRL-1KG",
    barcode: "8901719102011",
    category: "Chocolates & Snacks",
    price: 90,
    costPrice: 74,
    stock: 40,
    minStockThreshold: 12,
    unit: "pack",
    imageUrl: "/src/assets/images/prod_glucose_biscuits_1kg_1794242912396.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-13",
    name: "Colgate Total 12H Anti-Germ 150g",
    sku: "OC-CLG-150G",
    barcode: "8901314510012",
    category: "Personal Care",
    price: 155,
    costPrice: 120,
    stock: 2, // CRITICAL LOW STOCK
    minStockThreshold: 10,
    unit: "pcs",
    imageUrl: "/src/assets/images/prod_toothpaste_150g_1794242912899.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-14",
    name: "Lay's Magic Masala Potato Chips 90g",
    sku: "SNK-LAY-90G",
    barcode: "8901491101824",
    category: "Chocolates & Snacks",
    price: 30,
    costPrice: 24,
    stock: 65,
    minStockThreshold: 20,
    unit: "pack",
    imageUrl: "/src/assets/images/prod_masala_chips_90g_1794242913995.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-15",
    name: "Red Bull Energy Drink Can 250ml",
    sku: "BEV-RDB-250M",
    barcode: "9002490100070",
    category: "Beverages",
    price: 125,
    costPrice: 102,
    stock: 28,
    minStockThreshold: 10,
    unit: "can",
    imageUrl: "/src/assets/images/prod_energy_drink_250ml_1794242915380.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Seed sample orders for realistic dashboard metrics
const seedOrders: Order[] = [
  {
    id: "ord-1",
    invoiceNumber: "INV-20261107-001",
    customerName: "Rajesh Sharma",
    customerPhone: "9823012345",
    items: [
      {
        productId: "prod-1",
        name: "Aashirvaad Sharbati Atta 5kg",
        sku: "ATT-ASH-5KG",
        barcode: "8901030382901",
        category: "Grocery & Staples",
        price: 340,
        costPrice: 295,
        quantity: 1,
        unit: "pack",
        discount: 0,
        total: 340
      },
      {
        productId: "prod-4",
        name: "Tata Salt Vacuum Evaporated 1kg",
        sku: "SLT-TAT-1KG",
        barcode: "8904043901005",
        category: "Grocery & Staples",
        price: 28,
        costPrice: 22,
        quantity: 2,
        unit: "pack",
        discount: 0,
        total: 56
      }
    ],
    subtotal: 396,
    discountType: "percentage",
    discountValue: 0,
    discountAmount: 0,
    gstRate: 5,
    gstAmount: 19.8,
    totalAmount: 415.8,
    totalCostPrice: 339,
    profit: 76.8,
    paymentMethod: "upi",
    paymentStatus: "paid",
    upiRefNumber: "UPI-431809214702",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "ord-2",
    invoiceNumber: "INV-20261107-002",
    customerName: "Pooja Verma",
    customerPhone: "9765432190",
    items: [
      {
        productId: "prod-2",
        name: "Amul Pure Cow Ghee 1L Tin",
        sku: "GHE-AML-1L",
        barcode: "8901262010111",
        category: "Dairy & Bakery",
        price: 645,
        costPrice: 580,
        quantity: 1,
        unit: "tin",
        discount: 20,
        total: 625
      },
      {
        productId: "prod-6",
        name: "Cadbury Dairy Milk Silk 150g",
        sku: "CHC-CDB-150G",
        barcode: "7622201438902",
        category: "Chocolates & Snacks",
        price: 180,
        costPrice: 145,
        quantity: 2,
        unit: "pcs",
        discount: 0,
        total: 360
      }
    ],
    subtotal: 985,
    discountType: "fixed",
    discountValue: 20,
    discountAmount: 20,
    gstRate: 5,
    gstAmount: 48.25,
    totalAmount: 1013.25,
    totalCostPrice: 870,
    profit: 143.25,
    paymentMethod: "cash",
    paymentStatus: "paid",
    cashReceived: 1100,
    changeGiven: 86.75,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];

class Database {
  data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.readFromDisk();
  }

  ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  readFromDisk(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products)) {
          let updated = false;
          parsed.products = parsed.products.map((p: Product) => {
            if (!p.imageUrl && PRODUCT_DEFAULT_IMAGES[p.id]) {
              updated = true;
              return { ...p, imageUrl: PRODUCT_DEFAULT_IMAGES[p.id] };
            }
            return p;
          });
          if (updated) {
            this.writeToDisk(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Could not read DB file, initializing with defaults:", err);
    }

    const initialData: DatabaseSchema = {
      products: initialProducts,
      orders: seedOrders,
      settings: defaultSettings,
      adminCredentials: {
        username: "admin",
        pin: "1234",
        passwordHash: "admin123",
        securityConfig: {
          autoLockMinutes: 0,
          lockSettings: true,
          lockInventoryEdits: true,
          lockKhataSettlement: false,
          hideFinancials: false,
          maxDiscountPercent: 15,
          pinHint: "Default PIN is 1234"
        }
      }
    };
    this.writeToDisk(initialData);
    return initialData;
  }

  writeToDisk(data: DatabaseSchema) {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to write to DB file:", err);
    }
  }

  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  getProductByBarcode(barcode: string): Product | undefined {
    return this.data.products.find(p => p.barcode === barcode);
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.writeToDisk(this.data);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeToDisk(this.data);
    return this.data.products[index];
  }

  deleteProduct(id: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.writeToDisk(this.data);
      return true;
    }
    return false;
  }

  adjustStock(id: string, delta: number): Product | null {
    const product = this.getProductById(id);
    if (!product) return null;
    const newStock = Math.max(0, product.stock + delta);
    return this.updateProduct(id, { stock: newStock });
  }

  getOrders(): Order[] {
    return this.data.orders.map(o => ({
      ...o,
      amountPaid: o.amountPaid !== undefined ? o.amountPaid : (o.paymentStatus === 'paid' ? o.totalAmount : 0),
      amountDue: o.amountDue !== undefined ? o.amountDue : (o.paymentStatus === 'paid' ? 0 : o.totalAmount)
    }));
  }

  getOrderById(id: string): Order | undefined {
    const o = this.data.orders.find(ord => ord.id === id);
    if (!o) return undefined;
    return {
      ...o,
      amountPaid: o.amountPaid !== undefined ? o.amountPaid : (o.paymentStatus === 'paid' ? o.totalAmount : 0),
      amountDue: o.amountDue !== undefined ? o.amountDue : (o.paymentStatus === 'paid' ? 0 : o.totalAmount)
    };
  }

  createOrder(orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>): Order {
    // Generate Invoice Number: INV-YYYYMMDD-SEQ
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const todaysOrders = this.data.orders.filter(o => o.createdAt.startsWith(today.toISOString().slice(0, 10)));
    const seq = (todaysOrders.length + 1).toString().padStart(3, '0');
    const invoiceNumber = `${this.data.settings.invoicePrefix || 'INV'}-${dateStr}-${seq}`;

    // Deduct stock in real-time
    for (const item of orderData.items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        this.updateProduct(prod.id, { stock: newStock });
      }
    }

    const totalAmount = Number(orderData.totalAmount);
    let amountPaid = orderData.amountPaid !== undefined ? Number(orderData.amountPaid) : totalAmount;
    let amountDue = orderData.amountDue !== undefined ? Number(orderData.amountDue) : Math.max(0, totalAmount - amountPaid);

    let paymentStatus = orderData.paymentStatus;
    if (amountDue <= 0) {
      paymentStatus = 'paid';
      amountDue = 0;
      amountPaid = totalAmount;
    } else if (amountPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    const newOrder: Order = {
      ...orderData,
      amountPaid,
      amountDue,
      paymentStatus,
      id: `ord-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);
    this.writeToDisk(this.data);
    return newOrder;
  }

  getCustomerDues(): {
    customerName: string;
    customerPhone: string;
    totalOrders: number;
    totalBilled: number;
    totalPaid: number;
    totalDue: number;
    lastOrderDate: string;
    orders: Order[];
  }[] {
    const customerMap = new Map<string, {
      customerName: string;
      customerPhone: string;
      totalOrders: number;
      totalBilled: number;
      totalPaid: number;
      totalDue: number;
      lastOrderDate: string;
      orders: Order[];
    }>();

    for (const rawOrder of this.data.orders) {
      const order = {
        ...rawOrder,
        amountPaid: rawOrder.amountPaid !== undefined ? rawOrder.amountPaid : (rawOrder.paymentStatus === 'paid' ? rawOrder.totalAmount : 0),
        amountDue: rawOrder.amountDue !== undefined ? rawOrder.amountDue : (rawOrder.paymentStatus === 'paid' ? 0 : rawOrder.totalAmount)
      };

      const key = (order.customerPhone && order.customerPhone.trim())
        ? order.customerPhone.trim()
        : order.customerName.trim().toLowerCase();

      if (!key || key === 'walk-in customer') {
        // If walk-in with an amount due, group under phone or individual
        if (order.amountDue <= 0) continue;
      }

      const existing = customerMap.get(key) || {
        customerName: order.customerName || 'Walk-in Customer',
        customerPhone: order.customerPhone || '',
        totalOrders: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalDue: 0,
        lastOrderDate: order.createdAt,
        orders: []
      };

      existing.totalOrders += 1;
      existing.totalBilled += order.totalAmount;
      existing.totalPaid += order.amountPaid;
      existing.totalDue += order.amountDue;
      existing.orders.push(order);

      if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.createdAt;
      }
      if (order.customerName && order.customerName !== 'Walk-in Customer') {
        existing.customerName = order.customerName;
      }
      if (order.customerPhone && !existing.customerPhone) {
        existing.customerPhone = order.customerPhone;
      }

      customerMap.set(key, existing);
    }

    return Array.from(customerMap.values())
      .map(c => ({
        ...c,
        totalBilled: Math.round(c.totalBilled * 100) / 100,
        totalPaid: Math.round(c.totalPaid * 100) / 100,
        totalDue: Math.round(c.totalDue * 100) / 100
      }))
      .sort((a, b) => b.totalDue - a.totalDue);
  }

  getCustomerDueByQuery(query: string): {
    customerName: string;
    customerPhone: string;
    totalDue: number;
    totalBilled: number;
    totalPaid: number;
    pendingOrdersCount: number;
  } | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const allDues = this.getCustomerDues();
    const matched = allDues.find(d =>
      (d.customerPhone && d.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))) ||
      d.customerName.toLowerCase().includes(q)
    );

    if (!matched) return null;
    return {
      customerName: matched.customerName,
      customerPhone: matched.customerPhone,
      totalDue: matched.totalDue,
      totalBilled: matched.totalBilled,
      totalPaid: matched.totalPaid,
      pendingOrdersCount: matched.orders.filter(o => (o.amountDue || 0) > 0).length
    };
  }

  recordCustomerPayment(orderId: string, amount: number, _paymentMethod: 'upi' | 'cash' = 'cash'): Order | null {
    const index = this.data.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = this.data.orders[index];
    const currentPaid = order.amountPaid !== undefined ? order.amountPaid : (order.paymentStatus === 'paid' ? order.totalAmount : 0);
    const newPaid = Math.min(order.totalAmount, currentPaid + amount);
    const newDue = Math.max(0, order.totalAmount - newPaid);

    order.amountPaid = Math.round(newPaid * 100) / 100;
    order.amountDue = Math.round(newDue * 100) / 100;
    order.paymentStatus = order.amountDue <= 0 ? 'paid' : 'partial';

    this.writeToDisk(this.data);
    return order;
  }

  settleAllCustomerDues(customerKey: string, amount: number, _paymentMethod: 'upi' | 'cash' = 'cash'): { settledCount: number; remainingPayment: number } {
    let remaining = amount;
    let settledCount = 0;

    for (const order of this.data.orders) {
      if (remaining <= 0) break;

      const matchesPhone = order.customerPhone && order.customerPhone.trim() === customerKey.trim();
      const matchesName = order.customerName && order.customerName.trim().toLowerCase() === customerKey.trim().toLowerCase();

      if (matchesPhone || matchesName) {
        const orderDue = order.amountDue !== undefined ? order.amountDue : (order.paymentStatus === 'paid' ? 0 : order.totalAmount);
        if (orderDue > 0) {
          const payTowardsOrder = Math.min(orderDue, remaining);
          const currentPaid = order.amountPaid !== undefined ? order.amountPaid : (order.paymentStatus === 'paid' ? order.totalAmount : 0);
          order.amountPaid = Math.round((currentPaid + payTowardsOrder) * 100) / 100;
          order.amountDue = Math.round((orderDue - payTowardsOrder) * 100) / 100;
          order.paymentStatus = order.amountDue <= 0 ? 'paid' : 'partial';
          remaining -= payTowardsOrder;
          settledCount++;
        }
      }
    }

    this.writeToDisk(this.data);
    return { settledCount, remainingPayment: Math.round(remaining * 100) / 100 };
  }

  getSettings(): StoreSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.writeToDisk(this.data);
    return this.data.settings;
  }

  verifyAdminPin(pin: string): boolean {
    const valid = this.data.adminCredentials.pin === pin;
    this.addSecurityLog(
      valid ? 'Terminal / Action PIN Verified' : 'Failed PIN Verification Attempt',
      'admin',
      valid ? 'success' : 'blocked'
    );
    return valid;
  }

  verifyAdminPassword(password: string): boolean {
    return this.data.adminCredentials.passwordHash === password;
  }

  updateAdminPin(newPin: string): boolean {
    this.data.adminCredentials.pin = newPin;
    this.addSecurityLog('Dukandar Security PIN Updated', 'admin', 'warning');
    this.writeToDisk(this.data);
    return true;
  }

  updateAdminPassword(newPassword: string): boolean {
    this.data.adminCredentials.passwordHash = newPassword;
    this.addSecurityLog('Admin Password Updated', 'admin', 'warning');
    this.writeToDisk(this.data);
    return true;
  }

  addSecurityLog(action: string, actor = 'admin', status: 'success' | 'warning' | 'blocked' = 'success'): SecurityLogEntry {
    if (!Array.isArray(this.data.adminCredentials.securityLogs)) {
      this.data.adminCredentials.securityLogs = [];
    }
    const entry: SecurityLogEntry = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      actor,
      status,
      timestamp: new Date().toISOString()
    };
    this.data.adminCredentials.securityLogs.unshift(entry);
    this.data.adminCredentials.securityLogs = this.data.adminCredentials.securityLogs.slice(0, 40);
    this.writeToDisk(this.data);
    return entry;
  }

  clearSecurityLogs(): void {
    this.data.adminCredentials.securityLogs = [];
    this.addSecurityLog('Security Audit Logs Cleared by Owner', 'admin', 'warning');
  }

  getSecurityConfig(): SecurityConfig & { hasCustomPin: boolean; logs: SecurityLogEntry[] } {
    const cfg = this.data.adminCredentials.securityConfig || {
      autoLockMinutes: 0,
      lockSettings: true,
      lockInventoryEdits: true,
      lockKhataSettlement: false,
      hideFinancials: false,
      maxDiscountPercent: 15,
      pinHint: "Default PIN is 1234"
    };
    if (!Array.isArray(this.data.adminCredentials.securityLogs) || this.data.adminCredentials.securityLogs.length === 0) {
      this.data.adminCredentials.securityLogs = [
        {
          id: 'sec-init-1',
          action: 'Dukandar Security Shield Initialized (UPI & Settings Protected)',
          actor: 'Owner (Dukandar)',
          status: 'success',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'sec-init-2',
          action: 'POS Terminal Authenticated via 3D Security Gate',
          actor: 'Owner (Dukandar)',
          status: 'success',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ];
    }
    return {
      autoLockMinutes: cfg.autoLockMinutes ?? 0,
      lockSettings: cfg.lockSettings ?? true,
      lockInventoryEdits: cfg.lockInventoryEdits ?? true,
      lockKhataSettlement: cfg.lockKhataSettlement ?? false,
      hideFinancials: cfg.hideFinancials ?? false,
      maxDiscountPercent: cfg.maxDiscountPercent ?? 15,
      pinHint: cfg.pinHint || "Default PIN is 1234",
      hasCustomPin: this.data.adminCredentials.pin !== "1234",
      logs: this.data.adminCredentials.securityLogs
    };
  }

  updateSecurityConfig(updates: Partial<SecurityConfig> & { currentPin?: string; newPin?: string; newPassword?: string }): {
    success: boolean;
    error?: string;
    config?: SecurityConfig & { hasCustomPin: boolean; logs: SecurityLogEntry[] };
  } {
    // If changing PIN or password, verify currentPin if provided
    if (updates.newPin || updates.newPassword) {
      if (updates.currentPin && this.data.adminCredentials.pin !== updates.currentPin && !this.verifyAdminPassword(updates.currentPin)) {
        this.addSecurityLog('Blocked Unauthorized PIN Change Attempt', 'unknown', 'blocked');
        return { success: false, error: "Current PIN or Password is incorrect." };
      }
      if (updates.newPin) {
        const cleanPin = updates.newPin.trim();
        if (!/^\d{4,6}$/.test(cleanPin)) {
          return { success: false, error: "New PIN must be 4 to 6 digits." };
        }
        this.data.adminCredentials.pin = cleanPin;
        this.addSecurityLog(`Dukandar PIN Changed (${cleanPin.length} digits)`, 'Owner (Dukandar)', 'warning');
      }
      if (updates.newPassword && updates.newPassword.trim().length >= 4) {
        this.data.adminCredentials.passwordHash = updates.newPassword.trim();
        this.addSecurityLog('Store Owner Password Updated', 'Owner (Dukandar)', 'warning');
      }
    }

    const currentCfg = this.data.adminCredentials.securityConfig || {
      autoLockMinutes: 0,
      lockSettings: true,
      lockInventoryEdits: true,
      lockKhataSettlement: false,
      hideFinancials: false,
      maxDiscountPercent: 15
    };

    this.data.adminCredentials.securityConfig = {
      autoLockMinutes: updates.autoLockMinutes !== undefined ? Number(updates.autoLockMinutes) : currentCfg.autoLockMinutes,
      lockSettings: updates.lockSettings !== undefined ? Boolean(updates.lockSettings) : currentCfg.lockSettings,
      lockInventoryEdits: updates.lockInventoryEdits !== undefined ? Boolean(updates.lockInventoryEdits) : currentCfg.lockInventoryEdits,
      lockKhataSettlement: updates.lockKhataSettlement !== undefined ? Boolean(updates.lockKhataSettlement) : currentCfg.lockKhataSettlement,
      hideFinancials: updates.hideFinancials !== undefined ? Boolean(updates.hideFinancials) : (currentCfg.hideFinancials ?? false),
      maxDiscountPercent: updates.maxDiscountPercent !== undefined ? Number(updates.maxDiscountPercent) : (currentCfg.maxDiscountPercent ?? 15),
      pinHint: updates.pinHint !== undefined ? updates.pinHint : currentCfg.pinHint
    };

    this.addSecurityLog('Security Policy & Lock Configuration Updated', 'Owner (Dukandar)', 'success');
    this.writeToDisk(this.data);
    return {
      success: true,
      config: this.getSecurityConfig()
    };
  }

  getDashboardMetrics() {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = this.data.orders.filter(o => o.createdAt.startsWith(today));

    const todaySales = todayOrders.reduce((sum, o) => {
      const paid = o.amountPaid !== undefined ? o.amountPaid : (o.paymentStatus === 'paid' ? o.totalAmount : 0);
      return sum + paid;
    }, 0);
    const todayProfit = todayOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.profit : 0), 0);

    const lowStockCount = this.data.products.filter(p => p.stock > 0 && p.stock <= p.minStockThreshold).length;
    const outOfStockCount = this.data.products.filter(p => p.stock <= 0).length;

    // Customer dues calculation
    const allCustomerDues = this.getCustomerDues();
    const totalCustomerDues = allCustomerDues.reduce((sum, c) => sum + Math.max(0, c.totalDue), 0);
    const customersWithDuesCount = allCustomerDues.filter(c => c.totalDue > 0).length;

    // Top selling product aggregation
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of this.data.orders) {
      for (const item of order.items) {
        const current = productSalesMap.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.total;
        productSalesMap.set(item.productId, current);
      }
    }

    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      todayProfit,
      totalProducts: this.data.products.length,
      lowStockCount,
      outOfStockCount,
      totalCustomerDues,
      customersWithDuesCount,
      topSellingProducts,
      recentOrders: this.getOrders().slice(0, 10)
    };
  }
}

export const db = new Database();
