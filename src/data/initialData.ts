import { Category, MallSettings, Product, SaleReceipt, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Store Administrator',
    role: 'admin',
    pin: '1234',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'usr-cashier-1',
    username: 'cashier1',
    name: 'Cashier Counter 1',
    role: 'cashier',
    pin: '0000',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'usr-cashier-2',
    username: 'cashier2',
    name: 'Cashier Counter 2',
    role: 'cashier',
    pin: '1111',
    avatarColor: 'bg-purple-600',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries & Staples', nameHi: 'किराना एवं अनाज', icon: 'ShoppingBag', color: 'from-amber-500 to-orange-600' },
  { id: 'snacks', name: 'Snacks & Beverages', nameHi: 'स्नैक्स एवं पेय', icon: 'Coffee', color: 'from-rose-500 to-red-600' },
  { id: 'personal', name: 'Personal Care & Beauty', nameHi: 'पर्सनल केयर', icon: 'Sparkles', color: 'from-pink-500 to-fuchsia-600' },
  { id: 'electronics', name: 'Electronics & Mobiles', nameHi: 'इलेक्ट्रॉनिक्स', icon: 'Smartphone', color: 'from-blue-500 to-indigo-600' },
  { id: 'apparel', name: 'Fashion & Apparel', nameHi: 'फैशन एवं कपड़े', icon: 'Shirt', color: 'from-teal-500 to-emerald-600' },
  { id: 'home', name: 'Home & Cleaning', nameHi: 'होम केयर', icon: 'Home', color: 'from-violet-500 to-purple-600' },
];

export const INITIAL_SETTINGS: MallSettings = {
  mallName: 'Sasta Mini Bazaar',
  tagline: 'Sabse Sasta, Sabse Accha • Supermarket Store',
  logoUrl: '/logo.png',
  address: 'Main Market Road, Near City Center',
  cityStateZip: 'Mumbai, MH - 400001',
  phone: '+91 98765 43210',
  email: 'care@sastaminibazaar.com',
  gstin: '27AAAAA0000A1Z5',
  currencySymbol: '₹',
  receiptFooter: 'Sasta Mini Bazaar me aane ke liye dhanyawad! Visit again.',
  receiptTheme: 'thermal-classic',
  taxName: 'GST',
  upiId: 'sastaminibazaar@upi',
  upiPayeeName: 'Sasta Mini Bazaar',
  showUpiOnReceipt: true,
  upiQrMode: 'dynamic',
};

// All demo items permanently removed: Clean production slate
export const INITIAL_PRODUCTS: Product[] = [];

// Clean initial sales: 0 dummy transactions
export function generateInitialSales(): SaleReceipt[] {
  return [];
}
