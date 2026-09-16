import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Scan, Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, 
  Banknote, QrCode, User, Phone, CheckCircle2, AlertTriangle, 
  PackageSearch, Package
} from 'lucide-react';
import { CartItem, Category, MallSettings, PaymentMethod, Product, SaleItemSummary, SaleReceipt, User as UserType } from '../../types';
import { storageService } from '../../services/storageService';
import { posAudio } from '../../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { UpiQrScanner } from '../common/UpiQrScanner';
import { QuickAddProductModal } from './QuickAddProductModal';
import { ProductSelectModal } from './ProductSelectModal';
import { useLanguage } from '../../context/LanguageContext';

interface POSBillingTerminalProps {
  currentUser: UserType;
  settings: MallSettings;
}

export const POSBillingTerminal: React.FC<POSBillingTerminalProps> = ({
  currentUser,
  settings,
}) => {
  const { t, language, getProductName } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [unfoundBarcode, setUnfoundBarcode] = useState<string | null>(null);

  // Dedicated Product Selector Modal state
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);

  // Quick Add Product modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialBarcode, setQuickAddInitialBarcode] = useState('');
  const [quickAddInitialName, setQuickAddInitialName] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Payment Checkout Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [upiReference, setUpiReference] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  // Generated Receipt for Modal
  const [activeReceipt, setActiveReceipt] = useState<SaleReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products & categories
  const loadData = () => {
    const loaded = storageService.getProducts();
    setProducts(loaded);
    setCategories(storageService.getCategories());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('megamall:datachange', handleDataChange);
    return () => window.removeEventListener('megamall:datachange', handleDataChange);
  }, []);

  // Keyboard shortcut for barcode scan focus (F2) and Product Select (F4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsProductSelectOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Top 6 autocomplete suggestions when typing in barcode field
  const barcodeSuggestions = useMemo(() => {
    const q = barcodeInput.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return products.filter(p => 
      p.barcode.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [products, barcodeInput]);

  // Handle Quick Add trigger
  const handleOpenQuickAdd = (barcodeVal?: string, nameVal?: string) => {
    setQuickAddInitialBarcode(barcodeVal || barcodeInput.trim() || '');
    setQuickAddInitialName(nameVal || searchQuery.trim() || '');
    setIsQuickAddOpen(true);
  };

  const handleProductAdded = (newProd: Product) => {
    const currentProds = storageService.getProducts();
    setProducts(currentProds);
    addToCart(newProd);
    setBarcodeError(null);
    setUnfoundBarcode(null);
    setBarcodeInput('');
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Handle Barcode Scan / Submit
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim();
    const cleanQuery = query.toLowerCase();

    // 1. Search storage by exact barcode
    const foundByStorage = storageService.getProductByBarcode(query);
    // 2. Search local products array by barcode, sku, or name
    const foundInList = products.find(p => 
      p.barcode.trim().toLowerCase() === cleanQuery || 
      p.barcode.replace(/\s+/g, '') === cleanQuery.replace(/\s+/g, '') ||
      p.sku.trim().toLowerCase() === cleanQuery || 
      p.name.trim().toLowerCase() === cleanQuery
    );

    const found = foundByStorage || foundInList;

    if (found) {
      addToCart(found);
      setBarcodeInput('');
      setBarcodeError(null);
      setUnfoundBarcode(null);
      posAudio.playScanBeep();
    } else {
      posAudio.playErrorBeep();
      setUnfoundBarcode(query);
      setBarcodeError(
        language === 'hi' 
          ? `बारकोड "${query}" का कोई उत्पाद नहीं मिला`
          : `No product found for barcode: "${query}"`
      );
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      posAudio.playErrorBeep();
      setBarcodeError(
        language === 'hi'
          ? `"${getProductName(product)}" का स्टॉक खत्म हो चुका है!`
          : `"${product.name}" is OUT OF STOCK!`
      );
      setTimeout(() => setBarcodeError(null), 3000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          posAudio.playErrorBeep();
          setBarcodeError(
            language === 'hi'
              ? `${getProductName(product)} के केवल ${product.stock} नग उपलब्ध हैं!`
              : `Only ${product.stock} units available in stock for ${product.name}!`
          );
          setTimeout(() => setBarcodeError(null), 3000);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, customDiscountPercent: 0 }];
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            posAudio.playErrorBeep();
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Update item custom discount
  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, customDiscountPercent: Math.min(50, Math.max(0, discount)) }
          : item
      )
    );
  };

  // Remove single item
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setOverallDiscount(0);
  };

  // Totals calculations
  const rawSubtotal = cart.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const itemDiscountsTotal = cart.reduce((sum, i) => {
    const itemPrice = i.product.sellingPrice * i.quantity;
    return sum + (itemPrice * (i.customDiscountPercent || 0)) / 100;
  }, 0);
  const totalDiscount = itemDiscountsTotal + overallDiscount;

  // Calculate taxes
  const totalTax = cart.reduce((sum, i) => {
    const itemNet = (i.product.sellingPrice * i.quantity) * (1 - (i.customDiscountPercent || 0) / 100);
    const taxRate = i.product.taxRate || 5;
    const tax = (itemNet * taxRate) / (100 + taxRate);
    return sum + tax;
  }, 0);

  const grandTotal = Math.max(0, Math.round(rawSubtotal - totalDiscount));

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal.toString());
    setUpiReference(`UPI${Date.now().toString().slice(-6)}`);
    setCardLast4('8842');
    setIsPaymentOpen(true);
  };

  // Complete Payment & Generate Receipt
  const handleCompleteSale = () => {
    const tendered = paymentMethod === 'CASH' ? parseFloat(cashTendered) || grandTotal : grandTotal;
    if (paymentMethod === 'CASH' && tendered < grandTotal) {
      posAudio.playErrorBeep();
      alert(
        language === 'hi'
          ? `प्राप्त नकद (${settings.currencySymbol}${tendered}) कुल बिल (${settings.currencySymbol}${grandTotal}) से कम है!`
          : `Tendered cash (${settings.currencySymbol}${tendered}) is less than total bill (${settings.currencySymbol}${grandTotal})!`
      );
      return;
    }

    const changeGiven = paymentMethod === 'CASH' ? Math.max(0, Math.round((tendered - grandTotal) * 100) / 100) : 0;

    let totalCost = 0;
    const itemsSummary: SaleItemSummary[] = cart.map(i => {
      const lineCost = i.product.costPrice * i.quantity;
      const lineTotal = (i.product.sellingPrice * i.quantity) * (1 - (i.customDiscountPercent || 0) / 100);
      const taxRate = i.product.taxRate || 5;
      const taxAmt = (lineTotal * taxRate) / (100 + taxRate);
      totalCost += lineCost;

      return {
        productId: i.product.id,
        barcode: i.product.barcode,
        name: i.product.name,
        quantity: i.quantity,
        unit: i.product.unit,
        unitPrice: i.product.sellingPrice,
        costPrice: i.product.costPrice,
        taxRate: taxRate,
        taxAmount: Math.round(taxAmt * 100) / 100,
        discountAmount: Math.round(((i.product.sellingPrice * i.quantity) * (i.customDiscountPercent || 0)) / 100),
        total: Math.round(lineTotal),
      };
    });

    const receipt: SaleReceipt = {
      id: `tx-${Date.now()}`,
      invoiceNumber: storageService.getNextInvoiceNumber(),
      date: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerName: customerName.trim() || (language === 'hi' ? 'दुकानदार ग्राहक' : 'Walk-in Customer'),
      customerPhone: customerPhone.trim() || 'N/A',
      items: itemsSummary,
      subtotal: Math.round(rawSubtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      amountPaid: tendered,
      changeGiven: changeGiven,
      paymentDetails: paymentMethod === 'UPI' 
        ? { upiRef: upiReference } 
        : paymentMethod === 'CARD' 
        ? { cardLast4: cardLast4 } 
        : undefined,
      totalCost: Math.round(totalCost * 100) / 100,
      profit: Math.round((grandTotal - totalCost) * 100) / 100,
      status: 'COMPLETED',
    };

    // Save in storage service (deducts stock and adds to transaction history)
    storageService.recordSale(receipt);

    // Audio chime & Confetti
    posAudio.playSuccessChime();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
    });

    // Reset Cart & Close Payment modal
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOverallDiscount(0);
    setIsPaymentOpen(false);

    // Open Receipt modal immediately!
    setActiveReceipt(receipt);
    setIsReceiptOpen(true);
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' || 
      p.name.toLowerCase().includes(q) ||
      (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
      p.barcode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q));

    const matchesCategory = q !== '' || selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesCategory && matchesSearch;
  });

  const uniqueCategories = Array.from(new Set(products.map(p => p.category.toLowerCase()))).filter(Boolean);

  return (
    <div id="pos-billing-terminal" className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      
      {/* LEFT SECTION: Catalogue, Search & Barcode Scanner Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200 bg-white">
        
        {/* Barcode & Search Header */}
        <div className="p-4 bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Barcode Gun Input Box with Live Autocomplete Suggestions */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center relative">
            <div className="relative flex-1">
              <input
                ref={barcodeInputRef}
                id="input-pos-barcode"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={language === 'hi' ? 'बारकोड स्कैन करें या उत्पाद का नाम लिखें (F2)...' : 'Scan Barcode or Type Product Name (F2)...'}
                className="w-full pl-10 pr-24 py-2.5 bg-slate-800 border-2 border-emerald-500/60 focus:border-emerald-400 rounded-xl text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition shadow-inner"
              />
              <Scan className="w-5 h-5 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="submit"
                id="btn-add-by-barcode"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-1"
              >
                {language === 'hi' ? 'स्कैन करें' : 'Scan Enter'}
              </button>

              {/* Live Autocomplete Dropdown List when typing */}
              {barcodeSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 divide-y divide-slate-100 overflow-hidden animate-in fade-in-50">
                  <div className="px-3 py-1.5 bg-slate-100 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                    <span>{language === 'hi' ? `सुझाव (${barcodeSuggestions.length})` : `Suggestions (${barcodeSuggestions.length})`}</span>
                    <span className="text-emerald-700 font-semibold">
                      {language === 'hi' ? 'बिल में जोड़ने के लिए चुनें' : 'Click "+ Select" to Add to Bill'}
                    </span>
                  </div>
                  {barcodeSuggestions.map(sug => (
                    <div 
                      key={sug.id}
                      onClick={() => {
                        addToCart(sug);
                        setBarcodeInput('');
                      }}
                      className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{getProductName(sug)}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          <span>{sug.barcode}</span>
                          <span>•</span>
                          <span className={sug.stock <= 0 ? 'text-red-500 font-bold' : 'text-emerald-600 font-semibold'}>
                            {t('stock')}: {sug.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {settings.currencySymbol}{sug.sellingPrice}
                        </span>
                        <button
                          type="button"
                          disabled={sug.stock <= 0}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{language === 'hi' ? 'चुनें' : 'Select'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Action Buttons: Dedicated Select Product, Quick Add & Live Camera Scanner */}
          <div className="flex items-center gap-2">
            {/* Primary Select Product Option Button */}
            <button
              id="btn-open-product-select-modal"
              type="button"
              onClick={() => setIsProductSelectOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-emerald-950/30 active:scale-95 whitespace-nowrap"
              title="Open Product Selector (F4)"
            >
              <Package className="w-4 h-4" />
              <span>{language === 'hi' ? 'उत्पाद चुनें' : 'Select Product'}</span>
              <span className="text-[10px] bg-black/20 px-1 rounded font-mono hidden sm:inline">F4</span>
            </button>

            <button
              id="btn-pos-quick-add"
              type="button"
              onClick={() => handleOpenQuickAdd()}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold tracking-wide transition shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? 'उत्पाद जोड़ें' : 'Add Product'}</span>
            </button>

            <button
              id="btn-open-camera-scanner"
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold tracking-wide transition shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Scan className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? 'कैमरा स्कैन' : 'Camera Scan'}</span>
            </button>
          </div>
        </div>

        {/* Quick Dropdown Product Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-800 border-t border-slate-700/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold whitespace-nowrap shrink-0">
            <Package className="w-4 h-4" />
            <span>{language === 'hi' ? 'उत्पाद चुनें:' : 'Select Product:'}</span>
          </div>
          <select
            id="select-pos-dropdown-picker"
            value=""
            onChange={(e) => {
              const pid = e.target.value;
              if (!pid) return;
              const target = products.find(p => p.id === pid);
              if (target) {
                addToCart(target);
              }
            }}
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
          >
            <option value="">
              {language === 'hi' 
                ? `-- किसी भी उत्पाद को सीधे जोड़ने के लिए यहाँ क्लिक करें (${products.length} उपलब्ध) --`
                : `-- Click here to select any product directly (${products.length} available) --`}
            </option>
            {products.map(p => (
              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                {getProductName(p)} - {settings.currencySymbol}{p.sellingPrice} {p.stock <= 0 ? `(${t('outOfStock')})` : `[${t('stock')}: ${p.stock}]`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsProductSelectOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? `सभी सामान (${products.length})` : `Browse All (${products.length})`}</span>
          </button>
        </div>

        {/* Barcode Error Banner if any */}
        {barcodeError && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{barcodeError}</span>
            </div>
            {unfoundBarcode && (
              <button
                type="button"
                onClick={() => handleOpenQuickAdd(unfoundBarcode)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'hi' ? `बारकोड "${unfoundBarcode}" को तुरंत जोड़ें` : `Add Barcode "${unfoundBarcode}" to Billing`}
              </button>
            )}
          </div>
        )}

        {/* Category Filter Chips & Product Search */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-2 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-pos-product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'नाम या बारकोड से सामान खोजें...' : 'Search items by name or SKU...'}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Quick Categories Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'hi' ? `सभी सामान (${products.length})` : `All (${products.length})`}
            </button>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap capitalize transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 my-4">
              <PackageSearch className="w-12 h-12 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">
                {language === 'hi' ? 'कैटलॉग में कोई उत्पाद नहीं मिला' : 'No products found in catalogue'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {searchQuery 
                  ? (language === 'hi' ? `"${searchQuery}" से मेल खाता कोई उत्पाद नहीं मिला। नया उत्पाद जोड़ें।` : `No product matches "${searchQuery}". Click below to add it directly to this bill.`)
                  : (language === 'hi' ? 'इस श्रेणी में अभी कोई उत्पाद नहीं है। आप नया उत्पाद जोड़ सकते हैं।' : 'No items currently in this category. You can add a new product right away.')}
              </p>
              <button
                type="button"
                onClick={() => handleOpenQuickAdd('', searchQuery)}
                className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center gap-2 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {language === 'hi' ? 'बिलिंग में उत्पाद तुरंत जोड़ें' : 'Quick Add Product to Billing'}
              </button>
            </div>
          ) : (
            filteredProducts.map(product => {
              const inCart = cart.find(c => c.product.id === product.id);
              const isLowStock = product.stock <= product.minStockAlert && product.stock > 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  id={`card-pos-product-${product.id}`}
                  onClick={() => {
                    if (isOutOfStock) {
                      // Prompt quick restock
                      const updated = storageService.adjustProductStock(product.id, 10);
                      if (updated) {
                        setProducts(storageService.getProducts());
                        addToCart(updated);
                      }
                    } else {
                      addToCart(product);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between select-none cursor-pointer group relative ${
                    isOutOfStock
                      ? 'bg-red-50/30 border-red-200 hover:border-red-300'
                      : inCart
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Header info */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {product.rackLocation || product.unit}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          {language === 'hi' ? 'स्टॉक खत्म (+10 जोड़ें)' : 'Out of Stock (+Add 10)'}
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          {language === 'hi' ? `केवल ${product.stock} बचे` : `Only ${product.stock} Left`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          {product.stock} {t('stockLeft')}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition">
                      {getProductName(product)}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {product.barcode}
                    </p>
                  </div>

                  {/* Price & Add button */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {settings.currencySymbol}{product.sellingPrice}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {t('taxGst')}: {product.taxRate}%
                      </span>
                    </div>

                    <div className="flex items-center">
                      {inCart ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                            {inCart.quantity} {language === 'hi' ? 'बिल में' : 'in bill'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                            title="Add one more"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'चुनें' : 'Select'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Customer Details & Checkout Terminal */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col h-full bg-white border-l border-slate-200 shadow-lg">
        
        {/* Cart Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'hi' ? 'ग्राहक बिल कार्ट' : 'Customer Bill Cart'}
              </h3>
              <p className="text-xs text-slate-400">
                {cart.reduce((s, i) => s + i.quantity, 0)} {language === 'hi' ? 'सामग्री चुनी गई' : 'Items Selected'}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {language === 'hi' ? 'खाली करें' : 'Clear'}
            </button>
          )}
        </div>

        {/* Customer Details Strip */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              id="input-pos-customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={language === 'hi' ? 'ग्राहक का नाम...' : 'Customer Name...'}
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              id="input-pos-customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={language === 'hi' ? 'मोबाइल नंबर...' : 'Mobile Number...'}
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-sm">
                {language === 'hi' ? 'आपकी बिलिंग कार्ट खाली है' : 'Your Cart is Empty'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                {language === 'hi' 
                  ? 'बारकोड स्कैनर गन से स्कैन करें या उत्पाद सूची से सामान चुनें।'
                  : 'Scan product barcodes with the scanner gun or select items directly from the inventory.'}
              </p>
              <button
                type="button"
                id="btn-empty-cart-select-product"
                onClick={() => setIsProductSelectOpen(true)}
                className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-950/20 active:scale-95"
              >
                <Package className="w-4 h-4" />
                <span>{language === 'hi' ? 'उत्पाद चुनें' : 'Select Product'}</span>
              </button>
            </div>
          ) : (
            cart.map(item => {
              const lineTotal = item.product.sellingPrice * item.quantity;
              const discountAmt = (lineTotal * (item.customDiscountPercent || 0)) / 100;
              const netTotal = lineTotal - discountAmt;

              return (
                <div key={item.product.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                  <div className="flex-1 pr-1">
                    <div className="font-medium text-slate-900 leading-tight">
                      {getProductName(item.product)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                      <span>{settings.currencySymbol}{item.product.sellingPrice} / {item.product.unit}</span>
                      <span>•</span>
                      <span className="text-slate-400">{t('taxGst')}: {item.product.taxRate}%</span>
                    </div>

                    {/* Optional Item Discount */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">{t('disc')}%:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={item.customDiscountPercent || ''}
                        placeholder="0"
                        onChange={(e) => updateItemDiscount(item.product.id, parseInt(e.target.value) || 0)}
                        className="w-12 px-1 py-0.5 border border-slate-200 rounded text-[10px] font-mono text-center focus:ring-1 focus:ring-indigo-500"
                      />
                      {item.customDiscountPercent > 0 && (
                        <span className="text-[10px] text-emerald-600 font-medium font-mono">
                          (-{settings.currencySymbol}{discountAmt.toFixed(0)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls & Line total */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-800 font-mono text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        {settings.currencySymbol}{Math.round(netTotal)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        {language === 'hi' ? 'हटाएं' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Select More Products button when cart has items */}
        {cart.length > 0 && (
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              id="btn-cart-select-more"
              onClick={() => setIsProductSelectOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'hi' ? 'और सामान जोड़ें' : 'Select More Products'}</span>
            </button>
          </div>
        )}

        {/* Calculation & Bill Summary Box */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t('subtotal')}</span>
            <span className="font-mono">{settings.currencySymbol}{rawSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              {language === 'hi' ? 'अतिरिक्त बिल छूट' : 'Bill Extra Discount'} ({settings.currencySymbol})
            </span>
            <input
              type="number"
              min="0"
              value={overallDiscount || ''}
              placeholder="0"
              onChange={(e) => setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>{language === 'hi' ? 'कुल बचत / छूट' : 'Total Savings / Discount'}</span>
              <span className="font-mono">-{settings.currencySymbol}{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>
              {language === 'hi' ? `अनुमानित ${settings.taxName} (शामिल)` : `Estimated ${settings.taxName} (Included)`}
            </span>
            <span className="font-mono">{settings.currencySymbol}{totalTax.toFixed(2)}</span>
          </div>

          {/* Grand Total Strip */}
          <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between font-bold">
            <div>
              <span className="text-sm text-slate-900 block">{t('grandTotal')}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {language === 'hi' ? 'सभी कर एवं शुल्क सम्मिलित' : 'All Taxes & Levies Included'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              {settings.currencySymbol}{grandTotal}
            </div>
          </div>

          {/* Fast Checkout Action Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              id="btn-fast-cash-checkout"
              disabled={cart.length === 0}
              onClick={() => {
                setPaymentMethod('CASH');
                handleOpenCheckout();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Banknote className="w-4 h-4 text-emerald-400" />
              {language === 'hi' ? 'नकद भुगतान' : 'Cash Pay'}
            </button>

            <button
              id="btn-pos-checkout"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {language === 'hi' ? `प्राप्त करें ${settings.currencySymbol}${grandTotal}` : `Collect ${settings.currencySymbol}${grandTotal}`}
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT & TENDER MODAL */}
      {isPaymentOpen && (
        <div id="payment-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {language === 'hi' ? 'भुगतान पूर्ण करें' : 'Complete Payment'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'hi' ? 'कुल देय राशि:' : 'Total Bill Payable:'} {settings.currencySymbol}{grandTotal}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <button
                  id="tab-pay-cash"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  {t('payCash')}
                </button>

                <button
                  id="tab-pay-upi"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'UPI'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  {t('payUpi')}
                </button>

                <button
                  id="tab-pay-card"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'CARD'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {t('payCard')}
                </button>
              </div>
            </div>

            {/* Tab Specific Content */}
            <div className="p-5 space-y-4">
              {paymentMethod === 'CASH' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'hi' ? 'ग्राहक से प्राप्त नकद राशि' : 'Cash Tendered from Customer'} ({settings.currencySymbol}):
                  </label>
                  <input
                    id="input-cash-tendered"
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl font-mono text-xl font-bold text-slate-900 focus:outline-none"
                    placeholder={language === 'hi' ? 'प्राप्त राशि दर्ज करें' : 'Enter amount given'}
                    autoFocus
                  />

                  {/* Fast Denomination Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[grandTotal, Math.ceil(grandTotal / 100) * 100, 500, 1000, 2000]
                      .filter((val, idx, arr) => val >= grandTotal && arr.indexOf(val) === idx)
                      .slice(0, 4)
                      .map(denom => (
                        <button
                          key={denom}
                          type="button"
                          onClick={() => setCashTendered(denom.toString())}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono text-xs font-semibold text-slate-700 transition"
                        >
                          {settings.currencySymbol}{denom}
                        </button>
                      ))}
                  </div>

                  {/* Change Return Calculation */}
                  <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase block">
                        {language === 'hi' ? 'वापस करने योग्य खुल्ले पैसे' : 'Change to Return'}
                      </span>
                      <span className="text-[11px] text-emerald-600">
                        {language === 'hi' ? 'ग्राहक की बकाया राशि' : 'Customer change'}
                      </span>
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-700">
                      {settings.currencySymbol}{Math.max(0, (parseFloat(cashTendered) || 0) - grandTotal)}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="flex flex-col items-center">
                  <UpiQrScanner
                    upiId={settings.upiId}
                    payeeName={settings.upiPayeeName || settings.mallName}
                    amount={grandTotal}
                    currencySymbol={settings.currencySymbol}
                    customQrImage={settings.upiQrCustomImage}
                    upiQrMode={settings.upiQrMode}
                    size={140}
                    styleVariant="checkout"
                  />

                  <div className="w-full mt-3">
                    <label className="text-xs font-medium text-slate-600 block text-left mb-1">
                      {language === 'hi' ? 'यूपीआई संदर्भ संख्या / यूटीआर (वैकल्पिक):' : 'UPI Ref No / Transaction ID (Optional):'}
                    </label>
                    <input
                      type="text"
                      value={upiReference}
                      onChange={(e) => setUpiReference(e.target.value)}
                      placeholder="e.g. UPI/123456789"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                    {language === 'hi' ? 'कार्ड स्वाइप या टैप करें।' : 'Swipe or Tap credit/debit card on EDC POS terminal.'}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      {language === 'hi' ? 'कार्ड के अंतिम 4 अंक (वैकल्पिक):' : 'Card Last 4 Digits (Optional):'}
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value)}
                      placeholder="e.g. 4321"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Payment Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                {language === 'hi' ? 'पीछे जाएं' : 'Back'}
              </button>
              <button
                id="btn-confirm-payment-finalize"
                type="button"
                onClick={handleCompleteSale}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('completeAndPrintBill')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(barcode) => {
          setBarcodeInput(barcode);
          const found = storageService.getProductByBarcode(barcode);
          if (found) {
            addToCart(found);
            setBarcodeError(null);
          } else {
            posAudio.playErrorBeep();
            setBarcodeError(
              language === 'hi' 
                ? `बारकोड "${barcode}" का कोई उत्पाद नहीं मिला`
                : `No product found for barcode: "${barcode}"`
            );
          }
        }}
        storeProducts={products}
      />

      {/* Generated Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        settings={settings}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        initialBarcode={quickAddInitialBarcode}
        initialName={quickAddInitialName}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddInitialBarcode('');
          setQuickAddInitialName('');
        }}
        onProductAdded={handleProductAdded}
      />

      {/* Dedicated Product Selector Modal (F4 / Select Product) */}
      <ProductSelectModal
        isOpen={isProductSelectOpen}
        onClose={() => setIsProductSelectOpen(false)}
        products={products}
        currencySymbol={settings.currencySymbol}
        cart={cart}
        onSelectProduct={(p) => {
          addToCart(p);
        }}
        onOpenQuickAdd={() => handleOpenQuickAdd()}
      />
    </div>
  );
};
