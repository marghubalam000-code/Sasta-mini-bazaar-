import { Category, MallSettings, Product, SaleReceipt, User, AuthorizedUser } from '../types';
import { INITIAL_CATEGORIES, INITIAL_SETTINGS, INITIAL_USERS } from '../data/initialData';
import { 
  db, 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  limit
} from '../lib/firebase';

export const MASTER_ADMIN_EMAIL = 'marghubalam000@gmail.com';

// Cache for verified email whitelist status (prevents repeated Firestore reads)
const verifiedEmailCache = new Map<string, { isAuthorized: boolean; expiry: number }>();

const KEYS = {
  PRODUCTS: 'megamall_products_v1',
  CATEGORIES: 'megamall_categories_v1',
  SALES: 'megamall_sales_v1',
  SETTINGS: 'megamall_settings_v1',
  USERS: 'megamall_users_v1',
  AUTHORIZED_USERS: 'megamall_authorized_users_v1',
  CURRENT_USER: 'megamall_current_user_v1',
  DELETED_PRODUCTS: 'megamall_deleted_products_ids_v1',
  DELETED_SALES: 'megamall_deleted_sales_ids_v1',
  LAST_SYNC: 'megamall_last_cloud_sync_v1',
};

// Deeply sanitize an object to strip undefined properties before sending to Firestore
// This is critical to prevent Firestore setDoc from failing silently or rejecting the document!
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

// User data must NEVER be treated as demo data
export function isDemoProduct(item: { id?: string }): boolean {
  if (!item || !item.id) return false;
  // Only target the specific seed IDs if explicitly needed; never regex filter user product IDs
  return false;
}

export function isDemoSale(item: { id?: string }): boolean {
  if (!item || !item.id) return false;
  // User sales must never be auto-classified as demo
  return false;
}

let isFirestoreInitialized = false;
let cloudSyncStatus = {
  isOnline: true,
  lastSyncedAt: new Date().toLocaleTimeString(),
  productCount: 0,
  salesCount: 0,
};

// Dispatch custom event for real-time reactivity across components
function dispatchChange(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('megamall:datachange', { detail: { key } }));
  }
}

