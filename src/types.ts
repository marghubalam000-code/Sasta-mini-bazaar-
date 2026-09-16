export type UserRole = 'admin' | 'cashier';

export interface AuthorizedUser {
  email: string;
  addedBy: string;
  addedAt: string;
  role: UserRole;
  name?: string;
  status: 'active' | 'revoked';
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin: string;
  avatarColor: string;
  email?: string;
}

export interface Category {
  id: string;
  name: string;
  nameHi?: string;
  icon: string;
  color: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  nameHi?: string;
  category: string;
  costPrice: number;    // CP for profit/loss calculation
  sellingPrice: number; // MRP/Selling Price
  stock: number;
  minStockAlert: number;
  unit: string;         // 'pcs' | 'kg' | 'pack' | 'ltr' | 'box'
  taxRate: number;      // e.g. 0, 5, 12, 18, 28 (%)
  rackLocation?: string;
  expiryDate?: string;
  brand?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customDiscountPercent: number; // e.g. 0-50%
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'SPLIT';

export interface SaleItemSummary {
  productId: string;
  barcode: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface SaleReceipt {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  cashierId: string;
  cashierName: string;
  customerName: string;
  customerPhone: string;
  items: SaleItemSummary[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeGiven: number;
  paymentDetails?: {
    upiRef?: string;
    cardLast4?: string;
    cashAmount?: number;
    onlineAmount?: number;
  };
  totalCost: number; // Total COGS for profit computation
  profit: number;    // GrandTotal - TotalCost
  status: 'COMPLETED' | 'REFUNDED';
}

export interface MallSettings {
  mallName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  gstin: string;
  currencySymbol: string;
  receiptFooter: string;
  receiptTheme: 'colorful-modern' | 'supermarket-vibrant' | 'thermal-classic';
  taxName: string; // 'GST' | 'VAT' | 'Tax'
  upiId: string;   // For live QR code generation (e.g. megamall@upi)
  upiPayeeName?: string; // Merchant / Account holder name (e.g. "MegaMall Hypermarket" or Admin's Name)
  upiQrCustomImage?: string; // Uploaded custom QR code/standee image base64
  showUpiOnReceipt?: boolean; // Whether to display & print dynamic UPI scanner on bills (default true)
  upiQrMode?: 'dynamic' | 'custom'; // 'dynamic' (auto encoded bill amount) or 'custom' (uploaded QR)
}

export interface ProfitLossSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  transactionCount: number;
  grossRevenue: number;
  totalCogs: number;
  grossProfit: number;
  profitMarginPercent: number;
  taxCollected: number;
  totalDiscounts: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  itemSalesBreakdown: {
    productId: string;
    name: string;
    category: string;
    qtySold: number;
    revenue: number;
    cogs: number;
    profit: number;
    marginPercent: number;
  }[];
  dailyTrend: {
    date: string;
    label: string;
    revenue: number;
    cogs: number;
    profit: number;
    orders: number;
  }[];
}
