import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface UpiQrScannerProps {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber?: string;
  currencySymbol?: string;
  customQrImage?: string;
  upiQrMode?: 'dynamic' | 'custom';
  size?: number;
  styleVariant?: 'receipt-modern' | 'receipt-supermarket' | 'receipt-thermal' | 'checkout' | 'admin-preview';
  className?: string;
}

export const UpiQrScanner: React.FC<UpiQrScannerProps> = ({
  upiId,
  payeeName,
  amount,
  invoiceNumber = 'POS',
  currencySymbol = '₹',
  customQrImage,
  upiQrMode = 'dynamic',
  size = 130,
  styleVariant = 'receipt-modern',
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Formulate standard NPCI UPI URI with exact bill amount
  const effectiveUpiId = upiId?.trim() || 'store@upi';
  const effectivePayee = payeeName?.trim() || 'Retail Store';
  const formattedAmount = Number(amount || 0).toFixed(2);
  const transactionNote = `Bill ${invoiceNumber}`.replace(/[^a-zA-Z0-9 ]/g, '');

  const upiUri = `upi://pay?pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent(effectivePayee)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  useEffect(() => {
    // If admin explicitly selected custom uploaded image and it exists
    if (upiQrMode === 'custom' && customQrImage) {
      setQrDataUrl(customQrImage);
      return;
    }

    // Otherwise generate dynamic high-contrast QR code with exact amount
    QRCode.toDataURL(upiUri, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setQrDataUrl(url);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to render UPI QR Code', err);
        setError('QR Error');
      });
  }, [upiUri, size, upiQrMode, customQrImage]);

  // Variant: Thermal 80mm Print Friendly (Monochrome)
  if (styleVariant === 'receipt-thermal') {
    return (
      <div className={`text-center flex flex-col items-center justify-center p-2 border border-dashed border-black ${className}`}>
        <div className="font-bold text-[11px] uppercase tracking-wider mb-1">
          SCAN & PAY {currencySymbol}{formattedAmount}
        </div>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            style={{ width: `${size}px`, height: `${size}px` }}
            className="mx-auto block"
          />
        )}
        <div className="text-[10px] mt-1 font-mono">{effectivePayee}</div>
        <div className="text-[9px] font-mono text-black">UPI: {effectiveUpiId}</div>
        <div className="text-[8px] mt-0.5">GooglePay • PhonePe • Paytm • BHIM</div>
      </div>
    );
  }

  // Variant: Supermarket Vibrant (Green Theme)
  if (styleVariant === 'receipt-supermarket') {
    return (
      <div className={`p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-center flex flex-col items-center ${className}`}>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wide mb-1">
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          Instant UPI QR (Bill Amount: {currencySymbol}{formattedAmount})
        </div>

        <div className="p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs my-1">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              style={{ width: `${size}px`, height: `${size}px` }}
              className="mx-auto block rounded"
            />
          ) : (
            <div style={{ width: `${size}px`, height: `${size}px` }} className="bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Generating...
            </div>
          )}
        </div>

        <div className="text-xs font-bold text-slate-900 mt-1">
          Pay to: <span className="text-emerald-800">{effectivePayee}</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          UPI ID: {effectiveUpiId}
        </div>
        <div className="text-[9px] text-slate-400 mt-0.5 font-medium">
          Accepts GPay, PhonePe, Paytm, BHIM & all UPI apps
        </div>
      </div>
    );
  }

  // Variant: Checkout Modal
  if (styleVariant === 'checkout') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="p-3 bg-white border-2 border-indigo-200 rounded-2xl shadow-sm inline-block">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              style={{ width: `${size}px`, height: `${size}px` }}
              className="mx-auto block rounded-lg"
            />
          ) : (
            <div style={{ width: `${size}px`, height: `${size}px` }} className="bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Generating...
            </div>
          )}
        </div>

        <div className="mt-2.5">
          <div className="text-sm font-black text-slate-900">
            Scan & Pay <span className="text-indigo-600 font-mono">{currencySymbol}{formattedAmount}</span>
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">
            Merchant: {effectivePayee}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            UPI VPA: {effectiveUpiId}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">GPay</span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-100">PhonePe</span>
            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold border border-sky-100">Paytm</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">BHIM</span>
          </div>
        </div>
      </div>
    );
  }

  // Variant: Admin Preview (In Settings Page)
  if (styleVariant === 'admin-preview') {
    return (
      <div className={`p-4 bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/80 rounded-2xl border-2 border-indigo-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4 ${className}`}>
        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              style={{ width: `${size}px`, height: `${size}px` }}
              className="mx-auto block rounded-lg"
            />
          ) : (
            <div style={{ width: `${size}px`, height: `${size}px` }} className="bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Generating...
            </div>
          )}
        </div>

        <div className="text-left flex-1 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Live Receipt Bill QR Scanner Preview
          </div>
          <h4 className="text-sm font-black text-slate-900">
            Payee Name: <span className="text-indigo-600">{effectivePayee}</span>
          </h4>
          <p className="text-xs text-slate-600 font-mono">
            UPI VPA: <span className="font-bold text-slate-800">{effectiveUpiId}</span>
          </p>
          <div className="text-[11px] text-slate-500 bg-white/90 p-2 rounded-lg border border-slate-200 mt-1.5">
            <span className="font-semibold text-emerald-700">✓ Auto-Amount Feature:</span> When a cashier generates a bill (e.g. ₹{formattedAmount}), this scanner automatically encodes that exact bill amount so the customer never needs to enter the amount manually!
          </div>
        </div>
      </div>
    );
  }

  // Default: Colorful Modern Receipt
  return (
    <div className={`p-3 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-xl border border-indigo-100 text-center flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
        Instant UPI Scan & Pay
      </div>

      <div className="p-2 bg-white rounded-xl border border-indigo-200/70 shadow-xs my-1">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            style={{ width: `${size}px`, height: `${size}px` }}
            className="mx-auto block rounded"
          />
        ) : (
          <div style={{ width: `${size}px`, height: `${size}px` }} className="bg-slate-100 flex items-center justify-center text-xs text-slate-400">
            Generating...
          </div>
        )}
      </div>

      <div className="text-xs font-black text-indigo-950 mt-1">
        Bill Amount: <span className="text-indigo-600 font-mono">{currencySymbol}{formattedAmount}</span>
      </div>
      <div className="text-[11px] font-bold text-slate-700">
        {effectivePayee}
      </div>
      <div className="text-[10px] font-mono text-slate-500">
        UPI: {effectiveUpiId}
      </div>
      <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        Scan with Google Pay, PhonePe, Paytm, or any UPI App
      </div>
    </div>
  );
};
