import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Dev server in AI Studio must listen on port 3000. NGINX reverse-proxies from 8080 to 3000.
  const PORT = 3000;

  app.use(express.json());

  // -------------------- AUTH & DUKANDAR SECURITY ROUTES --------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, email, password, pin } = req.body;
    const loginIdentifier = (email || username || '').trim();

    if (pin) {
      if (db.verifyAdminPin(pin)) {
        return res.json({ success: true, user: { username: "admin", role: "admin" } });
      }
      const secCfg = db.getSecurityConfig();
      return res.status(401).json({
        error: `Invalid Dukandar PIN code. ${secCfg.pinHint ? `(${secCfg.pinHint})` : ''}`
      });
    }

    if (
      (loginIdentifier === 'admin' || loginIdentifier === 'admin@businesspos.com' || loginIdentifier.includes('admin') || loginIdentifier === 'owner@store.com') &&
      (db.verifyAdminPassword(password) || password === 'admin123')
    ) {
      return res.json({ success: true, user: { username: "admin", role: "admin" } });
    }

    // Cashier fast login
    if ((loginIdentifier === 'cashier' || loginIdentifier === 'cashier@businesspos.com') && password === 'cashier123') {
      return res.json({ success: true, user: { username: "cashier", role: "cashier" } });
    }

    // Standard demo fallback: if any valid email and password provided, authenticate as admin/store owner
    if (loginIdentifier && password && password.length >= 4) {
      return res.json({ success: true, user: { username: loginIdentifier.split('@')[0], role: "admin" } });
    }

    return res.status(401).json({ error: "Invalid credentials. (Hint: admin@businesspos.com / admin123 or PIN: 1234)" });
  });

  app.get('/api/auth/security', (_req: Request, res: Response) => {
    try {
      res.json(db.getSecurityConfig());
    } catch {
      res.status(500).json({ error: 'Failed to load security config' });
    }
  });

  app.put('/api/auth/security', (req: Request, res: Response) => {
    try {
      const result = db.updateSecurityConfig(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to update security settings' });
      }
      res.json(result.config);
    } catch {
      res.status(500).json({ error: 'Failed to update security settings' });
    }
  });

  app.post('/api/auth/verify-pin', (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ valid: false, error: 'PIN is required' });
      }
      const valid = db.verifyAdminPin(String(pin).trim());
      if (!valid) {
        return res.status(401).json({ valid: false, error: 'Incorrect Dukandar PIN' });
      }
      res.json({ valid: true, securityConfig: db.getSecurityConfig() });
    } catch {
      res.status(500).json({ valid: false, error: 'Failed to verify PIN' });
    }
  });

  app.post('/api/auth/security/clear-logs', (_req: Request, res: Response) => {
    try {
      db.clearSecurityLogs();
      res.json(db.getSecurityConfig());
    } catch {
      res.status(500).json({ error: 'Failed to clear security logs' });
    }
  });

  // -------------------- PRODUCT ROUTES --------------------
  app.get('/api/products', (req: Request, res: Response) => {
    try {
      let products = db.getProducts();
      const { search, category, lowStock } = req.query;

      if (search && typeof search === 'string') {
        const query = search.toLowerCase().trim();
        products = products.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.barcode.includes(query) ||
          p.category.toLowerCase().includes(query)
        );
      }

      if (category && typeof category === 'string' && category !== 'All') {
        products = products.filter(p => p.category === category);
      }

      if (lowStock === 'true') {
        products = products.filter(p => p.stock <= p.minStockThreshold);
      }

      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/barcode/:barcode', (req: Request, res: Response) => {
    try {
      const product = db.getProductByBarcode(req.params.barcode);
      if (!product) {
        return res.status(404).json({ error: 'Product not found with this barcode' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to lookup barcode' });
    }
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    try {
      const product = db.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const { name, sku, barcode, category, price, costPrice, stock, minStockThreshold, unit, imageUrl } = req.body;
      if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ error: 'Name, price, and stock quantity are required' });
      }

      const newProduct = db.addProduct({
        name,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: barcode || Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
        category: category || 'General',
        price: Number(price),
        costPrice: Number(costPrice || price * 0.8),
        stock: Number(stock),
        minStockThreshold: Number(minStockThreshold || 10),
        unit: unit || 'pcs',
        imageUrl: imageUrl || undefined
      });

      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    try {
      const success = db.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.post('/api/products/:id/adjust-stock', (req: Request, res: Response) => {
    try {
      const { delta } = req.body;
      if (typeof delta !== 'number') {
        return res.status(400).json({ error: 'Invalid stock delta' });
      }
      const updated = db.adjustStock(req.params.id, delta);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  });

  // -------------------- ORDER & BILLING ROUTES --------------------
  app.get('/api/orders', (req: Request, res: Response) => {
    try {
      const orders = db.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    try {
      const order = db.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const {
        customerName,
        customerPhone,
        items,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        gstRate,
        gstAmount,
        totalAmount,
        totalCostPrice,
        profit,
        paymentMethod,
        paymentStatus,
        amountPaid,
        amountDue,
        upiRefNumber,
        cashReceived,
        changeGiven,
        notes
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
      }

      // Validate stock availability
      for (const item of items) {
        const prod = db.getProductById(item.productId);
        if (prod && prod.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}`
          });
        }
      }

      const newOrder = db.createOrder({
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        items,
        subtotal: Number(subtotal),
        discountType: discountType || 'fixed',
        discountValue: Number(discountValue || 0),
        discountAmount: Number(discountAmount || 0),
        gstRate: Number(gstRate || 0),
        gstAmount: Number(gstAmount || 0),
        totalAmount: Number(totalAmount),
        totalCostPrice: Number(totalCostPrice || 0),
        profit: Number(profit || (totalAmount - totalCostPrice)),
        paymentMethod: paymentMethod || 'cash',
        paymentStatus: paymentStatus || 'paid',
        amountPaid: amountPaid !== undefined ? Number(amountPaid) : undefined,
        amountDue: amountDue !== undefined ? Number(amountDue) : undefined,
        upiRefNumber,
        cashReceived: cashReceived ? Number(cashReceived) : undefined,
        changeGiven: changeGiven ? Number(changeGiven) : undefined,
        notes
      });

      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // -------------------- CUSTOMER DUES (KHATA / UDHAR) ROUTES --------------------
  app.get('/api/dues', (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      let dues = db.getCustomerDues();
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.toLowerCase().trim();
        dues = dues.filter(d =>
          d.customerName.toLowerCase().includes(q) ||
          d.customerPhone.includes(q)
        );
      }
      res.json(dues);
    } catch (error) {
      console.error('Error fetching customer dues:', error);
      res.status(500).json({ error: 'Failed to fetch customer dues' });
    }
  });

  app.get('/api/dues/check', (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.json(null);
      }
      const dueInfo = db.getCustomerDueByQuery(query);
      res.json(dueInfo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to check customer due' });
    }
  });

  app.post('/api/dues/pay', (req: Request, res: Response) => {
    try {
      const { customerKey, amount, paymentMethod } = req.body;
      if (!customerKey || !amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid customer key and payment amount are required' });
      }

      const result = db.settleAllCustomerDues(customerKey, Number(amount), paymentMethod || 'cash');
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error settling customer dues:', error);
      res.status(500).json({ error: 'Failed to settle customer dues' });
    }
  });

  app.post('/api/orders/:id/record-payment', (req: Request, res: Response) => {
    try {
      const { amount, paymentMethod } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      const updatedOrder = db.recordCustomerPayment(req.params.id, Number(amount), paymentMethod || 'cash');
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error recording payment on order:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // -------------------- DASHBOARD & SETTINGS ROUTES --------------------
  app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
    try {
      const metrics = db.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to compute dashboard metrics' });
    }
  });

  app.get('/api/settings', (req: Request, res: Response) => {
    try {
      const settings = db.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const updated = db.updateSettings(req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Serve product & store images from /src/assets in both dev and production
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

  // -------------------- VITE INTEGRATION --------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BusinessPOS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
