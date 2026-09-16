import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, Save, CheckCircle2, Building, Receipt, QrCode, Upload, Trash2, 
  Eye, Sparkles, ShieldCheck, UserPlus, Mail, AlertCircle, RefreshCw, Cloud, Zap 
} from 'lucide-react';
import { MallSettings, AuthorizedUser } from '../../types';
import { storageService, MASTER_ADMIN_EMAIL } from '../../services/storageService';
import { UpiQrScanner } from '../common/UpiQrScanner';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsManagerProps {
  settings: MallSettings;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<MallSettings>({
    ...settings,
    upiPayeeName: settings.upiPayeeName || settings.mallName,
    showUpiOnReceipt: settings.showUpiOnReceipt !== false,
    upiQrMode: settings.upiQrMode || 'dynamic',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [testBillAmount, setTestBillAmount] = useState<number>(450);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authorized Users Management
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [newAuthName, setNewAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(storageService.getCloudSyncStatus());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const currentUser = storageService.getCurrentUser();
  const isMasterAdmin = currentUser?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await storageService.syncCloudData();
      setSyncStatus(storageService.getCloudSyncStatus());
      setSyncFeedback(language === 'hi' ? 'क्लाउड सिंक सफलतापूर्वक पूरा हुआ!' : 'Cloud sync completed successfully!');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (e: any) {
      setSyncFeedback(e?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadAuthorizedUsers = async () => {
    try {
      const users = await storageService.getAuthorizedUsers();
      setAuthorizedUsers(users);
    } catch {
      setAuthorizedUsers(storageService.getLocalAuthorizedUsers());
    }
  };

  useEffect(() => {
    loadAuthorizedUsers();
  }, []);

  const handleAddAuthorizedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    const cleanEmail = newAuthEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError(language === 'hi' ? 'कृपया एक वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    if (authorizedUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      setAuthError(language === 'hi' ? 'यह ईमेल पहले से अधिकृत सूची में मौजूद है।' : 'This email is already in the authorized whitelist.');
      return;
    }

    setIsAddingUser(true);
    try {
      await storageService.addAuthorizedUser(
        cleanEmail, 
        currentUser?.email || MASTER_ADMIN_EMAIL,
        newAuthName.trim() || undefined
      );
      setNewAuthEmail('');
      setNewAuthName('');
      setAuthSuccess(language === 'hi' ? 'नया अधिकृत उपयोगकर्ता सफलतापूर्वक जोड़ा गया!' : 'Authorized user successfully added!');
      await loadAuthorizedUsers();
      setTimeout(() => setAuthSuccess(null), 3000);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveAuthorizedUser = async (email: string) => {
    if (email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      alert(language === 'hi' ? 'मुख्य व्यवस्थापक (Master Admin) को हटाया नहीं जा सकता।' : 'Master Admin cannot be removed.');
      return;
    }
    const confirmMsg = language === 'hi'
      ? `क्या आप वाकई ${email} का एक्सेस हटाना चाहते हैं?`
      : `Are you sure you want to revoke access for ${email}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await storageService.removeAuthorizedUser(email);
      await loadAuthorizedUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove user');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(language === 'hi' ? 'कृपया एक वैध छवि फ़ाइल (PNG, JPG, JPEG, WebP) अपलोड करें' : 'Please upload a valid image file (PNG, JPG, JPEG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({
        ...prev,
        upiQrCustomImage: base64,
        upiQrMode: 'custom',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomQr = () => {
    setFormData(prev => ({
      ...prev,
      upiQrCustomImage: undefined,
      upiQrMode: 'dynamic',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id="settings-manager-view" className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {language === 'hi' ? 'स्टोर कॉन्फ़िगरेशन' : 'Store Configuration'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'hi' ? 'स्टोर एवं रसीद प्रिंट सेटिंग्स' : 'Mall & Receipt Print Settings'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'hi' 
              ? 'स्टोर ब्रांडिंग, जीएसटी नंबर, रसीद फुटर और तत्काल यूपीआई क्यूआर विवरण अनुकूलित करें' 
              : 'Customize Mall branding, Tax GSTIN, stylish receipt footer, and instant UPI QR details'}
          </p>
        </div>

        {isSaved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {language === 'hi' 
              ? 'सेटिंग्स सफलतापूर्वक सुरक्षित कर ली गई हैं! नए बिलों में यह तुरंत दिखेगा।' 
              : 'Mall settings saved successfully! New bills will reflect these details immediately.'}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          
          {/* Mall Identity */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-indigo-600" />
              {language === 'hi' ? 'स्टोर विवरण एवं टैक्स जानकारी' : 'Store Identity & Tax Information'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'स्टोर / बाज़ार का नाम' : 'Mall / Store Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.mallName}
                  onChange={(e) => setFormData({ ...formData, mallName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'टैगलाइन / उपशीर्षक' : 'Tagline / Subtitle'}
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'जीएसटी नंबर (GSTIN)' : 'GSTIN Number'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'टैक्स लेबल (GST / VAT)' : 'Tax Label (GST / VAT)'}
                </label>
                <input
                  type="text"
                  value={formData.taxName}
                  onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'स्टोर का पता' : 'Store Address'}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'शहर, राज्य एवं पिन कोड' : 'City, State & Zip'}
                </label>
                <input
                  type="text"
                  value={formData.cityStateZip}
                  onChange={(e) => setFormData({ ...formData, cityStateZip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'संपर्क मोबाइल नंबर' : 'Contact Phone'}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'मुद्रा प्रतीक' : 'Currency Symbol'}
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment & UPI QR */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                {language === 'hi' ? 'डायनेमिक यूपीआई एवं ऑटोमैटिक बिल क्यूआर सेटिंग्स' : 'Dynamic UPI & Automatic Bill Scanner Settings'}
              </h3>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {language === 'hi' ? 'बिल राशि स्वतः एन्कोडेड' : 'Auto Bill Amount Encoded'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* UPI ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'स्टोर की यूपीआई आईडी (VPA)' : 'Store UPI ID (VPA)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-settings-upi-id"
                    type="text"
                    required
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. 9876543210@paytm"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'hi' 
                      ? 'ग्राहक के यूपीआई ऐप्स (GPay, PhonePe, Paytm आदि) इस पते पर भुगतान भेजेंगे।'
                      : 'Customer UPI apps (GPay, PhonePe, Paytm, etc.) will send payments to this address.'}
                  </p>
                </div>

                {/* Payee / Account Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? 'दुकानदार / खाताधारक का नाम' : 'Merchant / Account Holder Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-settings-payee-name"
                    type="text"
                    required
                    value={formData.upiPayeeName || ''}
                    onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })}
                    placeholder="e.g. Sasta Mini Bazaar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'hi' 
                      ? 'क्यूआर कोड स्कैन करने पर ग्राहक के फोन पर दिखने वाला नाम।' 
                      : "Name displayed on customer's phone when they scan the receipt QR code."}
                  </p>
                </div>
              </div>

              {/* QR Generation Mode & Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                {/* QR Generation Type */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {language === 'hi' ? 'रसीद पर क्यूआर स्कैनर प्रकार' : 'Scanner Type on Receipts'}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-emerald-500 transition">
                      <input
                        type="radio"
                        name="upiQrMode"
                        checked={formData.upiQrMode !== 'custom'}
                        onChange={() => setFormData({ ...formData, upiQrMode: 'dynamic' })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {language === 'hi' ? 'डायनेमिक क्यूआर स्कैनर (अनुशंसित)' : 'Dynamic QR Scanner (Recommended)'}
                        </span>
                        <span className="text-[10px] text-slate-500 block leading-tight">
                          {language === 'hi' 
                            ? 'बिल की सटीक राशि (₹) अपने आप क्यूआर में दर्ज होती है। ग्राहक को राशि नहीं लिखनी पड़ती!'
                            : 'Encodes the exact bill amount (₹) automatically into the QR. Customers scan and tap Pay without typing the amount!'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-emerald-500 transition">
                      <input
                        type="radio"
                        name="upiQrMode"
                        checked={formData.upiQrMode === 'custom'}
                        onChange={() => setFormData({ ...formData, upiQrMode: 'custom' })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {language === 'hi' ? 'अपलोड किया गया बैंक स्टेंडी क्यूआर' : 'Uploaded Custom QR / Standee Image'}
                        </span>
                        <span className="text-[10px] text-slate-500 block leading-tight">
                          {language === 'hi' 
                            ? 'प्रिंटेड रसीद पर आपके द्वारा अपलोड किए गए स्टेंडी का स्टिकर प्रिंट होगा।'
                            : 'Uses your uploaded bank standee QR sticker image on printed receipts.'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {language === 'hi' ? 'बैंक यूपीआई क्यूआर / स्टेंडी अपलोड करें (वैकल्पिक)' : 'Upload Custom UPI QR / Standee (Optional)'}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrImageUpload}
                    className="hidden"
                    id="file-upload-upi-qr"
                  />

                  {formData.upiQrCustomImage ? (
                    <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={formData.upiQrCustomImage}
                          alt="Custom QR Preview"
                          className="w-14 h-14 object-contain rounded border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-emerald-800">
                            {language === 'hi' ? 'कस्टम क्यूआर अपलोड हुआ' : 'Custom QR Uploaded'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {language === 'hi' ? 'बिल पर प्रिंट के लिए तैयार' : 'Ready to print on bills'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                        >
                          {language === 'hi' ? 'बदलें' : 'Change'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveCustomQr}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Remove custom QR"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center p-3 text-center bg-white hover:bg-emerald-50/40 transition group"
                    >
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 mb-1 transition" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
                        {language === 'hi' ? 'बैंक क्यूआर इमेज अपलोड करने के लिए क्लिक करें' : 'Click to Upload Bank QR Image'}
                      </span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, or WebP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Show on receipt toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <input
                    id="checkbox-show-upi-receipt"
                    type="checkbox"
                    checked={formData.showUpiOnReceipt !== false}
                    onChange={(e) => setFormData({ ...formData, showUpiOnReceipt: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="checkbox-show-upi-receipt" className="cursor-pointer">
                    <span className="text-xs font-bold text-emerald-950 block">
                      {language === 'hi' ? 'हर बिल रसीद पर लाइव यूपीआई क्यूआर स्कैनर प्रिंट करें' : 'Auto-Print Dynamic UPI QR Scanner on Every Bill Receipt'}
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      {language === 'hi' 
                        ? 'कैशियर जब भी बिल बनाएगा, रसीद पर उस बिल की निश्चित राशि का यूपीआई स्कैनर प्रिंट होगा।'
                        : "Whenever cashier bills any customer, the receipt prints a live UPI scanner with that exact bill's amount."}
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Interactive Scanner Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    {language === 'hi' ? 'लाइव स्कैनर पूर्वावलोकन (बिल राशि जांचें):' : 'Live Scanner Preview (Simulate Bill Amount):'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      {language === 'hi' ? 'नमूना बिल:' : 'Sample Bill:'}
                    </span>
                    <div className="flex items-center">
                      <span className="text-xs font-mono font-bold text-slate-500 mr-1">{formData.currencySymbol}</span>
                      <input
                        type="number"
                        min="1"
                        max="50000"
                        value={testBillAmount}
                        onChange={(e) => setTestBillAmount(Number(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <UpiQrScanner
                  upiId={formData.upiId}
                  payeeName={formData.upiPayeeName || formData.mallName}
                  amount={testBillAmount}
                  invoiceNumber="INV-TEST"
                  currencySymbol={formData.currencySymbol}
                  customQrImage={formData.upiQrCustomImage}
                  upiQrMode={formData.upiQrMode}
                  size={120}
                  styleVariant="admin-preview"
                />
              </div>

              {/* Default Receipt Theme */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'hi' ? 'डिफ़ॉल्ट रसीद थीम' : 'Default Receipt Theme'}
                </label>
                <select
                  value={formData.receiptTheme}
                  onChange={(e) => setFormData({ ...formData, receiptTheme: e.target.value as any })}
                  className="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none cursor-pointer"
                >
                  <option value="thermal-classic">
                    {language === 'hi' ? '80mm थर्मल बिल (सबसे लोकप्रिय)' : 'Classic 80mm POS Thermal Slip'}
                  </option>
                  <option value="colorful-modern">
                    {language === 'hi' ? 'रंग-बिरंगी आधुनिक रसीद' : 'Colorful Modern Mall Receipt'}
                  </option>
                  <option value="supermarket-vibrant">
                    {language === 'hi' ? 'सुपरमार्केट वाइब्रेंट ग्रीन' : 'Supermarket Vibrant Green'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Receipt Custom Footer */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-violet-600" />
              {language === 'hi' ? 'ग्राहक रसीद फुटर एवं नियम' : 'Customer Receipt Footer & Terms'}
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'रसीद अभिवादन संदेश / वापसी नीति' : 'Receipt Greeting / Return Policy'}
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              id="btn-save-mall-settings"
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              {language === 'hi' ? 'बदलाव सुरक्षित करें' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Authorized Staff Whitelist / Access Control (Master Admin: marghubalam000@gmail.com) */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                {language === 'hi' ? 'अधिकृत व्यवस्थापक एवं लॉगिन अनुमतियाँ (सुरक्षा सूची)' : 'Authorized Admin & Staff Login Whitelist'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi'
                  ? `केवल वही Google खाते लॉगिन कर सकते हैं जो इस अधिकृत सूची में शामिल हैं। मुख्य व्यवस्थापक: ${MASTER_ADMIN_EMAIL}`
                  : `Only Google accounts registered in this whitelist are permitted to log in. Master Admin: ${MASTER_ADMIN_EMAIL}`}
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'hi' ? 'सख्त सुरक्षा सक्रिय' : 'Strict Security Active'}
            </span>
          </div>

          {/* Add New Authorized User (Only Master Admin can add) */}
          {isMasterAdmin ? (
            <form onSubmit={handleAddAuthorizedUser} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5">
              <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                {language === 'hi' ? 'नया अधिकृत Google ईमेल जोड़ें' : 'Add New Authorized Google Email'}
              </h4>

              {authError && (
                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <input
                    type="email"
                    required
                    placeholder="e.g. staff.member@gmail.com"
                    value={newAuthEmail}
                    onChange={(e) => setNewAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Staff / Cashier Name (optional)"
                    value={newAuthName}
                    onChange={(e) => setNewAuthName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isAddingUser}
                    className="w-full h-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'अनुमति दें' : 'Authorize'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
              {language === 'hi'
                ? `केवल मुख्य व्यवस्थापक (${MASTER_ADMIN_EMAIL}) नए उपयोगकर्ताओं को अनुमति दे सकते हैं।`
                : `Only the Master Administrator (${MASTER_ADMIN_EMAIL}) can add or remove authorized accounts.`}
            </div>
          )}

          {/* List of Whitelisted Users */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            {authorizedUsers.map((u) => {
              const isMaster = u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
              return (
                <div key={u.email} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${isMaster ? 'bg-amber-500 shadow-sm' : 'bg-emerald-600'}`}>
                      {isMaster ? '👑' : <Mail className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {u.name || u.email.split('@')[0]}
                        </span>
                        {isMaster ? (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Master Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Authorized Staff
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                    </div>
                  </div>

                  <div>
                    {isMaster ? (
                      <span className="text-[11px] text-slate-400 font-medium italic">
                        {language === 'hi' ? 'स्थाई मुख्य खाता' : 'Permanent'}
                      </span>
                    ) : isMasterAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthorizedUser(u.email)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low-Usage Cloud Optimization & Quota Protection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800 text-base">
                  {language === 'hi' ? 'फ़ायरबेस कोटा और डेटा ऑप्टिमाइज़ेशन' : 'Firebase Quota & Optimization'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'कम से कम रीड्स और राइट्स के लिए रियल-टाइम लिसनर्स बंद हैं और डेटा लोकल-फ़र्स्ट सुरक्षित रहता है।'
                  : 'Real-time background streams are disabled to minimize Firebase reads/writes and keep quota costs minimal.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>
                {isSyncing
                  ? (language === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...')
                  : (language === 'hi' ? 'मैन्युअल सिंक करें' : 'Manual Sync Now')}
              </span>
            </button>
          </div>

          {syncFeedback && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'रीड्स / राइट्स मोड' : 'Read/Write Mode'}
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {language === 'hi' ? 'अल्ट्रा-लो यूसेज (बचत मोड)' : 'Ultra-Low Quota Mode'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {language === 'hi' ? 'रियल-टाइम लिसनर्स बंद' : 'Zero real-time listeners'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'आखरी सिंक समय' : 'Last Cloud Sync'}
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-1 font-mono">
                {syncStatus.lastSyncedAt || 'Active'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {language === 'hi' ? 'लोकल कैश प्राथमिकता' : 'Local-first cached storage'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'राइट्स बैचिंग' : 'Write Batching'}
              </span>
              <span className="text-xs font-bold text-indigo-700 block mt-1">
                {language === 'hi' ? 'एटॉमिक 1-क्लिक बैच' : 'Atomic Write Batch'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {language === 'hi' ? 'बिलिंग में अतिरिक्त राइट्स नहीं' : 'No multi-step writes per item'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
