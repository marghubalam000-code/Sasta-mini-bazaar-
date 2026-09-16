import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Volume2, Flashlight, AlertCircle, Sparkles } from 'lucide-react';
import { posAudio } from '../../utils/audio';
import { Product } from '../../types';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  sampleProducts?: Product[];
  storeProducts?: Product[];
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  sampleProducts,
  storeProducts,
}) => {
  const inventoryProducts = storeProducts || sampleProducts || [];
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      return;
    }

    let isMounted = true;
    setCameraError(null);
    setScannedCode(null);

    const startCamera = async () => {
      try {
        const scannerId = 'barcode-scanner-viewport';
        const element = document.getElementById(scannerId);
        if (!element) return;

        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            if (!isMounted) return;
            posAudio.playScanBeep();
            setScannedCode(decodedText);
            onScan(decodedText);
            setTimeout(() => {
              if (isMounted) onClose();
            }, 600);
          },
          () => {
            // frame without code, ignore
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Camera scan initialization notice:', err);
          setCameraError(
            'Camera access unavailable or permission denied in this preview frame. Use the Quick-Scan Simulator below or plug in a USB Barcode Gun!'
          );
          setIsScanning(false);
        }
      }
    };

    const timer = setTimeout(startCamera, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          }).catch(() => {
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      } catch {
        scannerRef.current = null;
      }
    }
    setIsScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div id="camera-scanner-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Barcode & QR Scanner</h3>
              <p className="text-xs text-slate-400">Scan product barcode using camera or test codes</p>
            </div>
          </div>
          <button
            id="btn-close-camera-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[260px] max-h-[320px] overflow-hidden">
          <div id="barcode-scanner-viewport" className="w-full h-full" />

          {/* Target Reticle Overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-40 border-2 border-emerald-400/80 rounded-xl relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            </div>
          </div>

          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-bounce mb-2" />
              <p className="text-sm font-semibold text-emerald-300">Barcode Detected!</p>
              <p className="font-mono text-lg font-bold text-white tracking-widest">{scannedCode}</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <h4 className="font-medium text-slate-200 text-sm mb-1">Live Camera Note</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{cameraError}</p>
              <div className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                Tip: Click any product below to simulate instant Barcode Gun Scan!
              </div>
            </div>
          )}
        </div>

        {/* Quick Barcode Test Buttons for Store Items */}
        {inventoryProducts.length > 0 && (
          <div className="p-4 bg-slate-800/80 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Barcode Test (Your Store Inventory)
              </span>
              <span className="text-[11px] text-slate-400">Plays real scanner beep</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {inventoryProducts.slice(0, 8).map(prod => (
                <button
                  key={prod.id}
                  id={`btn-sim-scan-${prod.id}`}
                  onClick={() => {
                    posAudio.playScanBeep();
                    onScan(prod.barcode);
                    onClose();
                  }}
                  className="text-left p-2 rounded-lg bg-slate-700/60 hover:bg-emerald-600/30 border border-slate-600 hover:border-emerald-500 text-xs transition flex flex-col justify-between group"
                >
                  <div className="font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                    {prod.name}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="font-mono text-emerald-400">{prod.barcode.slice(-6)}</span>
                    <span className="font-semibold text-slate-300">₹{prod.sellingPrice}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Physical USB barcode guns work automatically in the POS input box</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