export const storageService = {
  getCloudSyncStatus() {
    return cloudSyncStatus;
  },

  // Explicitly deleted tracking so user-initiated deletions stay deleted in both local & cloud
  getDeletedProductIds(): Set<string> {
    try {
      const raw = localStorage.getItem(KEYS.DELETED_PRODUCTS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  },

  addDeletedProductId(id: string): void {
    const set = this.getDeletedProductIds();
    set.add(id);
    localStorage.setItem(KEYS.DELETED_PRODUCTS, JSON.stringify(Array.from(set)));
  },

  removeDeletedProductId(id: string): void {
    const set = this.getDeletedProductIds();
    set.delete(id);
    localStorage.setItem(KEYS.DELETED_PRODUCTS, JSON.stringify(Array.from(set)));
  },

  getDeletedSaleIds(): Set<string> {
    try {
      const raw = localStorage.getItem(KEYS.DELETED_SALES);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  },

  addDeletedSaleId(id: string): void {
    const set = this.getDeletedSaleIds();
    set.add(id);
    localStorage.setItem(KEYS.DELETED_SALES, JSON.stringify(Array.from(set)));
  },

  // Initialization with Firestore real-time sync & fallback
  init() {
    if (typeof window === 'undefined') return;

    // 1. Initial LocalStorage baseline setup - PRESERVE existing user products & sales!
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
    }

    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }

    if (!localStorage.getItem(KEYS.SALES)) {
      localStorage.setItem(KEYS.SALES, JSON.stringify([]));
    }

    const existingSettings = localStorage.getItem(KEYS.SETTINGS);
    if (!existingSettings) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    } else {
      try {
        const parsed = JSON.parse(existingSettings);
        if (parsed.mallName === 'MEGAMALL RETAIL STORE' || !parsed.logoUrl) {
          parsed.mallName = 'Sasta Mini Bazaar';
          parsed.tagline = 'Sabse Sasta, Sabse Accha • Supermarket Store';
          parsed.logoUrl = '/logo.png';
          parsed.upiPayeeName = 'Sasta Mini Bazaar';
          parsed.receiptFooter = 'Sasta Mini Bazaar me aane ke liye dhanyawad! Visit again.';
          localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed));
        }
      } catch {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      }
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    // Note: Do not auto-set CURRENT_USER. Login is required via Firebase Authentication!

    if (isFirestoreInitialized) return;
    isFirestoreInitialized = true;

    // Zero-Cost, Low Read/Write Mode: NO background onSnapshot real-time listeners.
    // Realtime listeners are disabled to prevent unnecessary read and write spikes.
    // Local storage is used as the primary instant data store.
    this.pullFromCloudIfNeeded();
  },

  async pullFromCloudIfNeeded(force = false): Promise<void> {
    if (typeof window === 'undefined') return;

    const localProducts = this.getProducts();
    const lastSync = localStorage.getItem(KEYS.LAST_SYNC);
    const now = Date.now();

    // If local products exist and not forced, avoid querying Firestore (0 reads!)
    if (!force && localProducts.length > 0 && lastSync && (now - Number(lastSync) < 6 * 60 * 60 * 1000)) {
      cloudSyncStatus = {
        isOnline: true,
        lastSyncedAt: new Date(Number(lastSync)).toLocaleTimeString(),
        productCount: localProducts.length,
        salesCount: this.getSales().length,
      };
      dispatchChange('megamall_sync_status');
      return;
    }

    try {
      // 1. One-time fetch of products collection only if empty or explicitly forced
      const productsSnap = await getDocs(collection(db, 'products'));
      if (!productsSnap.empty) {
        const cloudProducts: Product[] = [];
        const deletedIds = this.getDeletedProductIds();
        productsSnap.forEach((docSnap) => {
          if (!deletedIds.has(docSnap.id)) {
            const data = docSnap.data();
            cloudProducts.push({
              id: docSnap.id,
              barcode: data.barcode || '',
              sku: data.sku || '',
              name: data.name || '',
              nameHi: data.nameHi || '',
              category: data.category || 'groceries',
              costPrice: Number(data.costPrice) || 0,
              sellingPrice: Number(data.sellingPrice) || 0,
              stock: Number(data.stock) ?? 0,
              minStockAlert: Number(data.minStockAlert) || 5,
              unit: data.unit || 'pcs',
              taxRate: Number(data.taxRate) || 0,
              rackLocation: data.rackLocation || '',
              brand: data.brand || '',
            });
          }
        });

        // Union with local products without duplicating
        const productMap = new Map<string, Product>();
        cloudProducts.forEach(p => productMap.set(p.id, p));
        localProducts.forEach(p => {
          if (!deletedIds.has(p.id) && !productMap.has(p.id)) {
            productMap.set(p.id, p);
          }
        });

        const mergedProducts = Array.from(productMap.values());
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(mergedProducts));
        dispatchChange(KEYS.PRODUCTS);
      }

      // 2. Fetch only the most recent 50 sales (NOT the whole historical collection!)
      const salesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'), limit(50));
      const salesSnap = await getDocs(salesQuery).catch(() => null);
      if (salesSnap && !salesSnap.empty) {
        const cloudSales: SaleReceipt[] = [];
        const deletedSaleIds = this.getDeletedSaleIds();
        salesSnap.forEach((docSnap) => {
          if (!deletedSaleIds.has(docSnap.id)) {
            cloudSales.push({ id: docSnap.id, ...(docSnap.data() as any) });
          }
        });

        const localSales = this.getSales();
        const salesMap = new Map<string, SaleReceipt>();
        cloudSales.forEach(s => salesMap.set(s.id, s));
        localSales.forEach(s => {
          if (!deletedSaleIds.has(s.id) && !salesMap.has(s.id)) {
            salesMap.set(s.id, s);
          }
        });

        const mergedSales = Array.from(salesMap.values());
        mergedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem(KEYS.SALES, JSON.stringify(mergedSales));
        dispatchChange(KEYS.SALES);
      }

      // 3. Settings: fetch store config once
      const settingsDocRef = doc(db, 'settings', 'store_config');
      const settingsSnap = await getDoc(settingsDocRef).catch(() => null);
      if (settingsSnap && settingsSnap.exists()) {
        const cloudSettings = settingsSnap.data() as MallSettings;
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloudSettings));
        dispatchChange(KEYS.SETTINGS);
      }

      localStorage.setItem(KEYS.LAST_SYNC, String(now));
      cloudSyncStatus = {
        isOnline: true,
        lastSyncedAt: new Date().toLocaleTimeString(),
        productCount: this.getProducts().length,
        salesCount: this.getSales().length,
      };
      dispatchChange('megamall_sync_status');
    } catch (err) {
      console.warn('Firestore cloud sync notice (operating in minimal local mode):', err);
      cloudSyncStatus.isOnline = false;
      dispatchChange('megamall_sync_status');
    }
  },

  async syncCloudData(): Promise<{ success: boolean; message: string }> {
    try {
      await this.pullFromCloudIfNeeded(true);
      return { success: true, message: 'Cloud sync completed successfully.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Sync failed' };
    }
  },

  // Products
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(KEYS.PRODUCTS);
      if (!data) return [];
      const parsed: Product[] = JSON.parse(data);
      const deletedIds = this.getDeletedProductIds();
      return parsed.filter(p => !deletedIds.has(p.id));
    } catch {
      return [];
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    dispatchChange(KEYS.PRODUCTS);
  },

  getProductByBarcode(barcode: string): Product | undefined {
    const products = this.getProducts();
    const clean = barcode.trim().toLowerCase();
    return products.find(p => 
      p.barcode.trim().toLowerCase() === clean || 
      p.sku.trim().toLowerCase() === clean ||
      p.barcode.replace(/\s+/g, '') === clean.replace(/\s+/g, '')
    );
  },

  addProduct(product: Product): Product {
    const cleanProduct: Product = {
      ...product,
      id: product.id && product.id.trim().length > 0
        ? product.id
        : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      barcode: product.barcode.trim(),
      sku: product.sku.trim(),
      name: product.name.trim(),
      category: (product.category || 'groceries').trim().toLowerCase(),
      stock: Number(product.stock) ?? 10,
      costPrice: Number(product.costPrice) || 0,
      sellingPrice: Number(product.sellingPrice) || 0,
    };

    // If previously deleted, revive it
    this.removeDeletedProductId(cleanProduct.id);

    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== cleanProduct.id && p.barcode !== cleanProduct.barcode);
    const updated = [cleanProduct, ...filtered];
    this.saveProducts(updated);

    // Save directly to Firebase Firestore with deep sanitization
    try {
      const docRef = doc(db, 'products', cleanProduct.id);
      const sanitized = sanitizeForFirestore({
        ...cleanProduct,
        updatedAt: new Date().toISOString()
      });
      setDoc(docRef, sanitized, { merge: true })
        .catch(err => console.warn('Firestore addProduct async warning:', err));
    } catch (err) {
      console.warn('Firestore addProduct error:', err);
    }

    return cleanProduct;
  },

  updateProduct(updated: Product): void {
    const cleanProduct: Product = {
      ...updated,
      barcode: updated.barcode.trim(),
      sku: updated.sku.trim(),
      name: updated.name.trim(),
      category: (updated.category || 'groceries').trim().toLowerCase(),
      stock: Number(updated.stock) ?? 0,
      costPrice: Number(updated.costPrice) || 0,
      sellingPrice: Number(updated.sellingPrice) || 0,
    };

    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === cleanProduct.id);
    if (idx !== -1) {
      products[idx] = cleanProduct;
      this.saveProducts(products);
    }

    try {
      const docRef = doc(db, 'products', cleanProduct.id);
      const sanitized = sanitizeForFirestore({
        ...cleanProduct,
        updatedAt: new Date().toISOString()
      });
      setDoc(docRef, sanitized, { merge: true })
        .catch(err => console.warn('Firestore updateProduct async error:', err));
    } catch (err) {
      console.warn('Firestore updateProduct error:', err);
    }
  },

  // ONLY deletes when user explicitly calls this
  deleteProduct(id: string): void {
    // 1. Mark as deleted so cloud sync doesn't resurrect it
    this.addDeletedProductId(id);

    // 2. Remove from local storage
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);

    // 3. Delete from Firebase Firestore
    try {
      const docRef = doc(db, 'products', id);
      deleteDoc(docRef).catch(err => console.warn('Firestore deleteProduct async error:', err));
    } catch (err) {
      console.warn('Firestore deleteProduct error:', err);
    }
  },

  adjustProductStock(id: string, delta: number): Product | null {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].stock = Math.max(0, products[idx].stock + delta);
      this.saveProducts(products);

      try {
        const docRef = doc(db, 'products', id);
        const sanitized = sanitizeForFirestore({
          stock: products[idx].stock,
          updatedAt: new Date().toISOString()
        });
        setDoc(docRef, sanitized, { merge: true })
          .catch(err => console.warn('Firestore adjustStock error:', err));
      } catch (err) {
        console.warn('Firestore adjustStock error:', err);
      }

      return products[idx];
    }
    return null;
  },

  // Sales
  getSales(): SaleReceipt[] {
    try {
      const data = localStorage.getItem(KEYS.SALES);
      if (!data) return [];
      const parsed: SaleReceipt[] = JSON.parse(data);
      const deletedIds = this.getDeletedSaleIds();
      return parsed.filter(s => !deletedIds.has(s.id));
    } catch {
      return [];
    }
  },

  recordSale(receipt: SaleReceipt): void {
    const sales = this.getSales();
    sales.unshift(receipt);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));

    // Deduct stock for sold items locally
    const products = this.getProducts();
    const updatedProductsMap = new Map<string, number>();

    receipt.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        updatedProductsMap.set(prod.id, prod.stock);
      }
    });
    this.saveProducts(products);
    dispatchChange(KEYS.SALES);

    // Atomically commit the sale receipt AND stock deductions in 1 single writeBatch
    // This minimizes network operations and eliminates multiple separate writes
    try {
      const batch = writeBatch(db);

      // 1. Add the sale receipt document to the batch
      const saleDocRef = doc(db, 'sales', receipt.id);
      const sanitizedReceipt = sanitizeForFirestore(receipt);
      batch.set(saleDocRef, sanitizedReceipt);

      // 2. Add each product's updated stock to the same batch
      updatedProductsMap.forEach((newStock, prodId) => {
        const prodDocRef = doc(db, 'products', prodId);
        batch.set(prodDocRef, sanitizeForFirestore({
          stock: newStock,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      });

      // Commit the single combined atomic batch
      batch.commit().catch(err => {
        console.warn('Firestore batch sale commit async warning:', err);
      });
    } catch (err) {
      console.warn('Firestore batch sale creation error:', err);
    }
  },

  // ONLY deletes when user explicitly clicks delete on a receipt
  deleteSale(saleId: string): void {
    // 1. Mark as deleted so cloud sync doesn't resurrect it
    this.addDeletedSaleId(saleId);

    // 2. Remove from local storage
    const sales = this.getSales().filter(s => s.id !== saleId);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    dispatchChange(KEYS.SALES);

    // 3. Delete from Firebase Firestore
    try {
      const saleDocRef = doc(db, 'sales', saleId);
      deleteDoc(saleDocRef).catch(err => console.warn('Firestore deleteSale async error:', err));
    } catch (err) {
      console.warn('Firestore deleteSale error:', err);
    }
  },

  getNextInvoiceNumber(): string {
    const sales = this.getSales();
    const count = sales.length + 1001;
    const year = new Date().getFullYear();
    return `INV-${year}-${count}`;
  },

  // Settings
  getSettings(): MallSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) return INITIAL_SETTINGS;
      const parsed = JSON.parse(data);
      if (!parsed.mallName || parsed.mallName === 'MEGAMALL RETAIL STORE') {
        parsed.mallName = 'Sasta Mini Bazaar';
        parsed.tagline = 'Sabse Sasta, Sabse Accha • Supermarket Store';
        parsed.logoUrl = '/logo.png';
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.logoUrl) {
        parsed.logoUrl = '/logo.png';
      }
      return parsed;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: MallSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    dispatchChange(KEYS.SETTINGS);

    try {
      const settingsDocRef = doc(db, 'settings', 'store_config');
      setDoc(settingsDocRef, settings, { merge: true })
        .catch(err => console.warn('Firestore saveSettings async error:', err));
    } catch (err) {
      console.warn('Firestore saveSettings error:', err);
    }
  },

  // Categories
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  // Users & Auth
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  // Subscribe to storage changes
  subscribe(listener: () => void): () => void {
    const handler = () => listener();
    window.addEventListener('megamall:datachange', handler);
    return () => window.removeEventListener('megamall:datachange', handler);
  },

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
    dispatchChange(KEYS.CURRENT_USER);
  },

  // Authorized Whitelisted Users (Master Admin: marghubalam000@gmail.com)
  getLocalAuthorizedUsers(): AuthorizedUser[] {
    try {
      const data = localStorage.getItem(KEYS.AUTHORIZED_USERS);
      const list: AuthorizedUser[] = data ? JSON.parse(data) : [];
      // Ensure master admin is always present in list
      if (!list.some(u => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase())) {
        list.unshift({
          email: MASTER_ADMIN_EMAIL,
          addedBy: 'SYSTEM',
          addedAt: '2026-01-01T00:00:00.000Z',
          role: 'admin',
          name: 'Marghub Alam (Master Admin)',
          status: 'active'
        });
      }
      return list;
    } catch {
      return [{
        email: MASTER_ADMIN_EMAIL,
        addedBy: 'SYSTEM',
        addedAt: '2026-01-01T00:00:00.000Z',
        role: 'admin',
        name: 'Marghub Alam (Master Admin)',
        status: 'active'
      }];
    }
  },

  async isEmailAuthorized(email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    
    // Master admin is always authorized with ZERO Firestore reads
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }

    // Check memory cache: if verified recently within 30 minutes, 0 reads!
    const cached = verifiedEmailCache.get(cleanEmail);
    if (cached && Date.now() < cached.expiry) {
      return cached.isAuthorized;
    }

    try {
      // Check cloud Firestore authorized_users collection
      const authDocRef = doc(db, 'authorized_users', cleanEmail);
      const authSnap = await getDoc(authDocRef);
      if (authSnap.exists()) {
        const data = authSnap.data();
        const isActive = data.status === 'active';
        verifiedEmailCache.set(cleanEmail, {
          isAuthorized: isActive,
          expiry: Date.now() + 30 * 60 * 1000
        });
        return isActive;
      } else {
        verifiedEmailCache.set(cleanEmail, {
          isAuthorized: false,
          expiry: Date.now() + 30 * 60 * 1000
        });
        return false;
      }
    } catch (err) {
      console.warn('Firestore authorized_users check notice (network/offline):', err);
    }

    // Fallback only if Firestore network check failed (e.g. offline mode)
    const localList = this.getLocalAuthorizedUsers();
    return localList.some(u => u.email.toLowerCase() === cleanEmail && u.status === 'active');
  },

  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    const list = this.getLocalAuthorizedUsers();
    try {
      const snap = await getDocs(collection(db, 'authorized_users'));
      if (!snap.empty) {
        const cloudUsers: AuthorizedUser[] = [];
        snap.forEach(d => {
          cloudUsers.push(d.data() as AuthorizedUser);
        });
        
        // Merge with local list
        const map = new Map<string, AuthorizedUser>();
        list.forEach(u => map.set(u.email.toLowerCase(), u));
        cloudUsers.forEach(u => map.set(u.email.toLowerCase(), u));
        
        const merged = Array.from(map.values());
        localStorage.setItem(KEYS.AUTHORIZED_USERS, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('getAuthorizedUsers cloud notice:', err);
    }
    return list;
  },

  async addAuthorizedUser(email: string, addedBy: string, name?: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    // Invalidate local verification cache
    verifiedEmailCache.delete(cleanEmail);

    const entry: AuthorizedUser = {
      email: cleanEmail,
      addedBy,
      addedAt: new Date().toISOString(),
      role: 'admin',
      name: name || cleanEmail.split('@')[0],
      status: 'active'
    };

    // Save to Firestore (single direct write)
    try {
      await setDoc(doc(db, 'authorized_users', cleanEmail), entry);
    } catch (err) {
      console.warn('Failed to save authorized user to Firestore:', err);
    }

    // Save to local storage
    const list = this.getLocalAuthorizedUsers();
    const updated = list.filter(u => u.email.toLowerCase() !== cleanEmail);
    updated.push(entry);
    localStorage.setItem(KEYS.AUTHORIZED_USERS, JSON.stringify(updated));
    dispatchChange(KEYS.AUTHORIZED_USERS);
  },

  async removeAuthorizedUser(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Master administrator cannot be removed.');
    }

    // Invalidate local verification cache
    verifiedEmailCache.delete(cleanEmail);

    try {
      await deleteDoc(doc(db, 'authorized_users', cleanEmail));
    } catch (err) {
      console.warn('Failed to delete authorized user from Firestore:', err);
    }

    const list = this.getLocalAuthorizedUsers();
    const updated = list.filter(u => u.email.toLowerCase() !== cleanEmail);
    localStorage.setItem(KEYS.AUTHORIZED_USERS, JSON.stringify(updated));
    dispatchChange(KEYS.AUTHORIZED_USERS);
  },

  // Database Backup & Restore Feature
  exportFullBackup(): string {
    const backupData = {
      timestamp: new Date().toISOString(),
      app: 'MegaMall POS & Retail Management System',
      version: '2.0',
      database: {
        products: this.getProducts(),
        sales: this.getSales(),
        settings: this.getSettings(),
        categories: INITIAL_CATEGORIES,
        users: this.getUsers(),
      }
    };
    return JSON.stringify(backupData, null, 2);
  },

  downloadBackupFile(): void {
    const json = this.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `MegaMall_Database_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importBackupFile(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.database || !Array.isArray(parsed.database.products)) {
        return { success: false, message: 'Invalid backup file format. Missing items database.' };
      }

      const backupDb = parsed.database;
      if (Array.isArray(backupDb.products)) {
        const cleanProds = backupDb.products.filter((p: any) => !isDemoProduct(p));
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(cleanProds));
        // Also upload to Firestore
        try {
          const batch = writeBatch(db);
          cleanProds.forEach((prod: Product) => {
            const docRef = doc(db, 'products', prod.id);
            batch.set(docRef, { ...prod, updatedAt: new Date().toISOString() });
          });
          batch.commit().catch(err => console.warn('Firestore backup restore commit warning:', err));
        } catch (e) {
          console.warn('Firestore backup sync skipped:', e);
        }
      }
      if (Array.isArray(backupDb.sales)) {
        const cleanSales = backupDb.sales.filter((s: any) => !isDemoSale(s));
        localStorage.setItem(KEYS.SALES, JSON.stringify(cleanSales));
      }
      if (backupDb.settings) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(backupDb.settings));
      }
      if (Array.isArray(backupDb.users)) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(backupDb.users));
      }

      dispatchChange(KEYS.PRODUCTS);
      dispatchChange(KEYS.SALES);
      dispatchChange(KEYS.SETTINGS);
      return { success: true, message: `Successfully restored ${this.getProducts().length} products and ${this.getSales().length} sales records!` };
    } catch (err) {
      return { success: false, message: 'Failed to parse JSON file: ' + (err instanceof Error ? err.message : String(err)) };
    }
  },

  // Purge demo data method kept for administrative cleanup if requested
  purgeAllDemoData(): void {
    // User data is preserved; this method no longer destroys user data
    dispatchChange(KEYS.PRODUCTS);
    dispatchChange(KEYS.SALES);
  },

  // Clear all products (Empty Catalogue)
  clearAllProducts(): void {
    const current = this.getProducts();
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
    dispatchChange(KEYS.PRODUCTS);

    try {
      const batch = writeBatch(db);
      current.forEach(p => {
        batch.delete(doc(db, 'products', p.id));
      });
      batch.commit().catch(err => console.warn('Firestore clear products error:', err));
    } catch (e) {
      console.warn('Firestore clear products error:', e);
    }
  },

  // Clear all sales (Empty Invoices / Orders)
  clearAllSales(): void {
    const current = this.getSales();
    localStorage.setItem(KEYS.SALES, JSON.stringify([]));
    dispatchChange(KEYS.SALES);

    try {
      const batch = writeBatch(db);
      current.forEach(s => {
        batch.delete(doc(db, 'sales', s.id));
      });
      batch.commit().catch(err => console.warn('Firestore clear sales error:', err));
    } catch (e) {
      console.warn('Firestore clear sales error:', e);
    }
  },

  // Reset to clean production slate (NO demo data)
  resetToDefaultSeed(): void {
    this.purgeAllDemoData();
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    dispatchChange(KEYS.PRODUCTS);
    dispatchChange(KEYS.SALES);
    dispatchChange(KEYS.SETTINGS);
  }
};
