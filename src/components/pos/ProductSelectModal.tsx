import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Search, 
  Package, 
  Plus, 
  Check, 
  AlertCircle, 
  Barcode, 
  ShoppingCart
} from 'lucide-react';
import { Product, CartItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currencySymbol: string;
  cart: CartItem[];
  onSelectProduct: (product: Product) => void;
  onOpenQuickAdd?: () => void;
}

export const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  isOpen,
  onClose,
  products,
  currencySymbol,
  cart,
  onSelectProduct,
  onOpenQuickAdd,
}) => {
  const { t, language, getProductName, getCategoryName } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSelectedCategory('all');
      setOnlyInStock(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Categories extraction
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category.toLowerCase().trim());
    });
    return Array.from(cats);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
        p.barcode.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      const matchesCat = 
        selectedCategory === 'all' || 
        p.category.toLowerCase().trim() === selectedCategory;

      const matchesStock = !onlyInStock || p.stock > 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, onlyInStock]);

  const handleItemSelect = (product: Product) => {
    if (product.stock <= 0) return;
    onSelectProduct(product);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId(prev => (prev === product.id ? null : prev));
    }, 1200);
  };

  const getCartQuantity = (productId: string): number => {
    const item = cart.find(c => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  if (!isOpen) return null;

  return (
    <div 
      id="product-select-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-150"
    >
      <div 
        id="product-select-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {language === 'hi' ? 'बिल में जोड़ने के लिए उत्पाद चुनें' : 'Select Product to Add to Bill'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  {language === 'hi' ? 'उत्पाद सूची' : 'Product List'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? `बिल में जोड़ने के लिए किसी भी उत्पाद पर क्लिक करें • कुल उत्पाद: ${products.length}`
                  : `Click any product to add to customer cart • ${products.length} products in store`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuickAdd && (
              <button
                type="button"
                id="btn-modal-quick-add"
                onClick={() => {
                  onClose();
                  onOpenQuickAdd();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'नया उत्पाद' : 'New Item'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-close-product-select-modal"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                id="input-product-select-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'उत्पाद का नाम या बारकोड लिखकर खोजें...' : 'Type item name, barcode or SKU to find...'}
                className="w-full pl-10 pr-24 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  {language === 'hi' ? 'साफ़ करें' : 'Clear'}
                </button>
              )}
            </div>

            {/* In-stock toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>{language === 'hi' ? 'केवल उपलब्ध स्टॉक' : 'In-Stock Only'}</span>
            </label>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'hi' ? `सभी सामान (${products.length})` : `All Items (${products.length})`}
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category.toLowerCase().trim() === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-semibold capitalize whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Items List / Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/70">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
                <Package className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {language === 'hi' ? 'इन्वेंटरी में कोई उत्पाद नहीं है' : 'No Products in Inventory Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {language === 'hi' 
                  ? 'बिलिंग शुरू करने के लिए अपना पहला उत्पाद जोड़ें।'
                  : 'Your store currently has 0 products saved. Add your first product to start selecting and billing!'}
              </p>
              {onOpenQuickAdd && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickAdd();
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पहला उत्पाद जोड़ें' : 'Add First Product to Store'}</span>
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <AlertCircle className="w-12 h-12 stroke-[1.5] text-slate-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'hi' ? 'कोई मेल खाता उत्पाद नहीं मिला' : 'No matching products found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {language === 'hi'
                  ? `"${searchQuery}" से मेल खाता कोई उत्पाद नहीं मिला। नया उत्पाद जोड़ें।`
                  : `No items matched "${searchQuery}". Check spelling or add this as a new product.`}
              </p>
              {onOpenQuickAdd && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickAdd();
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'hi' ? `"${searchQuery}" को नया उत्पाद बनाएं` : `Add "${searchQuery}" as New Product`}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const qtyInCart = getCartQuantity(product.id);
                const isOutOfStock = product.stock <= 0;
                const isJustAdded = justAddedId === product.id;

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-150 relative ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-60 bg-slate-50'
                        : isJustAdded
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                        : qtyInCart > 0
                        ? 'border-indigo-300 shadow-sm'
                        : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
                    }`}
                  >
                    {/* Top item details */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                            {getProductName(product)}
                          </h4>
                        </div>

                        {/* In Cart Indicator */}
                        {qtyInCart > 0 && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-[10px] font-bold">
                            <ShoppingCart className="w-3 h-3 text-indigo-600" />
                            {qtyInCart} {language === 'hi' ? 'बिल में' : 'in Bill'}
                          </span>
                        )}
                      </div>

                      {/* Meta badges: Category & Barcode */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize">
                          {product.category}
                        </span>
                        {product.brand && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {product.brand}
                          </span>
                        )}
                        <span className="font-mono text-slate-400 text-[10px] flex items-center gap-1">
                          <Barcode className="w-3 h-3 inline" />
                          {product.barcode}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Pricing & Select Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-slate-900 font-mono">
                            {currencySymbol}{product.sellingPrice}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            / {product.unit || (language === 'hi' ? 'नग' : 'pcs')}
                          </span>
                        </div>
                        {/* Stock label */}
                        <div className="text-[10px] font-semibold mt-0.5">
                          {isOutOfStock ? (
                            <span className="text-red-600 font-bold">{t('outOfStock')}</span>
                          ) : product.stock <= (product.minStockAlert || 5) ? (
                            <span className="text-amber-600 font-bold">{t('lowStockWarning')}: {product.stock} {t('stockLeft')}</span>
                          ) : (
                            <span className="text-emerald-700">{t('stock')}: {product.stock}</span>
                          )}
                        </div>
                      </div>

                      {/* Select button */}
                      <button
                        type="button"
                        id={`btn-select-product-${product.id}`}
                        disabled={isOutOfStock}
                        onClick={() => handleItemSelect(product)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs select-none active:scale-95 ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : qtyInCart > 0
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'जुड़ गया!' : 'Added!'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{qtyInCart > 0 ? (language === 'hi' ? '+ और जोड़ें' : '+ Add More') : (language === 'hi' ? 'चुनें' : 'Select')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'hi'
                ? `बिल सामग्री: ${cart.reduce((s, i) => s + i.quantity, 0)} (${cart.length} प्रकार के उत्पाद)`
                : `Bill Items: ${cart.reduce((s, i) => s + i.quantity, 0)} (${cart.length} unique products)`}
            </span>
          </div>

          <button
            type="button"
            id="btn-done-selecting-products"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {language === 'hi' ? 'पूर्ण हुआ • बिल पर वापस जाएं' : 'Done Selecting • Return to Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};
