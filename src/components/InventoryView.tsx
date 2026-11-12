import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { getProductImage } from '../utils/productImages.ts';
import {
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Download,
  X,
  Barcode,
  Sparkles,
  Check
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  initialFilterLowStock?: boolean;
  onAddProduct: (prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAdjustStock: (id: string, delta: number) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  initialFilterLowStock = false,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(initialFilterLowStock);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Dedicated Barcode Change Modal
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [newBarcodeValue, setNewBarcodeValue] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Grocery',
    price: '',
    costPrice: '',
    stock: '',
    minStockThreshold: '10',
    unit: 'pcs'
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || p.stock <= p.minStockThreshold;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);

    return matchesCategory && matchesLowStock && matchesSearch;
  });

  const generateRandomBarcode = () => {
    return Math.floor(8900000000000 + Math.random() * 99999999999).toString();
  };

  const handleOpenAdd = () => {
    const randomSku = `SKU-${Date.now().toString().slice(-5)}`;
    const randomBarcode = generateRandomBarcode();
    setFormData({
      name: '',
      sku: randomSku,
      barcode: randomBarcode,
      category: 'Grocery',
      price: '',
      costPrice: '',
      stock: '',
      minStockThreshold: '10',
      unit: 'pcs'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      price: p.price.toString(),
      costPrice: p.costPrice.toString(),
      stock: p.stock.toString(),
      minStockThreshold: p.minStockThreshold.toString(),
      unit: p.unit
    });
  };

  const handleOpenBarcodeModal = (p: Product) => {
    setBarcodeModalProduct(p);
    setNewBarcodeValue(p.barcode);
  };

  const handleSaveBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeModalProduct || !newBarcodeValue.trim()) return;

    await onUpdateProduct(barcodeModalProduct.id, {
      barcode: newBarcodeValue.trim()
    });

    setBarcodeModalProduct(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      alert('Please fill product name, price, and stock quantity.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim() || generateRandomBarcode(),
      category: formData.category.trim() || 'General',
      price: priceNum,
      costPrice: parseFloat(formData.costPrice || (priceNum * 0.8).toFixed(2)),
      stock: parseInt(formData.stock, 10),
      minStockThreshold: parseInt(formData.minStockThreshold || '10', 10),
      unit: formData.unit.trim() || 'pcs'
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
      setEditingProduct(null);
    } else {
      await onAddProduct(payload);
      setIsAddModalOpen(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockProduct && restockQty > 0) {
      await onAdjustStock(restockProduct.id, restockQty);
      setRestockProduct(null);
      setRestockQty(10);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name,SKU,Barcode,Category,Price,CostPrice,Stock,Threshold,Unit'];
    const rows = products.map(p =>
      `"${p.name}","${p.sku}","${p.barcode}","${p.category}",${p.price},${p.costPrice},${p.stock},${p.minStockThreshold},"${p.unit}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory & Barcodes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage products, change barcodes, and track stock levels</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              filterLowStockOnly
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-4 font-normal">Product</th>
                <th className="py-2.5 px-4 font-normal">SKU / Barcode</th>
                <th className="py-2.5 px-4 font-normal">Category</th>
                <th className="py-2.5 px-4 text-right font-normal">Price (₹)</th>
                <th className="py-2.5 px-4 text-center font-normal">Stock</th>
                <th className="py-2.5 px-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStockThreshold;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{product.name}</div>
                            <div className="text-[10px] font-normal text-slate-400">
                              Cost: {formatCurrency(product.costPrice)} / {product.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        <div>{product.sku}</div>
                        {/* Click to change barcode */}
                        <button
                          type="button"
                          onClick={() => handleOpenBarcodeModal(product)}
                          className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 mt-0.5 group cursor-pointer"
                          title="Click to Change Barcode"
                        >
                          <Barcode className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
                          <span>{product.barcode}</span>
                          <span className="text-[10px] text-purple-700 bg-purple-50 group-hover:bg-purple-100 px-1 py-0.2 rounded font-sans">
                            Change
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {product.category}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-slate-800'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenBarcodeModal(product)}
                            className="px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded cursor-pointer flex items-center gap-1"
                            title="Change Barcode"
                          >
                            <Barcode className="w-3 h-3" />
                            <span>Barcode</span>
                          </button>
                          <button
                            onClick={() => setRestockProduct(product)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            +Stock
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="p-1 text-slate-300 hover:text-red-600 rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHANGE BARCODE MODAL */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Barcode className="w-4 h-4 text-purple-600" />
                <span>Change Barcode</span>
              </div>
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBarcode} className="mt-4 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={getProductImage(barcodeModalProduct)}
                  alt={barcodeModalProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-slate-500 text-[10px]">Product:</p>
                  <p className="font-semibold text-slate-900 text-sm truncate">{barcodeModalProduct.name}</p>
                  <p className="font-mono text-slate-400 text-[11px]">SKU: {barcodeModalProduct.sku}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">New Barcode Code *</label>
                  <button
                    type="button"
                    onClick={() => setNewBarcodeValue(generateRandomBarcode())}
                    className="text-[11px] font-semibold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Scan with barcode gun or type number..."
                  value={newBarcodeValue}
                  onChange={e => setNewBarcodeValue(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                  autoFocus
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Scan any package barcode with your physical scanner or generate a random one.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBarcodeModalProduct(null)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Save New Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Salt 1kg"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Barcode</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode() })}
                      className="text-[10px] text-purple-700 hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full mt-1 px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full mt-1 px-3 py-2 font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockThreshold}
                    onChange={e => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit</label>
                  <input
                    type="text"
                    placeholder="pcs / kg / pack"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Restock Product</h3>
            <p className="text-slate-500 mt-1">{restockProduct.name}</p>
            <p className="text-slate-400 mt-0.5 font-mono">Current: {restockProduct.stock} {restockProduct.unit}</p>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Add Units (+)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full mt-1 px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Delete Product</h3>
            <p className="text-slate-600 mt-2">
              Are you sure you want to remove this product from inventory?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
