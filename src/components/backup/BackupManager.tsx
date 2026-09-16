import React, { useState, useRef } from 'react';
import { 
  Database, Download, Upload, RefreshCw, CheckCircle2, 
  AlertTriangle, FileSpreadsheet, ShieldCheck, 
  HardDrive, Info, Trash2 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { MallSettings } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface BackupManagerProps {
  settings: MallSettings;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ settings }) => {
  const { language } = useLanguage();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const products = storageService.getProducts();
  const sales = storageService.getSales();

  // Export full JSON Backup
  const handleDownloadBackup = () => {
    storageService.downloadBackupFile();
    setStatusMessage({
      type: 'success',
      text: language === 'hi' 
        ? `डेटाबेस बैकअप सफलतापूर्वक डाउनलोड हुआ! इसमें ${products.length} उत्पाद और ${sales.length} लेन-देन शामिल हैं।`
        : `Database backup downloaded successfully! Contains ${products.length} products and ${sales.length} transactions.`,
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Trigger file selection for restore
  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = storageService.importBackupFile(content);
      if (res.success) {
        setStatusMessage({ 
          type: 'success', 
          text: language === 'hi' ? 'डेटाबेस बैकअप सफलतापूर्वक रीस्टोर हो गया!' : res.message 
        });
      } else {
        setStatusMessage({ 
          type: 'error', 
          text: language === 'hi' ? 'बैकअप फ़ाइल रीस्टोर करने में त्रुटि।' : res.message 
        });
      }
      setTimeout(() => setStatusMessage(null), 6000);
    };

    reader.onerror = () => {
      setStatusMessage({ 
        type: 'error', 
        text: language === 'hi' ? 'अपलोड की गई फ़ाइल पढ़ने में विफल।' : 'Failed to read uploaded backup file.' 
      });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Export Products to CSV
  const handleExportProductsCSV = () => {
    let csv = `"ID","Barcode","SKU","Name","Category","Cost Price","Selling Price","Stock","Min Alert","Unit","GST Rate","Rack Location"\n`;
    products.forEach(p => {
      csv += `"${p.id}","${p.barcode}","${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}",${p.costPrice},${p.sellingPrice},${p.stock},${p.minStockAlert},"${p.unit}",${p.taxRate},"${p.rackLocation || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SastaMiniBazaar_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Permanently purge all demo products and dummy sales
  const handlePurgeDemoData = () => {
    storageService.purgeAllDemoData();
    setStatusMessage({
      type: 'success',
      text: language === 'hi'
        ? 'सभी डेमो उत्पाद और नमूना लेन-देन पूरी तरह हटा दिए गए हैं।'
        : 'All demo products and dummy transactions have been permanently purged from Firestore and local storage.',
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Reset to clean production slate (0 items)
  const handleConfirmReset = () => {
    storageService.resetToDefaultSeed();
    setIsConfirmResetOpen(false);
    setStatusMessage({
      type: 'info',
      text: language === 'hi'
        ? 'स्टोर डेटाबेस सफलतापूर्वक खाली और स्वच्छ कर दिया गया है। नई इन्वेंटरी जोड़ने के लिए तैयार।'
        : 'Store database successfully reset to clean production state (0 demo items). Ready for fresh store inventory.',
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div id="backup-manager-view" className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'hi' ? 'डेटा सुरक्षा एवं बैकअप' : 'Data Protection & Security'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {language === 'hi' ? 'डेटाबेस बैकअप एवं क्लाउड आर्काइव' : 'Database Backup & Cloud Archive'}
            </h1>
            <p className="text-xs text-slate-500">
              {language === 'hi' 
                ? 'पूर्ण डेटाबेस बैकअप डाउनलोड करें, पिछला बैकअप रीस्टोर करें, या उत्पाद कैटलॉग निर्यात करें' 
                : 'Download complete database backups, restore previous archives, or export item catalogues'}
            </p>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            statusMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            {statusMessage.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Database Snapshot Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">
                {language === 'hi' ? 'कुल उत्पाद' : 'Total Products'}
              </span>
              <div className="text-2xl font-black font-mono text-slate-900">{products.length}</div>
              <span className="text-[11px] text-slate-500">
                {language === 'hi' ? 'डेटाबेस में दर्ज सामान' : 'Items tracked in database'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">
                {language === 'hi' ? 'बिक्री इनवॉइस' : 'Sales Invoices'}
              </span>
              <div className="text-2xl font-black font-mono text-slate-900">{sales.length}</div>
              <span className="text-[11px] text-slate-500">
                {language === 'hi' ? 'कुल कटे हुए बिल' : 'Logged billing receipts'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">
                {language === 'hi' ? 'स्टोरेज स्थिति' : 'Storage Health'}
              </span>
              <div className="text-xl font-black font-mono text-emerald-600">
                {language === 'hi' ? 'सक्रिय एवं सुरक्षित' : 'Active & Synced'}
              </div>
              <span className="text-[11px] text-slate-500">
                {language === 'hi' ? 'रीयल-टाइम फायरबेस सुरक्षित' : 'Real-time local state engine'}
              </span>
            </div>
          </div>
        </div>

        {/* 2 Primary Backup Actions: Export vs Import */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Box 1: Create Backup */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {language === 'hi' ? 'पूर्ण डेटाबेस बैकअप बनाएं' : 'Create Full Database Backup'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {language === 'hi' 
                  ? 'सभी इन्वेंटरी उत्पाद, ग्राहक लेन-देन, जीएसटी इनवॉइस और स्टोर सेटिंग्स की एक संपूर्ण JSON फ़ाइल डाउनलोड करें।'
                  : 'Downloads an all-inclusive JSON snapshot containing every inventory product, customer transaction, GST invoice, cashier credentials, and store configuration.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <button
                id="btn-download-full-backup-json"
                onClick={handleDownloadBackup}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                {language === 'hi' ? 'JSON बैकअप फ़ाइल डाउनलोड करें' : 'Download JSON Backup File'}
              </button>

              <button
                onClick={handleExportProductsCSV}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                title="Export Item List CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {language === 'hi' ? 'सामान सूची CSV' : 'Items CSV'}
              </button>
            </div>
          </div>

          {/* Box 2: Restore from Backup */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {language === 'hi' ? 'बैकअप फ़ाइल से रीस्टोर करें' : 'Restore Database from Backup'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {language === 'hi' 
                  ? 'अपनी पूर्व में सुरक्षित की गई .json बैकअप फ़ाइल चुनें। सिस्टम स्वचालित रूप से सभी उत्पाद रिकॉर्ड और लेन-देन रीस्टोर कर देगा।'
                  : 'Upload any previously saved .json backup file. The system will automatically validate the database schema and restore all item records, barcodes, and transaction logs.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                id="btn-restore-database-file"
                onClick={handleTriggerFileSelect}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                {language === 'hi' ? 'रीस्टोर करने के लिए JSON फ़ाइल चुनें' : 'Select Backup JSON to Restore'}
              </button>
            </div>
          </div>

        </div>

        {/* Database Clean Slate & Purge Tools */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                {language === 'hi' ? 'डेमो और नमूना डेटा हमेशा के लिए हटाएं' : 'Permanently Purge Demo & Sample Data'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' 
                  ? 'सभी शुरुआती डेमो सामान और टेस्ट बिलों को क्लाउड और डिवाइस से स्थायी रूप से हटा देता है।' 
                  : 'Permanently scans and deletes all seeded demo products and dummy test transactions from Firestore cloud and device storage.'}
              </p>
            </div>

            <button
              id="btn-purge-demo-data"
              onClick={handlePurgeDemoData}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {language === 'hi' ? 'डेमो डेटा हमेशा के लिए हटाएं' : 'Purge Demo Data Permanently'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                {language === 'hi' ? 'स्टोर को खाली व ताज़ा स्थिति में रीसेट करें' : 'Reset Store to Clean Production Slate'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' 
                  ? 'सभी सामान और पुराने बिलों को 0 कर देता है। आपकी स्टोर सेटिंग्स, जीएसटी, यूपीआई और एडमिन लॉगिन सुरक्षित रहेंगे।' 
                  : 'Clears all products and past sales orders to a clean 0-item state. Keeps your store configuration, GST, UPI, and staff logins intact.'}
              </p>
            </div>

            <button
              id="btn-trigger-reset-db"
              onClick={() => setIsConfirmResetOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shrink-0"
            >
              {language === 'hi' ? 'साफ़ स्थिति में रीसेट करें (0 सामान)' : 'Reset to Clean Slate (0 Items)'}
            </button>
          </div>
        </div>

      </div>

      {/* CONFIRM RESET MODAL */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 text-center text-slate-900">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-1">
              {language === 'hi' ? 'क्या आप रीसेट करना चाहते हैं?' : 'Reset to Clean Slate?'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {language === 'hi' 
                ? 'यह सभी डेमो सामान और बिक्री रिकॉर्ड हटा देगा। स्टोर सेटिंग्स, यूपीआई और एडमिन सुरक्षित रहेंगे।' 
                : 'This will remove all demo data and reset your product catalogue and sales records to zero. Store settings, UPI details, and staff credentials will be kept.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-reset-db-action"
                onClick={handleConfirmReset}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {language === 'hi' ? 'हाँ, रीसेट करें' : 'Yes, Reset Clean'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
