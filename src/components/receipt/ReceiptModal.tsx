import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Share2, Check, X, QrCode } from 'lucide-react';
import { MallSettings, SaleReceipt } from '../../types';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { UpiQrScanner } from '../common/UpiQrScanner';
import { useLanguage } from '../../context/LanguageContext';

interface ReceiptModalProps {
  receipt: SaleReceipt | null;
  settings: MallSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  settings,
  isOpen,
  onClose,
}) => {
  const { t, language, getProductName } = useLanguage();
  
  // Default to 80mm Thermal Bill (most common POS format requested: ~3.15 inch wide)
  const [selectedTheme, setSelectedTheme] = useState<'thermal-classic' | 'colorful-modern' | 'supermarket-vibrant'>(
    settings.receiptTheme === 'colorful-modern' || settings.receiptTheme === 'supermarket-vibrant'
      ? settings.receiptTheme
      : 'thermal-classic'
  );
  const [copied, setCopied] = useState(false);
  const [showUpiScanner, setShowUpiScanner] = useState<boolean>(settings.showUpiOnReceipt !== false);

  // Isolate print view so ONLY the receipt is printed and the main app root is suppressed
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('receipt-modal-open');
    } else {
      document.body.classList.remove('receipt-modal-open');
    }
    return () => {
      document.body.classList.remove('receipt-modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const payeeName = settings.upiPayeeName || settings.mallName;
  const upiPayLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(payeeName)}&am=${receipt.grandTotal}&cu=INR&tn=${encodeURIComponent('Bill ' + receipt.invoiceNumber)}`;

  const handleCopySummary = () => {
    const text = `*${settings.mallName}*\n${t('billNumber')}: ${receipt.invoiceNumber}\n${t('dateLabel')}: ${new Date(receipt.date).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}\n${t('cashierLabel')}: ${receipt.cashierName}\n${t('customerLabel')}: ${receipt.customerName || t('walkInCustomer')} (${receipt.customerPhone || 'N/A'})\n--------------------\n${receipt.items.map(i => `${getProductName(i)} x${i.quantity} = ${settings.currencySymbol}${i.total}`).join('\n')}\n--------------------\n${t('gstTaxLabel')}: ${settings.currencySymbol}${receipt.totalTax}\n${t('totalDiscountLabel')}: -${settings.currencySymbol}${receipt.totalDiscount}\n*${t('grandTotalLabel')}: ${settings.currencySymbol}${receipt.grandTotal}*\n${t('paymentModeLabel')}: ${receipt.paymentMethod}\n*UPI:* ${upiPayLink}\n${settings.receiptFooter || t('thankYouVisitAgain')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate savings compared to hypothetical retail MRP if any discount
  const savings = receipt.totalDiscount + receipt.items.reduce((acc, i) => acc + (i.discountAmount || 0), 0);

  const modalContent = (
    <div id="receipt-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div id="receipt-modal-card-container" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-[80mm] print:max-w-[80mm] print:m-0">

        {/* Top Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">{t('taxInvoice')}</h3>
              <p className="text-xs text-slate-400">{t('billNumber')}: #{receipt.invoiceNumber}</p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setSelectedTheme('thermal-classic')}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${selectedTheme === 'thermal-classic' ? 'bg-emerald-600 text-white shadow font-semibold' : 'text-slate-300 hover:text-white'}`}
              title={t('thermalBill80mmNotice')}
            >
              <Printer className="w-3.5 h-3.5" />
              80mm Thermal
            </button>
            <button
              onClick={() => setSelectedTheme('colorful-modern')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${selectedTheme === 'colorful-modern' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'hi' ? 'रंगीन आधुनिक' : 'Colorful Modern'}
            </button>
            <button
              onClick={() => setSelectedTheme('supermarket-vibrant')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${selectedTheme === 'supermarket-vibrant' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'hi' ? 'सुपरमार्केट प्रारूप' : 'Supermarket Vibrant'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Toggle for UPI Scanner on Receipt */}
            <button
              id="btn-toggle-receipt-upi-scanner"
              type="button"
              onClick={() => setShowUpiScanner(prev => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showUpiScanner
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle automatic Bill UPI QR scanner on this printed receipt"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              UPI QR: {showUpiScanner ? 'ON' : 'OFF'}
            </button>

            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              {t('printBillNow')}
            </button>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? t('copiedBill') : t('shareBill')}
            </button>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div id="receipt-preview-scroll-container" className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex flex-col items-center print:p-0 print:bg-white">

          {/* Thermal Paper Width Info Badge */}
          <div className="mb-3 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs flex items-center gap-1.5 font-medium print:hidden shadow-xs">
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span><strong>{t('thermalBill80mmNotice')}</strong></span>
          </div>

          {/* Printable Receipt Wrapper */}
          <div
            id="printable-receipt-card"
            className={`w-full max-w-[360px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-200 print:shadow-none print:border-none print:rounded-none print:w-[80mm] print:max-w-[80mm] print:min-w-[80mm] print:m-0 print:p-0`}
          >
            {/* THEME 1: COLORFUL MODERN */}
            {selectedTheme === 'colorful-modern' && (
              <div className="text-slate-800 font-sans">
                <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-sky-600 text-white p-6 relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white p-1 shrink-0 shadow-md">
                        <img 
                          src={settings.logoUrl || '/logo.png'} 
                          alt={settings.mallName} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full mb-1 inline-block">
                          {t('taxInvoice')}
                        </span>
                        <h1 className="text-xl font-black tracking-tight uppercase leading-none">{settings.mallName}</h1>
                        <p className="text-xs text-indigo-100 font-medium mt-1">{settings.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold bg-white text-indigo-900 px-2.5 py-1 rounded shadow-xs">
                        #{receipt.invoiceNumber}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-indigo-100 flex flex-wrap justify-between gap-y-1">
                    <span>{settings.address}, {settings.cityStateZip}</span>
                    {settings.gstin && <span className="font-semibold">GSTIN: {settings.gstin}</span>}
                  </div>
                </div>

                <div className="bg-indigo-50/70 px-6 py-3 border-b border-indigo-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('dateLabel')}</span>
                    <p className="font-medium text-slate-800">{new Date(receipt.date).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('cashierLabel')}</span>
                    <p className="font-semibold text-indigo-900">{receipt.cashierName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('customerLabel')}</span>
                    <p className="font-medium text-slate-800">{receipt.customerName || t('walkInCustomer')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('contactLabel')}</span>
                    <p className="font-mono text-slate-700">{receipt.customerPhone || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-6">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-indigo-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-2">{t('itemCol')}</th>
                        <th className="pb-2 text-center">{t('qtyCol')}</th>
                        <th className="pb-2 text-right">{t('rateCol')}</th>
                        <th className="pb-2 text-right">{t('amountCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receipt.items.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2.5 pr-2">
                            <div className="font-semibold text-slate-800">{getProductName(item)}</div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {item.barcode} | GST: {item.taxRate}%
                            </div>
                          </td>
                          <td className="py-2.5 text-center font-medium text-slate-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-700">
                            {settings.currencySymbol}{item.unitPrice}
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                            {settings.currencySymbol}{item.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>{t('subTotalLabel')}</span>
                      <span>{settings.currencySymbol}{receipt.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{t('gstTaxLabel')}</span>
                      <span>{settings.currencySymbol}{receipt.totalTax}</span>
                    </div>
                    {receipt.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>{t('totalDiscountLabel')}</span>
                        <span>-{settings.currencySymbol}{receipt.totalDiscount}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-base">
                      <span>{t('netPayable')}</span>
                      <span className="text-xl font-mono text-indigo-700">{settings.currencySymbol}{receipt.grandTotal}</span>
                    </div>
                  </div>

                  {showUpiScanner && (
                    <div className="mt-4">
                      <UpiQrScanner
                        upiId={settings.upiId}
                        payeeName={settings.upiPayeeName || settings.mallName}
                        amount={receipt.grandTotal}
                        invoiceNumber={receipt.invoiceNumber}
                        currencySymbol={settings.currencySymbol}
                        customQrImage={settings.upiQrCustomImage}
                        upiQrMode={settings.upiQrMode}
                        size={120}
                        styleVariant="receipt-modern"
                      />
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-100 text-center flex flex-col items-center">
                    <BarcodeDisplay value={receipt.invoiceNumber.replace(/[^0-9]/g, '') || '987654321012'} height={32} />
                    <p className="text-xs text-slate-500 mt-2">{settings.receiptFooter || t('thankYouVisitAgain')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* THEME 2: SUPERMARKET VIBRANT */}
            {selectedTheme === 'supermarket-vibrant' && (
              <div className="p-6 bg-amber-50/20 text-slate-900 font-sans">
                <div className="text-center pb-4 border-b-2 border-emerald-500">
                  <div className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 tracking-wider uppercase">
                    {t('taxInvoice')}
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-emerald-800 uppercase">{settings.mallName}</h1>
                  <p className="text-xs text-emerald-600 font-medium">{settings.tagline}</p>
                  <p className="text-xs text-slate-500 mt-1">{settings.address}, {settings.cityStateZip}</p>
                  {settings.gstin && <p className="text-xs font-semibold text-slate-600">GSTIN: {settings.gstin}</p>}
                </div>

                <div className="py-3 border-b border-dashed border-slate-300 text-xs flex justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('billNumber')}</span>
                    <span className="font-bold text-slate-800">#{receipt.invoiceNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('dateLabel')}</span>
                    <span className="text-slate-700">{new Date(receipt.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}</span>
                  </div>
                </div>

                <div className="py-3">
                  {receipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">{getProductName(it)}</span>
                        <span className="text-[10px] text-slate-400">{it.quantity} x {settings.currencySymbol}{it.unitPrice}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{settings.currencySymbol}{it.total}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>{t('subTotalLabel')}</span>
                    <span>{settings.currencySymbol}{receipt.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('gstTaxLabel')}</span>
                    <span>{settings.currencySymbol}{receipt.totalTax}</span>
                  </div>
                  {receipt.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{t('totalDiscountLabel')}</span>
                      <span>-{settings.currencySymbol}{receipt.totalDiscount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline font-bold text-emerald-950 text-base">
                    <span>{t('netPayable')}</span>
                    <span className="text-xl font-mono text-emerald-700">{settings.currencySymbol}{receipt.grandTotal}</span>
                  </div>
                </div>

                {showUpiScanner && (
                  <div className="mt-3">
                    <UpiQrScanner
                      upiId={settings.upiId}
                      payeeName={settings.upiPayeeName || settings.mallName}
                      amount={receipt.grandTotal}
                      invoiceNumber={receipt.invoiceNumber}
                      currencySymbol={settings.currencySymbol}
                      customQrImage={settings.upiQrCustomImage}
                      upiQrMode={settings.upiQrMode}
                      size={110}
                      styleVariant="receipt-supermarket"
                    />
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-200 text-center flex flex-col items-center">
                  <BarcodeDisplay value={receipt.invoiceNumber.replace(/[^0-9]/g, '') || '987654321012'} height={32} />
                  <p className="text-xs text-slate-700 font-medium mt-2">{settings.receiptFooter || t('thankYouVisitAgain')}</p>
                </div>
              </div>
            )}

            {/* THEME 3: THERMAL 80MM (CLASSIC POS RECEIPT - 3.15 INCH) */}
            {selectedTheme === 'thermal-classic' && (
              <div className="p-3 sm:p-4 font-mono text-xs text-black bg-white select-text print:p-1.5">
                {/* Store Header */}
                <div className="text-center pb-2 flex flex-col items-center">
                  {settings.logoUrl && (
                    <div className="w-12 h-12 mb-1 overflow-hidden flex items-center justify-center">
                      <img 
                        src={settings.logoUrl} 
                        alt={settings.mallName} 
                        className="w-full h-full object-contain filter grayscale contrast-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <h2 className="text-base font-black uppercase tracking-wider leading-tight text-center">{settings.mallName}</h2>
                  {settings.tagline && <p className="text-[10px] text-slate-700 font-medium">{settings.tagline}</p>}
                  <p className="text-[11px] mt-0.5">{settings.address}, {settings.cityStateZip}</p>
                  {settings.gstin && <p className="text-[11px] font-bold">GSTIN: {settings.gstin}</p>}
                  {settings.phone && <p className="text-[11px]">TEL: {settings.phone}</p>}
                  <div className="mt-1.5 py-0.5 px-3 border border-black font-bold text-[10px] uppercase tracking-widest inline-block">
                    *** {t('taxInvoice')} ***
                  </div>
                </div>

                {/* Metadata */}
                <div className="my-2 border-t border-b border-dashed border-black py-1.5 text-[11px] leading-tight space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">{t('billNumber').toUpperCase()}: #{receipt.invoiceNumber}</span>
                    <span>{new Date(receipt.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('cashierLabel').toUpperCase()}: {receipt.cashierName}</span>
                    <span>{new Date(receipt.date).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('customerLabel').toUpperCase()}: {receipt.customerName || t('walkInCustomer')}</span>
                    <span>{receipt.customerPhone || 'N/A'}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="my-2">
                  <div className="flex justify-between font-bold border-b border-black pb-1 text-[11px]">
                    <span className="w-1/2 text-left">{t('itemCol').toUpperCase()}</span>
                    <span className="w-1/6 text-center">{t('qtyCol').toUpperCase()}</span>
                    <span className="w-1/6 text-right">{t('rateCol').toUpperCase()}</span>
                    <span className="w-1/6 text-right">{t('amountCol').toUpperCase()}</span>
                  </div>
                  <div className="py-1 space-y-1">
                    {receipt.items.map((it, idx) => (
                      <div key={idx} className="border-b border-dotted border-slate-300 pb-1 text-[11px]">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-left break-words w-1/2 leading-tight">
                            {idx + 1}. {getProductName(it)}
                          </span>
                          <span className="w-1/6 text-center">{it.quantity} {it.unit || ''}</span>
                          <span className="w-1/6 text-right">{settings.currencySymbol}{it.unitPrice}</span>
                          <span className="w-1/6 text-right font-bold">{settings.currencySymbol}{it.total}</span>
                        </div>
                        {it.discountAmount && it.discountAmount > 0 ? (
                          <div className="text-[9px] text-slate-700 pl-3">
                            {t('discountAmount')}: -{settings.currencySymbol}{it.discountAmount}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals & Calculations */}
                <div className="border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>{t('totalItemsLabel').toUpperCase()}</span>
                    <span className="font-bold">{receipt.items.length} ({receipt.items.reduce((s, i) => s + i.quantity, 0)} {t('piecesLabel')})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('subTotalLabel').toUpperCase()}</span>
                    <span>{settings.currencySymbol}{receipt.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('gstTaxLabel').toUpperCase()}</span>
                    <span>{settings.currencySymbol}{receipt.totalTax.toFixed(2)}</span>
                  </div>
                  {receipt.totalDiscount > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>{t('totalDiscountLabel').toUpperCase()}</span>
                      <span>-{settings.currencySymbol}{receipt.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm border-t-2 border-b-2 border-black py-1.5 my-1">
                    <span>{t('netPayable').toUpperCase()}</span>
                    <span>{settings.currencySymbol}{receipt.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-0.5 font-bold">
                    <span>{t('paymentModeLabel').toUpperCase()}: {receipt.paymentMethod}</span>
                    <span>{settings.currencySymbol}{receipt.amountPaid.toFixed(2)}</span>
                  </div>
                  {receipt.paymentMethod === 'CASH' && (
                    <div className="flex justify-between">
                      <span>{t('changeReturnedLabel').toUpperCase()}</span>
                      <span>{settings.currencySymbol}{(receipt.changeGiven || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Customer Savings Highlight */}
                {savings > 0 && (
                  <div className="my-2 py-1 px-2 border border-dashed border-black text-center font-bold text-[11px]">
                    *** {t('youSavedOnBill').toUpperCase()}: {settings.currencySymbol}{savings.toFixed(2)} ***
                  </div>
                )}

                {/* Dynamic UPI Bill Scanner for 80mm POS slip */}
                {showUpiScanner && (
                  <div className="my-2.5 py-1.5 border-t border-b border-dashed border-black flex flex-col items-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">{t('scanUpiNotice').toUpperCase()}</p>
                    <UpiQrScanner
                      upiId={settings.upiId}
                      payeeName={settings.upiPayeeName || settings.mallName}
                      amount={receipt.grandTotal}
                      invoiceNumber={receipt.invoiceNumber}
                      currencySymbol={settings.currencySymbol}
                      customQrImage={settings.upiQrCustomImage}
                      upiQrMode={settings.upiQrMode}
                      size={115}
                      styleVariant="receipt-thermal"
                    />
                    <p className="text-[9px] text-slate-700 mt-1 font-mono">{settings.upiId}</p>
                  </div>
                )}

                {/* Barcode & Footer */}
                <div className="text-center pt-3 border-t border-dashed border-black flex flex-col items-center">
                  <BarcodeDisplay value={receipt.invoiceNumber.replace(/[^0-9]/g, '') || '123456789'} height={28} displayValue={false} />
                  <p className="mt-1 text-[10px] font-mono tracking-widest">{receipt.invoiceNumber}</p>
                  <p className="mt-2 text-[11px] font-bold text-center">{settings.receiptFooter || t('thankYouVisitAgain')}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">* {t('termsAndConditions')} *</p>
                  <p className="text-[9px] font-bold mt-1 tracking-widest">--- {t('format80mmLabel')} ---</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer (Hidden on print) */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 print:hidden">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span><strong>{t('format80mmLabel')}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition"
          >
            {t('closeModal')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div id="receipt-modal-portal">
      {modalContent}
    </div>,
    document.body
  );
};
