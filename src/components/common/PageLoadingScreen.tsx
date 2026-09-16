import React from 'react';
import { RotatingLogo } from './RotatingLogo';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck } from 'lucide-react';

interface PageLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const PageLoadingScreen: React.FC<PageLoadingScreenProps> = ({
  message,
  subMessage
}) => {
  const { language } = useLanguage();

  const defaultMessage = message || (
    language === 'hi'
      ? 'सुरक्षा जांच एवं स्टोर डेटा लोड हो रहा है...'
      : 'Verifying credentials & loading store data...'
  );

  const defaultSubMessage = subMessage || (
    language === 'hi'
      ? 'सस्ता मिनी बाज़ार में आपका स्वागत है'
      : 'Welcome to Sasta Mini Bazaar'
  );

  return (
    <div className="min-h-screen w-full bg-[#F7F7F3] flex flex-col items-center justify-center p-6 text-slate-800 font-sans antialiased relative overflow-hidden select-none">
      
      {/* Ambient background glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-200/35 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Center Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        
        {/* Rotating Brand Logo */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-[0_10px_35px_-5px_rgba(245,158,11,0.25)] border border-amber-100 flex items-center justify-center p-3">
            <RotatingLogo size="xl" speedSec={2.0} showGlow={true} />
          </div>
        </div>

        {/* Brand Name */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-[#14532D] tracking-tight leading-tight">
            Sasta
            <span className="text-[#F59E0B] ml-1.5 font-bold">Mini Bazaar</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">
            {defaultSubMessage}
          </p>
        </div>

        {/* Loading Animated Line */}
        <div className="w-48 h-1.5 bg-slate-200/80 rounded-full overflow-hidden mb-4 relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-full w-24 animate-[shimmer_1.5s_infinite_linear]" 
               style={{
                 animation: 'ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite'
               }}
          />
        </div>

        {/* Status Message */}
        <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
          {defaultMessage}
        </p>

        {/* Security Footer Badge */}
        <div className="mt-8 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200 text-[11px] font-medium text-slate-500 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'hi' ? 'सुरक्षित प्रमाणीकरण' : 'Secure Cloud Verification'}</span>
        </div>

      </div>

    </div>
  );
};
