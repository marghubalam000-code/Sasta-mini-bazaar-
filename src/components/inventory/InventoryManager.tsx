import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Barcode, 
  Printer, Sparkles, PackagePlus,
  Cloud, CheckCircle2, X
} from 'lucide-react';
import { Product, MallSettings } from '../../types';
import { storageService } from '../../services/storageService';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { useLanguage } from '../../context/LanguageContext';

interface InventoryManagerProps {
  settings: MallSettings;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ settings }) => {
  const { t, language, getProductName, getCategoryName } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBarcodeSheetOpen, setIsBarcodeSheetOpen] = useState(false);
  const [barcodeSheetProduct, setBarcodeSheetProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    nameHi: '',
    barcode: '',
    sku: '',
    category: 'groceries',
    costPrice: 0,
    sellingPrice: 0,
    stock: 20,
    minStockAlert: 5,
    unit: 'pcs',
    taxRate: 5,
    rackLocation: 'Aisle 1-A',
  });

  const loadProducts = () => {
    setProducts(storageService.getProducts());
  };

  useEffect(() => {
    loadProducts();
    const handleDataChange = () => loadProducts();
    window.addEventListener('megamall:datachange', handleDataChange);
    return () => window.removeEventListener('megamall:datachange', handleDataChange);
  }, []);

  // Generate random 13-digit EAN style barcode
  const generateNewBarcode = () => {
    const prefix = '890'; // GS1 India prefix
    const random = Math.floor(100000000 + Math.random() * 900000000).toString();
    const code = prefix + random;
    setFormData(prev => ({ ...prev, barcode: code }));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const count = products.length + 1;
    const prefix = '890';
    const random = Math.floor(100000000 + Math.random() * 900000000).toString();
    setFormData({
      name: '',
      nameHi: '',
      barcode: prefix + random,
      sku: `SKU-${count.toString().padStart(4, '0')}`,
      category: 'groceries',
      costPrice: 50,
      sellingPrice: 75,
      stock: 25,
      minStockAlert: 8,
      unit: 'pcs',
      taxRate: 5,
      rackLocation: 'Aisle 1-A',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsAddModalOpen(true);
  };

  // Save Add or Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode) {
      alert(language === 'hi' ? 'कृपया उत्पाद का नाम और बारकोड दर्ज करें!' : 'Please enter Product Name and Barcode!');
      return;
    }

    if (editingProduct) {
      storageService.updateProduct({
        ...editingProduct,
        ...(formData as Product),
      });
      setSyncToast(
        language === 'hi'
          ? `"${formData.name}" अपडेट किया गया एवं फायरबेस में सुरक्षित हुआ।`
          : `"${formData.name}" updated & synced to Firebase Firestore.`
      );
      setTimeout(() => setSyncToast(null), 3500);
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: formData.name || 'Unnamed Product',
        nameHi: formData.nameHi || formData.name,
        barcode: formData.barcode || `${Date.now()}`,
        sku: formData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: formData.category || 'groceries',
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        unit: formData.unit || 'pcs',
        taxRate: Number(formData.taxRate) || 0,
        rackLocation: formData.rackLocation || 'Rack 1',
      };
      storageService.addProduct(newProduct);
      setSyncToast(
        language === 'hi'
          ? `"${newProduct.name}" सफलतापूर्वक जोड़ा गया एवं सुरक्षित हुआ!`
          : `"${newProduct.name}" added & synced to Firebase Firestore cloud!`
      );
      setTimeout(() => setSyncToast(null), 3500);
    }

    setIsAddModalOpen(false);
  };

  // Delete product
  const handleDelete = (id: string, name: string) => {
    const confirmPrompt = language === 'hi'
      ? `क्या आप निश्चित रूप से "${name}" को इन्वेंटरी से हटाना चाहते हैं?`
      : `Are you sure you want to delete "${name}" from inventory?`;

    if (confirm(confirmPrompt)) {
      storageService.deleteProduct(id);
      setSyncToast(
        language === 'hi'
          ? `"${name}" इन्वेंटरी से हटा दिया गया।`
          : `"${name}" removed from catalogue & Firebase Firestore.`
      );
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  // Quick Stock Add
  const handleQuickAddStock = (id: string, amount: number) => {
    storageService.adjustProductStock(id, amount);
  };

  // Print barcode sticker sheet
  const handleOpenBarcodeSheet = (product: Product) => {
    setBarcodeSheetProduct(product);
    setIsBarcodeSheetOpen(true);
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q === '' ||
      p.name.toLowerCase().includes(q) ||
      (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    const matchesStock = 
      stockFilter === 'all' ? true :
      stockFilter === 'low' ? (p.stock <= p.minStockAlert && p.stock > 0) :
      p.stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const uniqueCategories: string[] = Array.from(new Set(products.map(p => p.category)));

  return (
    <div id="inventory-manager-view" className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Real-time Cloud Sync Feedback Banner */}
        {syncToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{syncToast}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-mono text-emerald-700">
              {language === 'hi' ? 'फायरबेस क्लाउड सुरक्षित' : 'Firestore Cloud Synced'}
            </span>
          </div>
        )}

        {/* Header Strip (Hidden on print) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {language === 'hi' ? 'इन्वेंटरी एवं बारकोड प्रबंधन' : 'Inventory & Barcode Management'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                {language === 'hi' ? `फायरबेस क्लाउड सक्रिय (${products.length} उत्पाद)` : `Firebase Cloud Live (${products.length} items)`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi' 
                ? 'उत्पाद स्थायी रूप से फायरबेस क्लाउड डेटाबेस में सुरक्षित हैं। ऑटो-डिलीट पूरी तरह बंद है।' 
                : 'Products are stored permanently in Firebase Firestore cloud & device cache for instant offline-ready POS billing.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-new-inventory-item"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {language === 'hi' ? 'नया उत्पाद जोड़ें' : 'Add New Product'}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar (Hidden on print) */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between print:hidden">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-inventory-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'उत्पाद का नाम, 13-अंकों का बारकोड या एसकेयू खोजें...' : 'Search by product name, 13-digit barcode, or SKU...'}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 capitalize focus:outline-none cursor-pointer"
            >
              <option value="all">
                {language === 'hi' ? `सभी श्रेणियां (${products.length})` : `All Categories (${products.length})`}
              </option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{getCategoryName(cat)}</option>
              ))}
            </select>

            {/* Stock status filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'hi' ? 'सभी स्टॉक स्थिति' : 'All Stock Status'}</option>
              <option value="low">{language === 'hi' ? 'कम स्टॉक चेतावनी' : 'Low Stock Alerts'}</option>
              <option value="out">{language === 'hi' ? 'स्टॉक समाप्त' : 'Out of Stock'}</option>
            </select>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">{language === 'hi' ? 'उत्पाद एवं बारकोड' : 'Item & Barcode'}</th>
                  <th className="py-3 px-3">{language === 'hi' ? 'श्रेणी / रैक स्थान' : 'Category / Location'}</th>
                  <th className="py-3 px-3 text-right">{language === 'hi' ? 'लागत मूल्य (CP)' : 'Cost (CP)'}</th>
                  <th className="py-3 px-3 text-right">{language === 'hi' ? 'बिक्री मूल्य (MRP)' : 'Selling (MRP)'}</th>
                  <th className="py-3 px-3 text-right">{language === 'hi' ? 'मार्जिन %' : 'Margin %'}</th>
                  <th className="py-3 px-3 text-center">{language === 'hi' ? 'स्टॉक स्तर' : 'Stock Level'}</th>
                  <th className="py-3 px-4 text-center print:hidden">{language === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                          <PackagePlus className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">
                          {language === 'hi' ? 'इन्वेंटरी खाली है' : 'Inventory is Empty'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          {language === 'hi' ? 'कोई उत्पाद नहीं मिला। बिलिंग शुरू करने के लिए अपने स्टोर के उत्पाद जोड़ें।' : 'No products found. Add your store items with barcodes to start billing.'}
                        </p>
                        <button
                          onClick={handleOpenAdd}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-900/10"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {language === 'hi' ? 'पहला उत्पाद जोड़ें' : 'Add First Product'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const isLow = product.stock <= product.minStockAlert && product.stock > 0;
                    const isOut = product.stock <= 0;
                    const margin = product.sellingPrice > 0 
                      ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1) 
                      : '0';

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70 transition">
                        {/* Name & Barcode */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {getProductName(product)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                              <Barcode className="w-3 h-3" />
                              {product.barcode}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              SKU: {product.sku}
                            </span>
                          </div>
                        </td>

                        {/* Category & Shelf */}
                        <td className="py-3 px-3">
                          <span className="capitalize font-medium text-slate-700 block">
                            {getCategoryName(product.category)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {product.rackLocation || 'Aisle 1'}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {settings.currencySymbol}{product.costPrice}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {settings.currencySymbol}{product.sellingPrice}
                          <span className="text-[10px] font-normal text-slate-400 block font-mono">
                            +{product.taxRate}% {t('taxGst')}
                          </span>
                        </td>

                        {/* Margin */}
                        <td className="py-3 px-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            Number(margin) >= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {margin}%
                          </span>
                        </td>

                        {/* Stock Level */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                              isOut
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {product.stock} {product.unit}
                            </span>
                            {isLow && (
                              <span className="text-[10px] text-amber-600 font-medium mt-0.5">
                                {language === 'hi' ? `चेतावनी ≤ ${product.minStockAlert}` : `Alert ≤ ${product.minStockAlert}`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Barcode Tag Print */}
                            <button
                              id={`btn-barcode-tag-${product.id}`}
                              onClick={() => handleOpenBarcodeSheet(product)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                              title={language === 'hi' ? 'बारकोड शेल्फ स्टिकर प्रिंट करें' : 'Print Barcode Shelf Label'}
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Quick Add Stock +10 */}
                            <button
                              onClick={() => handleQuickAddStock(product.id, 10)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-md transition"
                              title={language === 'hi' ? '+10 स्टॉक जोड़ें' : 'Quick Restock +10'}
                            >
                              +10
                            </button>

                            {/* Edit */}
                            <button
                              id={`btn-edit-prod-${product.id}`}
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title={language === 'hi' ? 'उत्पाद संपादित करें' : 'Edit Product'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              id={`btn-delete-prod-${product.id}`}
                              onClick={() => handleDelete(product.id, product.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title={language === 'hi' ? 'उत्पाद हटाएं' : 'Delete Product'}
                            >
                              <Trash2 className="w-4 h-4" />
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

      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddModalOpen && (
        <div id="product-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-slate-900 my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct 
                  ? (language === 'hi' ? 'उत्पाद संपादित करें' : 'Edit Inventory Item')
                  : (language === 'hi' ? 'नया उत्पाद जोड़ें' : 'Add New Inventory Item')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              {/* Product Name (English & Hindi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'उत्पाद का नाम (अंग्रेज़ी) *' : 'Product Name (English) *'}
                  </label>
                  <input
                    id="modal-input-prod-name"
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tata Salt 1kg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'उत्पाद का नाम (हिन्दी)' : 'Product Name (Hindi)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameHi || ''}
                    onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                    placeholder="उदा. टाटा नमक 1 किग्रा"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Barcode & SKU Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'hi' ? '13-अंकों का बारकोड *' : '13-Digit Barcode *'}
                    </label>
                    <button
                      type="button"
                      onClick={generateNewBarcode}
                      className="text-[10px] text-emerald-600 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3" /> {language === 'hi' ? 'स्वतः बनाएं' : 'Auto Generate'}
                    </button>
                  </div>
                  <input
                    id="modal-input-prod-barcode"
                    type="text"
                    required
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'एसकेयू कोड' : 'SKU Code'}
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Rack Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={formData.category || 'groceries'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs capitalize focus:outline-none cursor-pointer"
                  >
                    <option value="groceries">{language === 'hi' ? 'किराना एवं दैनिक सामग्री' : 'Groceries & Staples'}</option>
                    <option value="snacks">{language === 'hi' ? 'नमकीन, बिस्कुट एवं पेय' : 'Snacks & Beverages'}</option>
                    <option value="personal">{language === 'hi' ? 'पर्सनल केयर एवं सौंदर्य' : 'Personal Care & Beauty'}</option>
                    <option value="electronics">{language === 'hi' ? 'इलेक्ट्रॉनिक्स एवं मोबाइल' : 'Electronics & Mobiles'}</option>
                    <option value="apparel">{language === 'hi' ? 'फैशन एवं कपड़े' : 'Fashion & Apparel'}</option>
                    <option value="home">{language === 'hi' ? 'घरेलू एवं साफ-सफाई' : 'Home & Cleaning'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'रैक / शेल्फ स्थान' : 'Rack / Aisle Shelf'}
                  </label>
                  <input
                    type="text"
                    value={formData.rackLocation || ''}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. Aisle 2-B"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing & Margins */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'लागत मूल्य (CP)' : 'Cost Price (CP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formData.costPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'बिक्री मूल्य (MRP)' : 'Selling Price (MRP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formData.sellingPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'जीएसटी टैक्स %' : 'Tax GST %'}
                  </label>
                  <select
                    value={formData.taxRate ?? 5}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs cursor-pointer"
                  >
                    <option value={0}>0% ({language === 'hi' ? 'छूट' : 'Exempt'})</option>
                    <option value={5}>5% ({language === 'hi' ? 'अनाज/राशन' : 'Staples'})</option>
                    <option value={12}>12% ({language === 'hi' ? 'पैक्ड सामान' : 'Packaged'})</option>
                    <option value={18}>18% ({language === 'hi' ? 'मानक' : 'Standard'})</option>
                    <option value={28}>28% ({language === 'hi' ? 'लक्जरी' : 'Luxury'})</option>
                  </select>
                </div>
              </div>

              {/* Stock Quantity & Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'मौजूदा स्टॉक' : 'Current Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock ?? 0}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'न्यूनतम स्टॉक चेतावनी' : 'Min Stock Alert'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert ?? 5}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'इकाई (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={formData.unit || 'pcs'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="pcs">{language === 'hi' ? 'नग (Pieces)' : 'Pieces (pcs)'}</option>
                    <option value="kg">{language === 'hi' ? 'किलोग्राम (kg)' : 'Kilograms (kg)'}</option>
                    <option value="pack">{language === 'hi' ? 'पैकेट (pack)' : 'Pack'}</option>
                    <option value="ltr">{language === 'hi' ? 'लीटर (ltr)' : 'Litre (ltr)'}</option>
                    <option value="box">{language === 'hi' ? 'बॉक्स (box)' : 'Box'}</option>
                  </select>
                </div>
              </div>

              {/* Barcode Live Preview */}
              {formData.barcode && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                    {language === 'hi' ? 'बारकोड लाइव पूर्वावलोकन' : 'Live Barcode Preview'}
                  </span>
                  <BarcodeDisplay value={formData.barcode} height={35} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  id="btn-save-product-submit"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  {language === 'hi' ? 'डेटाबेस में सुरक्षित करें' : 'Save Product to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE BARCODE SHELF TAGS MODAL */}
      {isBarcodeSheetOpen && barcodeSheetProduct && (
        <div id="barcode-sheet-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {language === 'hi' ? 'बारकोड शेल्फ मूल्य स्टिकर प्रिंट करें' : 'Print Barcode Shelf Price Tags'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  {language === 'hi' ? 'स्टिकर शीट प्रिंट करें' : 'Print Sticker Sheet'}
                </button>
                <button
                  onClick={() => setIsBarcodeSheetOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sticker Grid Preview (Print ready) */}
            <div className="p-6 bg-slate-50 print:bg-white print:p-0">
              <p className="text-xs text-slate-500 mb-4 print:hidden">
                {language === 'hi' 
                  ? 'शेल्फ स्टिकर पूर्वावलोकन (बारकोड स्कैनर गन के लिए 6 स्टिकर शीट):'
                  : 'Shelf sticker preview (Sheet of 6 tags ready for barcode gun scanning):'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="p-3 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center text-center shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{settings.mallName}</span>
                    <h5 className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5">{getProductName(barcodeSheetProduct)}</h5>
                    <div className="my-1">
                      <BarcodeDisplay value={barcodeSheetProduct.barcode} height={32} width={1.2} />
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-500">MRP:</span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        {settings.currencySymbol}{barcodeSheetProduct.sellingPrice}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {language === 'hi' ? 'स्थान' : 'Rack'}: {barcodeSheetProduct.rackLocation || 'Aisle 1'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
