import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  getProductName: (product: { name: string; nameHi?: string }) => string;
  getCategoryName: (category: any) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & App
    appName: 'Sasta Mini Bazaar',
    appSubtitle: 'Supermarket POS & Retail Inventory',
    tagline: 'Cheapest & Best • Supermarket Store',
    firebaseLive: 'Cloud Saver Mode',
    firebaseCloudActive: 'Firebase Low-Usage Mode: Active',
    storeAdminPortal: 'Store Administrator Portal',
    adminAccessOnly: 'Admin Access Only',
    roleAdmin: 'Store Admin',
    roleCashier: 'Cashier',
    
    // Navbar
    navDashboard: 'Dashboard',
    navPos: 'POS Billing',
    navInventory: 'Inventory',
    navReports: 'Profit & Loss',
    navBackup: 'Backup',
    navSettings: 'Settings',
    navLogout: 'Logout',
    navQuickBackup: 'Backup',
    navCashierMode: 'Cashier Mode (Billing Active)',
    languageSwitch: 'Language',

    // Dashboard
    dashTitle: 'Store Performance Dashboard',
    dashSubtitle: 'Real-time sales tracking, lifetime revenue, and store analytics',
    timeFilterAllTime: 'All Time',
    timeFilterToday: 'Today',
    timeFilterYesterday: 'Yesterday',
    timeFilterMonth: 'This Month',
    totalRevenue: 'Total Revenue',
    todaysSales: "Today's Sales",
    totalInvoices: 'Total Invoices',
    grossProfit: 'Gross Profit',
    estimatedNetMargin: 'Gross Profit Margin',
    recentInvoices: 'Recent Invoices',
    recentInvoicesDesc: 'Saved sales transactions (Permanent Cloud & Local Storage)',
    noSalesRecorded: 'No sales records found for this time period.',
    startBillingNow: 'Open POS Terminal',
    invoiceNo: 'Invoice No',
    dateAndTime: 'Date & Time',
    customer: 'Customer',
    itemsCount: 'Items',
    totalAmount: 'Total Amount',
    paymentMethod: 'Payment Mode',
    actions: 'Actions',
    viewReceipt: 'View Receipt',
    deleteInvoice: 'Delete Invoice',
    confirmDeleteInvoice: 'Are you sure you want to permanently delete Invoice',
    deleteIrreversibleNotice: 'This action will remove the record from both local storage and Firebase Cloud permanently.',
    dataProtectionTitle: 'Permanent Data Storage Active',
    dataProtectionDesc: 'Automatic deletion is disabled. All products, invoices, and sales remain permanently stored until manually deleted.',
    topSellingProducts: 'Top Selling Products',
    unitsSold: 'units sold',
    walkInCustomer: 'Walk-in Customer',
    quickNavPos: 'New Sale / Billing',
    quickNavInventory: 'Manage Stock',
    quickNavReports: 'P&L Reports',
    totalProductsCount: 'Total Products',
    totalInvoicesCount: 'Total Invoices',
    welcomeBack: 'Welcome back',
    realTimePosLive: 'Real-Time POS Live Active',
    secureSyncActive: 'Secure Cloud Sync Active',
    autoDeleteOff: 'Auto-Delete Disabled',
    hourlySalesTraffic: 'Hourly Sales Traffic & Revenue',
    paymentBreakdown: 'Payment Method Breakdown',
    stockAlertTitle: 'Low Stock Alert',
    restock20Units: '+20 Stock',
    allStockHealthy: 'All stock quantities are currently healthy.',

    // POS Billing
    posTitle: 'POS Fast Billing Terminal',
    newBill: 'New Bill',
    cartEmpty: 'Your cart is empty',
    cartEmptyDesc: 'Scan a barcode or select products below to start billing.',
    searchProductPlaceholder: 'Search by product name, category or brand...',
    scanBarcodePlaceholder: 'Scan / Type Barcode (Enter)',
    allCategories: 'All Categories',
    cartSummary: 'Cart Summary',
    clearCart: 'Clear Cart',
    confirmClearCart: 'Are you sure you want to clear the active cart?',
    customerDetails: 'Customer Details (Optional)',
    customerName: 'Customer Name',
    customerPhone: 'Phone Number (for SMS Bill)',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    rate: 'Rate',
    disc: 'Disc',
    amount: 'Amount',
    subtotal: 'Subtotal',
    discountAmount: 'Discount',
    taxGst: 'Tax (GST)',
    grandTotal: 'Grand Total',
    paymentModes: 'Select Payment Mode',
    payCash: 'Cash',
    payUpi: 'UPI QR',
    payCard: 'Card',
    paySplit: 'Split',
    cashReceived: 'Cash Received (₹)',
    returnChange: 'Return Change (₹)',
    exactAmount: 'Exact Amount',
    scanToPayUpi: 'Scan UPI QR to Pay Instantly',
    completeAndPrintBill: 'Complete & Print 80mm Bill',
    processingPayment: 'Processing Bill...',
    outOfStock: 'Out of Stock',
    stockLeft: 'in stock',
    barcodeNotFound: 'Product with this barcode was not found in inventory.',
    itemAddedSuccess: 'added to cart!',
    f2BarcodeKey: 'F2: Scan Barcode',
    f4CatalogKey: 'F4: Product Catalog',
    quickAddProduct: 'Quick Add Product',
    selectProductFromList: 'Select Product',

    // Receipt Modal & 80mm Thermal Bill
    taxInvoice: 'TAX INVOICE / RETAIL BILL',
    billNumber: 'Bill No',
    dateLabel: 'Date',
    cashierLabel: 'Operator / Cashier',
    customerLabel: 'Customer',
    contactLabel: 'Contact',
    itemCol: 'Item Name',
    qtyCol: 'Qty',
    rateCol: 'Rate',
    amountCol: 'Total',
    subTotalLabel: 'Sub Total',
    totalDiscountLabel: 'Total Discount',
    gstTaxLabel: 'GST Included',
    grandTotalLabel: 'GRAND TOTAL',
    netPayable: 'NET PAYABLE',
    paymentModeLabel: 'Payment Mode',
    paymentStatusLabel: 'Payment Status',
    paidStatus: 'PAID',
    scanUpiNotice: 'Scan to pay via UPI app',
    termsAndConditions: 'Items once sold cannot be returned after 3 days.',
    thankYouVisitAgain: 'Thank You! Visit Again.',
    thermalBill80mmNotice: 'Standard 80mm Thermal Bill (Approx 3.15" wide)',
    printBillNow: 'Print 80mm Receipt',
    closeModal: 'Close',
    shareBill: 'Share',
    copiedBill: 'Copied',
    format80mmLabel: '80mm Thermal Bill (3.15 inch width) • ESC/POS Standard',
    youSavedOnBill: 'YOU SAVED ON THIS BILL',
    changeReturnedLabel: 'Change Returned',
    totalItemsLabel: 'Total Items',
    piecesLabel: 'pcs',

    // Inventory Manager
    inventoryTitle: 'Inventory & Stock Management',
    inventorySubtitle: 'Manage product catalog, barcode scanning, selling & cost prices',
    addNewProduct: 'Add New Product',
    searchInventoryPlaceholder: 'Search inventory by name, barcode, brand...',
    totalProducts: 'Total Items',
    lowStockWarning: 'Low Stock Alert',
    totalStockValue: 'Stock Valuation (Cost)',
    totalRetailValue: 'Stock Valuation (MRP)',
    barcode: 'Barcode',
    productName: 'Product Name (English)',
    productNameHindi: 'Product Name (Hindi)',
    category: 'Category',
    costPrice: 'Cost Price (₹)',
    sellingPrice: 'Selling Price / MRP (₹)',
    stock: 'Stock Quantity',
    minStockAlert: 'Min Stock Alert',
    unit: 'Unit',
    rackLocation: 'Rack Location',
    brand: 'Brand / Company',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    confirmDeleteProduct: 'Are you sure you want to permanently delete product',
    saveProduct: 'Save Product',
    cancel: 'Cancel',
    productSavedSuccess: 'Product saved successfully!',
    productDeletedSuccess: 'Product deleted permanently!',
    generateBarcodeBtn: 'Generate Barcode',
    stockFilterAll: 'All Stock',
    stockFilterLow: 'Low Stock',
    stockFilterOut: 'Out of Stock',
    printBarcodeLabel: 'Print Barcode Sheet',

    // Reports
    reportsTitle: 'Profit & Loss Financial Reports',
    reportsSubtitle: 'Accurate revenue, cost of goods sold (COGS), gross & net margins',
    netProfit: 'Net Gross Profit',
    totalCostOfGoods: 'Cost of Goods Sold (COGS)',
    averageOrderValue: 'Average Order Value (AOV)',
    profitMarginPercent: 'Profit Margin (%)',
    salesBreakdown: 'Sales & Profit Breakdown',
    printReport: 'Print Report',
    exportSummary: 'Export Summary',
    noReportData: 'No sales recorded yet. Process invoices in POS billing to view financial analytics.',

    // Backup
    backupTitle: 'Data Backup & Disaster Recovery',
    backupSubtitle: 'Export local & cloud database backup JSON or restore data safely',
    downloadBackupJson: 'Download Backup (.JSON)',
    downloadBackupDesc: 'Generates an instant complete backup of products, sales records, categories, and settings.',
    restoreBackupJson: 'Restore from Backup',
    restoreBackupDesc: 'Import an existing backup file to restore database records safely.',
    firestoreSyncHeading: 'Firebase Cloud Database Status',
    firestoreSyncDesc: 'Your inventory and sales data are synced in real-time with Google Cloud Firestore database.',
    syncStatusActive: 'Active & Protected',

    // Settings
    settingsTitle: 'Store Configuration & Settings',
    settingsSubtitle: 'Configure supermarket identity, GSTIN, receipt templates, and UPI',
    mallNameLabel: 'Store / Supermarket Name',
    storeTaglineLabel: 'Store Tagline / Slogan',
    storePhoneLabel: 'Contact Phone Number',
    storeEmailLabel: 'Store Email Address',
    storeAddressLabel: 'Store Address',
    cityStateZipLabel: 'City, State & Pincode',
    gstinLabel: 'GSTIN Number (Optional)',
    currencySymbolLabel: 'Currency Symbol',
    receiptFooterLabel: 'Receipt Footer Greeting',
    upiIdLabel: 'Store UPI ID (for QR Code)',
    upiPayeeNameLabel: 'UPI Payee Display Name',
    thermalPrinterNotice: 'Receipts are automatically formatted for 80mm standard thermal roll paper (approx 3.15 inches / 384-576 dots).',
    saveSettingsBtn: 'Save Settings',
    settingsSavedSuccess: 'Settings updated successfully!',

    // Auth & Login
    authAdminTitle: 'Store Administrator Login',
    authAdminSubtitle: 'Supermarket POS & Retail Management',
    authRequiredNotice: 'Firebase Authentication Required',
    authRequiredDesc: 'Only authorized store administrators can access the system. Please sign in with your Firebase credentials.',
    signInWithGoogle: 'Sign In with Google',
    orEmailPassword: 'or Email & Password',
    adminEmailLabel: 'Admin Email',
    adminPasswordLabel: 'Admin Password',
    confirmPasswordLabel: 'Confirm Password',
    forgotPasswordQuestion: 'Forgot Password?',
    signInBtn: 'Sign In as Admin',
    createAdminBtn: 'Register New Admin',
    processingAuth: 'Please wait...',
    registerAccountLink: 'Register new store admin account',
    alreadyHaveAccountLink: 'Already have an account? Sign in',
    resetPasswordTitle: 'Enter registered admin email',
    sendResetLinkBtn: 'Send Password Reset Link',
    backToLoginBtn: '← Back to Admin Login',
    resetLinkSentMsg: 'Password reset link sent successfully! Check your inbox or spam folder.',
    adminPrivilegesTitle: 'Admin Privileges:',
    adminPrivilegesDesc: 'Full system control: POS Billing Terminal, 80mm Thermal Receipts, Stock & Inventory Control, Profit & Loss Analytics, Cloud Backup, and Store Settings.',
    invalidCredentialsMsg: 'Invalid email or password! Please check your credentials.',
    passwordsDoNotMatch: 'Passwords do not match!',
    passwordTooShort: 'Password must be at least 6 characters long.',
  },

  hi: {
    // Brand & App
    appName: 'सस्ता मिनी बाज़ार',
    appSubtitle: 'सुपरमार्केट पीओएस एवं रिटेल इन्वेंटरी',
    tagline: 'सबसे सस्ता, सबसे अच्छा • सुपरमार्केट स्टोर',
    firebaseLive: 'कोटा बचत मोड',
    firebaseCloudActive: 'फायरबेस न्यूनतम यूसेज मोड: सक्रिय',
    storeAdminPortal: 'स्टोर एडमिनिस्ट्रेटर पोर्टल',
    adminAccessOnly: 'केवल एडमिन अधिकार',
    roleAdmin: 'स्टोर एडमिन',
    roleCashier: 'कैशियर',

    // Navbar
    navDashboard: 'डैशबोर्ड',
    navPos: 'बिलिंग टर्मिनल',
    navInventory: 'स्टॉक इन्वेंटरी',
    navReports: 'लाभ एवं हानि',
    navBackup: 'बैकअप',
    navSettings: 'सेटिंग्स',
    navLogout: 'लॉगआउट',
    navQuickBackup: 'डेटा बैकअप',
    navCashierMode: 'बिलिंग मोड चालू',
    languageSwitch: 'भाषा',

    // Dashboard
    dashTitle: 'स्टोर परफॉरमेंस डैशबोर्ड',
    dashSubtitle: 'रीयल-टाइम बिक्री ट्रैकिंग, कुल रेवेन्यू और स्टोर विश्लेषण',
    timeFilterAllTime: 'कुल बिक्री',
    timeFilterToday: 'आज',
    timeFilterYesterday: 'कल',
    timeFilterMonth: 'इस महीने',
    totalRevenue: 'कुल रेवेन्यू',
    todaysSales: 'आज की बिक्री',
    totalInvoices: 'कुल जारी बिल',
    grossProfit: 'कुल ग्रॉस प्रॉफिट',
    estimatedNetMargin: 'लाभ मार्जिन',
    recentInvoices: 'हाल के बिक्री बिल',
    recentInvoicesDesc: 'स्थायी रूप से सुरक्षित बिक्री लेनदेन',
    noSalesRecorded: 'इस समयावधि के लिए कोई बिल दर्ज नहीं है।',
    startBillingNow: 'नया बिल बनाएं',
    invoiceNo: 'बिल संख्या',
    dateAndTime: 'दिनांक एवं समय',
    customer: 'ग्राहक',
    itemsCount: 'सामग्री',
    totalAmount: 'कुल राशि',
    paymentMethod: 'भुगतान विधि',
    actions: 'कार्रवाई',
    viewReceipt: 'रसीद देखें',
    deleteInvoice: 'बिल हटाएं',
    confirmDeleteInvoice: 'क्या आप निश्चित रूप से बिल संख्या हटाना चाहते हैं:',
    deleteIrreversibleNotice: 'यह कार्रवाई इस बिल को डेटाबेस से स्थायी रूप से हटा देगी।',
    dataProtectionTitle: 'स्थायी डेटा सुरक्षा सक्रिय',
    dataProtectionDesc: 'ऑटो-डिलीट बंद है। आपके सभी उत्पाद और बिल हमेशा सुरक्षित रहेंगे जब तक आप स्वयं उन्हें डिलीट नहीं करते।',
    topSellingProducts: 'सर्वाधिक बिकने वाले उत्पाद',
    unitsSold: 'यूनिट बिकी',
    walkInCustomer: 'दुकानदार ग्राहक',
    quickNavPos: 'नया बिल / बिलिंग',
    quickNavInventory: 'स्टॉक संभालें',
    quickNavReports: 'लाभ-हानि रिपोर्ट',
    totalProductsCount: 'कुल उत्पाद',
    totalInvoicesCount: 'कुल बिल',
    welcomeBack: 'स्वागत है',
    realTimePosLive: 'रीयल-टाइम बिलिंग सक्रिय',
    secureSyncActive: 'सुरक्षित क्लाउड सिंक चालू',
    autoDeleteOff: 'ऑटो-डिलीट बंद है',
    hourlySalesTraffic: 'घंटे के अनुसार बिक्री एवं आय',
    paymentBreakdown: 'भुगतान विधि का विवरण',
    stockAlertTitle: 'कम स्टॉक चेतावनी',
    restock20Units: '+20 स्टॉक जोड़ें',
    allStockHealthy: 'सभी उत्पादों का स्टॉक पर्याप्त है।',

    // POS Billing
    posTitle: 'फास्ट बिलिंग टर्मिनल',
    newBill: 'नया बिल',
    cartEmpty: 'आपकी कार्ट खाली है',
    cartEmptyDesc: 'बिलिंग शुरू करने के लिए बारकोड स्कैन करें या उत्पाद चुनें।',
    searchProductPlaceholder: 'उत्पाद का नाम, श्रेणी या ब्रांड खोजें...',
    scanBarcodePlaceholder: 'बारकोड स्कैन करें या टाइप करें...',
    allCategories: 'सभी श्रेणियां',
    cartSummary: 'बिल सारांश',
    clearCart: 'कार्ट खाली करें',
    confirmClearCart: 'क्या आप सक्रिय कार्ट को खाली करना चाहते हैं?',
    customerDetails: 'ग्राहक विवरण (वैकल्पिक)',
    customerName: 'ग्राहक का नाम',
    customerPhone: 'मोबाइल नंबर',
    item: 'सामग्री',
    qty: 'मात्रा',
    price: 'मूल्य',
    rate: 'दर',
    disc: 'छूट',
    amount: 'राशि',
    subtotal: 'उप-योग',
    discountAmount: 'कुल छूट',
    taxGst: 'जीएसटी टैक्स',
    grandTotal: 'कुल देय राशि',
    paymentModes: 'भुगतान का माध्यम चुनें',
    payCash: 'नकद',
    payUpi: 'यूपीआई क्यूआर',
    payCard: 'कार्ड',
    paySplit: 'मिश्रित',
    cashReceived: 'प्राप्त नकद राशि (₹)',
    returnChange: 'वापसी राशि (₹)',
    exactAmount: 'पूरी राशि',
    scanToPayUpi: 'भुगतान के लिए यूपीआई क्यूआर स्कैन करें',
    completeAndPrintBill: 'बिल पूर्ण करें और 80mm प्रिंट करें',
    processingPayment: 'बिल बनाया जा रहा है...',
    outOfStock: 'स्टॉक समाप्त',
    stockLeft: 'स्टॉक शेष',
    barcodeNotFound: 'इस बारकोड का कोई उत्पाद इन्वेंटरी में नहीं मिला।',
    itemAddedSuccess: 'कार्ट में जोड़ा गया!',
    f2BarcodeKey: 'F2: बारकोड स्कैन',
    f4CatalogKey: 'F4: उत्पाद सूची',
    quickAddProduct: 'नया उत्पाद तुरंत जोड़ें',
    selectProductFromList: 'उत्पाद चुनें',

    // Receipt Modal & 80mm Thermal Bill
    taxInvoice: 'टैक्स इन्वॉइस / कैश रसीद',
    billNumber: 'बिल नं.',
    dateLabel: 'दिनांक',
    cashierLabel: 'ऑपरेटर / कैशियर',
    customerLabel: 'ग्राहक',
    contactLabel: 'मोबाइल',
    itemCol: 'सामग्री विवरण',
    qtyCol: 'मात्रा',
    rateCol: 'दर',
    amountCol: 'कुल राशि',
    subTotalLabel: 'उप-योग',
    totalDiscountLabel: 'कुल छूट',
    gstTaxLabel: 'जीएसटी शामिल',
    grandTotalLabel: 'कुल देय राशि',
    netPayable: 'कुल देय राशि',
    paymentModeLabel: 'भुगतान माध्यम',
    paymentStatusLabel: 'भुगतान स्थिति',
    paidStatus: 'सफल भुगतान',
    scanUpiNotice: 'यूपीआई ऐप से स्कैन करके भुगतान करें',
    termsAndConditions: 'बिका हुआ माल 3 दिन के भीतर ही वापस होगा।',
    thankYouVisitAgain: 'सस्ता मिनी बाज़ार में आने के लिए धन्यवाद! पुनः पधारें।',
    thermalBill80mmNotice: 'मानक 80mm थर्मल बिल (लगभग 3.15 इंच चौड़ा)',
    printBillNow: '80mm रसीद प्रिंट करें',
    closeModal: 'बंद करें',
    shareBill: 'शेयर करें',
    copiedBill: 'कॉपी हो गया',
    format80mmLabel: '80mm थर्मल बिल (3.15 इंच चौड़ाई)',
    youSavedOnBill: 'इस बिल पर आपकी कुल बचत',
    changeReturnedLabel: 'वापसी राशि',
    totalItemsLabel: 'कुल सामग्री',
    piecesLabel: 'नग',

    // Inventory Manager
    inventoryTitle: 'इन्वेंटरी एवं स्टॉक प्रबंधन',
    inventorySubtitle: 'उत्पाद सूची, बारकोड, खरीद मूल्य एवं बिक्री मूल्य प्रबंधन',
    addNewProduct: 'नया उत्पाद जोड़ें',
    searchInventoryPlaceholder: 'नाम, बारकोड या ब्रांड द्वारा खोजें...',
    totalProducts: 'कुल उत्पाद',
    lowStockWarning: 'कम स्टॉक चेतावनी',
    totalStockValue: 'स्टॉक खरीद मूल्य',
    totalRetailValue: 'स्टॉक बिक्री मूल्य',
    barcode: 'बारकोड',
    productName: 'उत्पाद का नाम (अंग्रेजी)',
    productNameHindi: 'उत्पाद का नाम (हिंदी)',
    category: 'श्रेणी',
    costPrice: 'खरीद मूल्य (₹)',
    sellingPrice: 'बिक्री मूल्य (₹)',
    stock: 'वर्तमान स्टॉक मात्रा',
    minStockAlert: 'न्यूनतम स्टॉक अलर्ट',
    unit: 'इकाई',
    rackLocation: 'रैक / स्थान',
    brand: 'ब्रांड / कंपनी',
    editProduct: 'उत्पाद संपादित करें',
    deleteProduct: 'उत्पाद हटाएं',
    confirmDeleteProduct: 'क्या आप निश्चित रूप से इस उत्पाद को स्थायी रूप से हटाना चाहते हैं:',
    saveProduct: 'उत्पाद सहेजें',
    cancel: 'रद्द करें',
    productSavedSuccess: 'उत्पाद सफलतापूर्वक सहेजा गया!',
    productDeletedSuccess: 'उत्पाद स्थायी रूप से हटा दिया गया!',
    generateBarcodeBtn: 'नया बारकोड बनाएं',
    stockFilterAll: 'सभी स्टॉक',
    stockFilterLow: 'कम स्टॉक',
    stockFilterOut: 'स्टॉक समाप्त',
    printBarcodeLabel: 'बारकोड शीट प्रिंट करें',

    // Reports
    reportsTitle: 'लाभ-हानि वित्तीय रिपोर्ट्स',
    reportsSubtitle: 'सटीक रेवेन्यू, सामान की खरीद लागत और लाभ मार्जिन',
    netProfit: 'शुद्ध ग्रॉस प्रॉफिट',
    totalCostOfGoods: 'सामान की खरीद लागत',
    averageOrderValue: 'औसत बिल राशि',
    profitMarginPercent: 'प्रॉफिट मार्जिन प्रतिशत',
    salesBreakdown: 'दैनिक बिक्री एवं लाभ विवरण',
    printReport: 'रिपोर्ट प्रिंट करें',
    exportSummary: 'सारांश डाउनलोड करें',
    noReportData: 'अभी तक कोई बिक्री दर्ज नहीं हुई है। वित्तीय विश्लेषण देखने के लिए बिलिंग करें।',

    // Backup
    backupTitle: 'डेटा बैकअप एवं रिकवरी',
    backupSubtitle: 'डेटाबेस का JSON बैकअप डाउनलोड करें या डेटा रीस्टोर करें',
    downloadBackupJson: 'बैकअप डाउनलोड करें (.JSON)',
    downloadBackupDesc: 'उत्पादों, बिक्री बिलों, श्रेणियों और सेटिंग्स का तत्काल पूर्ण बैकअप तैयार करता है।',
    restoreBackupJson: 'बैकअप फ़ाइल से रीस्टोर करें',
    restoreBackupDesc: 'डेटाबेस रिकॉर्ड्स को सुरक्षित रूप से पुनर्प्राप्त करने के लिए बैकअप फ़ाइल चुनें।',
    firestoreSyncHeading: 'फायरबेस क्लाउड डेटाबेस स्थिति',
    firestoreSyncDesc: 'आपकी इन्वेंटरी और बिक्री का डेटा Google Cloud Firestore डेटाबेस के साथ लाइव सिंक रहता है।',
    syncStatusActive: 'सक्रिय एवं सुरक्षित',

    // Settings
    settingsTitle: 'स्टोर सेटिंग्स एवं कॉन्फ़िगरेशन',
    settingsSubtitle: 'सुपरमार्केट का नाम, पता, जीएसटी, बिल रसीद और यूपीआई क्यूआर सेटिंग्स',
    mallNameLabel: 'स्टोर / सुपरमार्केट का नाम',
    storeTaglineLabel: 'स्टोर की टैगलाइन / स्लोगन',
    storePhoneLabel: 'संपर्क मोबाइल नंबर',
    storeEmailLabel: 'स्टोर का ईमेल पता',
    storeAddressLabel: 'दुकान का पता',
    cityStateZipLabel: 'शहर, राज्य एवं पिनकोड',
    gstinLabel: 'जीएसटी संख्या (वैकल्पिक)',
    currencySymbolLabel: 'मुद्रा प्रतीक',
    receiptFooterLabel: 'रसीद के नीचे का संदेश',
    upiIdLabel: 'दुकान की यूपीआई आईडी',
    upiPayeeNameLabel: 'यूपीआई खाताधारक का नाम',
    thermalPrinterNotice: 'रसीदें 80mm मानक थर्मल रोल पेपर (लगभग 3.15 इंच) के लिए स्वरूपित हैं।',
    saveSettingsBtn: 'सेटिंग्स सहेजें',
    settingsSavedSuccess: 'सेटिंग्स सफलतापूर्वक अपडेट कर दी गईं!',

    // Auth & Login
    authAdminTitle: 'स्टोर एडमिनिस्ट्रेटर लॉगिन',
    authAdminSubtitle: 'सुपरमार्केट पीओएस एवं रिटेल मैनेजमेंट',
    authRequiredNotice: 'फायरबेस प्रमाणीकरण आवश्यक',
    authRequiredDesc: 'केवल अधिकृत स्टोर एडमिन ही सिस्टम में लॉगिन कर सकते हैं। अपने फायरबेस क्रेडेंशियल से साइन इन करें।',
    signInWithGoogle: 'Google से एडमिन लॉगिन करें',
    orEmailPassword: 'या ईमेल / पासवर्ड',
    adminEmailLabel: 'एडमिन ईमेल',
    adminPasswordLabel: 'एडमिन पासवर्ड',
    confirmPasswordLabel: 'पासवर्ड कन्फर्म करें',
    forgotPasswordQuestion: 'पासवर्ड भूल गए?',
    signInBtn: 'एडमिन लॉगिन करें',
    createAdminBtn: 'नया एडमिन रजिस्टर करें',
    processingAuth: 'कृपया प्रतीक्षा करें...',
    registerAccountLink: 'नया स्टोर एडमिन खाता बनाएं',
    alreadyHaveAccountLink: 'पहले से एडमिन खाता है? लॉगिन करें',
    resetPasswordTitle: 'रजिस्टर्ड एडमिन ईमेल दर्ज करें',
    sendResetLinkBtn: 'पासवर्ड रीसेट लिंक भेजें',
    backToLoginBtn: '← वापस एडमिन लॉगिन पर जाएं',
    resetLinkSentMsg: 'पासवर्ड रीसेट लिंक भेज दिया गया है! अपने ईमेल का इनबॉक्स या स्पैम फोल्डर चेक करें।',
    adminPrivilegesTitle: 'एडमिन अधिकार:',
    adminPrivilegesDesc: 'पूर्ण नियंत्रण: पीओएस बिलिंग टर्मिनल, 80mm थर्मल प्रिंटर, इन्वेंटरी/स्टॉक प्रबंधन, लाभ-हानि रिपोर्ट्स, क्लाउड बैकअप और स्टोर सेटिंग्स।',
    invalidCredentialsMsg: 'गलत ईमेल या पासवर्ड! कृपया सही विवरण दर्ज करें।',
    passwordsDoNotMatch: 'पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खा रहे हैं!',
    passwordTooShort: 'सुरक्षा के लिए पासवर्ड कम से कम 6 अक्षरों का होना आवश्यक है।',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sastaminibazaar_lang');
      if (saved === 'en' || saved === 'hi') return saved;
    } catch {
      // fallback
    }
    return 'hi'; // Default to Hindi as preferred by user
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sastaminibazaar_lang', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    if (dict[key]) return dict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  const getProductName = (product: { name: string; nameHi?: string }): string => {
    if (language === 'hi' && product.nameHi && product.nameHi.trim() !== '') {
      return product.nameHi;
    }
    return product.name;
  };

  const getCategoryName = (category: any): string => {
    if (!category) return '';
    if (typeof category === 'string') {
      const key = category.toLowerCase().trim();
      if (language === 'hi') {
        const hiMap: Record<string, string> = {
          groceries: 'किराना / राशन',
          beverages: 'पेय पदार्थ',
          dairy: 'डेयरी उत्पाद',
          snacks: 'नमकीन एवं स्नैक्स',
          'personal-care': 'पर्सनल केयर',
          household: 'घरेलू सामान',
          bakery: 'बेकरी',
          general: 'सामान्य',
          oil: 'तेल एवं घी',
          spices: 'मसाले',
          pulses: 'दालें',
          rice: 'चावल',
          flour: 'आटा एवं सूजी',
        };
        return hiMap[key] || category;
      } else {
        const enMap: Record<string, string> = {
          groceries: 'Groceries',
          beverages: 'Beverages',
          dairy: 'Dairy Products',
          snacks: 'Snacks & Namkeen',
          'personal-care': 'Personal Care',
          household: 'Household Goods',
          bakery: 'Bakery',
          general: 'General',
        };
        return enMap[key] || category;
      }
    }

    if (typeof category === 'object') {
      if (language === 'hi' && category.nameHi && category.nameHi.trim() !== '') {
        return category.nameHi;
      }
      return category.name || '';
    }

    return String(category);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getProductName,
        getCategoryName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
