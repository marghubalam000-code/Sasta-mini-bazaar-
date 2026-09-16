import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Barcode } from 'lucide-react';
import { Product } from '../../types';
import { storageService } from '../../services/storageService';
import { posAudio } from '../../utils/audio';
import { useLanguage } from '../../context/LanguageContext';

interface QuickAddProductModalProps {
  isOpen: boolean;
  initialBarcode?: string;
  initialName?: string;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  initialBarcode = '',
  initialName = '',
  onClose,
  onProductAdded,
}) => {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('groceries');
  const [stock, setStock] = useState('50');
  const [unit, setUnit] = useState('pcs');
  const [taxRate, setTaxRate] = useState('5');
  const [rackLocation, setRackLocation] = useState('Aisle 1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcode(initialBarcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      setName(initialName || '');
      setSellingPrice('');
      setCostPrice('');
      setCategory('groceries');
      setStock('50');
      setUnit(language === 'hi' ? 'नग' : 'pcs');
      setTaxRate('5');
      setError(null);
    }
  }, [isOpen, initialBarcode, initialName, language]);

  // Auto calculate cost price at 75% of MRP if empty
  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val);
    const num = Number(val);
    if (num > 0 && !costPrice) {
      setCostPrice(`${Math.round(num * 0.75)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'hi' ? 'कृपया उत्पाद का नाम दर्ज करें।' : 'Please enter product name.');
      return;
    }
    const priceNum = Number(sellingPrice);
    if (!priceNum || priceNum <= 0) {
      setError(language === 'hi' ? 'कृपया मान्य बिक्री मूल्य दर्ज करें।' : 'Please enter a valid selling price.');
      return;
    }

    const cleanBarcode = (barcode || `${Date.now()}`).trim();
    const stockNum = Number(stock) > 0 ? Number(stock) : 50;

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      barcode: cleanBarcode,
      sku: `SKU-${cleanBarcode.slice(-4) || Date.now().toString().slice(-4)}`,
      category: (category || 'groceries').trim().toLowerCase(),
      costPrice: Number(costPrice) || Math.round(priceNum * 0.75),
      sellingPrice: priceNum,
      stock: stockNum,
      minStockAlert: 5,
      unit: unit || (language === 'hi' ? 'नग' : 'pcs'),
      taxRate: Number(taxRate) || 0,
      rackLocation: rackLocation || (language === 'hi' ? 'काउंटर 1' : 'Counter 1'),
    };

    // Save to storage & Firestore
    storageService.addProduct(newProduct);
    posAudio.playScanBeep();
    onProductAdded(newProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'hi' ? 'नया उत्पाद तुरंत जोड़ें' : 'Quick Add Product'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'स्टोर में सुरक्षित करें और तुरंत बिल में जोड़ें' : 'Save to Inventory & add directly to customer bill'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          {/* Barcode & Auto-generator */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              {language === 'hi' ? 'बारकोड संख्या:' : 'Barcode Number:'}
            </label>
            <div className="relative">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8901030383124"
                className="w-full pl-9 pr-24 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setBarcode(`${Math.floor(100000000000 + Math.random() * 900000000000)}`)}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition"
              >
                {language === 'hi' ? 'नया बनाएं' : 'Auto Generate'}
              </button>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              {language === 'hi' ? 'उत्पाद का नाम:' : 'Product Name:'}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. पारले-जी बिस्कुट 100g' : 'e.g. Fortune Sunflower Oil 1L'}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Price Row: Selling MRP & Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'बिक्री मूल्य (एमआरपी ₹):' : 'Selling Price (MRP ₹):'}
              </label>
              <input
                type="number"
                required
                min="0.5"
                step="any"
                value={sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                placeholder="150"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'खरीद मूल्य (लागत ₹):' : 'Cost Price (Wholesale ₹):'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="120"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Initial Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'श्रेणी (Category):' : 'Category:'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none capitalize"
              >
                <option value="groceries">{language === 'hi' ? 'किराना' : 'Groceries'}</option>
                <option value="snacks">{language === 'hi' ? 'नमकीन व स्नैक्स' : 'Snacks'}</option>
                <option value="beverages">{language === 'hi' ? 'पेय पदार्थ' : 'Beverages'}</option>
                <option value="dairy">{language === 'hi' ? 'डेयरी' : 'Dairy'}</option>
                <option value="personal-care">{language === 'hi' ? 'पर्सनल केयर' : 'Personal Care'}</option>
                <option value="household">{language === 'hi' ? 'घरेलू सामान' : 'Household'}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'आरंभिक स्टॉक मात्रा:' : 'Initial Stock Quantity:'}
              </label>
              <input
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Unit & GST */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'माप की इकाई:' : 'Unit of Measurement:'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="pcs">{language === 'hi' ? 'नग (Pieces)' : 'Pieces (pcs)'}</option>
                <option value="kg">{language === 'hi' ? 'किलोग्राम (kg)' : 'Kilogram (kg)'}</option>
                <option value="gm">{language === 'hi' ? 'ग्राम (gm)' : 'Gram (gm)'}</option>
                <option value="ltr">{language === 'hi' ? 'लीटर (ltr)' : 'Litre (ltr)'}</option>
                <option value="pack">{language === 'hi' ? 'पैकेट (pack)' : 'Packet (pack)'}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'जीएसटी कर दर (%):' : 'GST Tax Rate (%):'}
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="0">0% (कर मुक्त)</option>
                <option value="5">5% (सामान्य खाद्य)</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              {language === 'hi' ? 'सुरक्षित करें और बिल में जोड़ें' : 'Save & Add to Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
