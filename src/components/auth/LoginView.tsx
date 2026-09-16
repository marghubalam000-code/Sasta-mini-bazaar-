import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Tag, 
  ShoppingCart, 
  Leaf, 
  AlertCircle, 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../../types';
import { storageService, MASTER_ADMIN_EMAIL } from '../../services/storageService';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../common/LanguageToggle';
import { RotatingLogo } from '../common/RotatingLogo';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut
} from '../../lib/firebase';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  unauthorizedEmailFromAuth?: string | null;
}

// Official Google G SVG Icon
const GoogleGIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// Sasta Mini Bazaar Vector Brand Logo (Matching reference design)
const SastaBrandLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative shrink-0">
        <svg
          className="w-14 h-14"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fresh green leaves emerging from shopping cart */}
          <path
            d="M25 15C25 15 29 7 37 9C37 9 39 17 31 18C27.5 18.4 25 15 25 15Z"
            fill="#16A34A"
          />
          <path
            d="M33 15C33 15 39 6 47 10C47 10 47 18 39 18C36 18 33 15 33 15Z"
            fill="#22C55E"
          />
          <path
            d="M28 20C28 20 22 14 23 7C23 7 31 7 32 15C32 17 28 20 28 20Z"
            fill="#15803D"
          />
          {/* Golden Yellow Shopping Cart Basket */}
          <path
            d="M10 18H16L22 42H50L56 22H20"
            stroke="#F59E0B"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Basket Grid Lines */}
          <path
            d="M25 27H52M27 34H47M30 22V40M38 22V40M46 22V40"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Wheels */}
          <circle cx="26" cy="49" r="4" fill="#F59E0B" />
          <circle cx="46" cy="49" r="4" fill="#F59E0B" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-black tracking-tight text-[#14532D] leading-none">
          Sasta
        </span>
        <span className="text-xl font-bold tracking-tight text-[#F59E0B] leading-none mt-1">
          Mini Bazaar
        </span>
      </div>
    </div>
  );
};

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, unauthorizedEmailFromAuth }) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unauthorizedEmailFromAuth) {
      setError(
        language === 'hi'
          ? `प्रवेश अस्वीकृत: ईमेल "${unauthorizedEmailFromAuth}" अधिकृत नहीं है। केवल वही ईमेल लॉगिन कर सकते हैं जिन्हें अनुमति दी गई है। कृपया मुख्य व्यवस्थापक (${MASTER_ADMIN_EMAIL}) से संपर्क करें।`
          : `Access Denied: Email "${unauthorizedEmailFromAuth}" is not permitted. Only whitelisted accounts can log in. Please contact the master administrator (${MASTER_ADMIN_EMAIL}).`
      );
    }
  }, [unauthorizedEmailFromAuth, language]);

  const buildAdminUser = (uid: string, userEmail: string | null, displayName: string | null): UserType => {
    return {
      id: uid,
      username: userEmail ? userEmail.split('@')[0] : 'store_admin',
      name: displayName || (userEmail ? userEmail.split('@')[0] : (language === 'hi' ? 'स्टोर एडमिनिस्ट्रेटर' : 'Store Administrator')),
      role: 'admin',
      pin: '1234',
      avatarColor: 'bg-emerald-700',
      email: userEmail || undefined,
    };
  };

  // Google Sign-In with Whitelist Security Check
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userEmail = fbUser.email?.trim().toLowerCase() || '';

      // Check against authorized whitelist
      const isAuthorized = await storageService.isEmailAuthorized(userEmail);

      if (!isAuthorized) {
        // Sign out immediately to prevent session hijacking
        await fbSignOut(auth);
        storageService.setCurrentUser(null);
        setIsLoading(false);
        setError(
          language === 'hi'
            ? `प्रवेश अस्वीकृत: ईमेल "${userEmail}" अधिकृत नहीं है। केवल वही ईमेल लॉगिन कर सकते हैं जिन्हें मुख्य व्यवस्थापक द्वारा अनुमति दी गई है। कृपया मुख्य व्यवस्थापक (${MASTER_ADMIN_EMAIL}) से अनुमति मांगें।`
            : `Access Denied: Email "${userEmail}" is not authorized. Only whitelisted email accounts are permitted. Contact the master admin (${MASTER_ADMIN_EMAIL}) for access.`
        );
        return;
      }

      // Authorized user - build profile and proceed (no extra Firestore read/write needed)
      const adminUser = buildAdminUser(
        fbUser.uid,
        fbUser.email,
        fbUser.displayName
      );

      storageService.setCurrentUser(adminUser);
      setIsLoading(false);
      onLoginSuccess(adminUser);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Firebase Google Admin Login Error:', err);

      const errCode = err?.code || '';
      if (errCode.includes('auth/popup-closed-by-user')) {
        setError(language === 'hi' ? 'Google लॉगिन विंडो बंद कर दी गई थी।' : 'Google sign-in popup was closed before completing.');
      } else if (errCode.includes('auth/network-request-failed')) {
        setError(language === 'hi' ? 'इंटरनेट कनेक्शन जांचें।' : 'Network connection error. Please check your internet connection.');
      } else {
        setError(language === 'hi' ? 'लॉगिन विफल रहा। कृपया पुनः प्रयास करें।' : 'Authentication failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F7F3] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 lg:p-10 font-sans antialiased selection:bg-amber-100 selection:text-amber-900 relative">
      
      {/* Subtle Top Bar with Language Selector */}
      <div className="w-full max-w-[1200px] flex justify-end items-center mb-3 sm:mb-4 px-2">
        <LanguageToggle />
      </div>

      {/* Main Login Card Container */}
      <motion.div 
        id="login-main-container"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1180px] bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_8px_25px_-10px_rgba(0,0,0,0.04)] border border-stone-200/60 overflow-hidden flex flex-col md:flex-row min-h-[640px] md:h-[680px] relative"
      >
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Clean Brand & Single Google Auth Button      */}
        {/* ======================================================== */}
        <div className="w-full md:w-[48%] bg-white p-7 sm:p-10 md:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0 z-10">
          
          {/* Subtle warm golden organic glow in top-left corner */}
          <div 
            className="absolute -top-12 -left-12 w-48 h-48 bg-amber-100/70 rounded-br-[120px] pointer-events-none blur-xl" 
            aria-hidden="true" 
          />

          {/* Decorative organic green leaves in bottom-right corner of left panel */}
          <div 
            className="absolute -bottom-4 -right-4 pointer-events-none w-32 h-32 select-none z-0 opacity-90"
            aria-hidden="true"
          >
            <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
              <path
                d="M120 120C100 70 50 60 25 80C12 90 6 104 0 120H120Z"
                fill="#86EFAC"
                fillOpacity="0.45"
              />
              <path
                d="M120 120C90 50 40 45 15 70C5 80 0 98 0 120H120Z"
                fill="#22C55E"
                fillOpacity="0.55"
              />
              <path
                d="M120 120C105 80 75 70 50 88C38 96 30 108 20 120H120Z"
                fill="#15803D"
                fillOpacity="0.7"
              />
            </svg>
          </div>

          {/* TOP: Brand Logo Area */}
          <div className="relative z-10 pt-1">
            <SastaBrandLogo />
          </div>

          {/* MIDDLE: Welcome Heading & Single Google Auth Button */}
          <div className="my-auto py-8 sm:py-10 relative z-10">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-800 tracking-tight leading-tight">
                {language === 'hi' ? 'स्वागत है' : 'Welcome to'}
                <span className="block font-black text-[#14532D] tracking-tight mt-1 text-3xl sm:text-4xl lg:text-[38px]">
                  {language === 'hi' ? 'सस्ता मिनी बाज़ार' : 'Sasta Mini Bazaar'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-2.5 max-w-sm leading-relaxed font-normal">
                {language === 'hi' 
                  ? 'अपने मिनी बाज़ार डैशबोर्ड में जारी रखने के लिए साइन इन करें।' 
                  : 'Sign in to continue to your mini bazaar dashboard.'}
              </p>
            </div>

            {/* ERROR ALERT DISPLAY (Clean & friendly, no tech stack traces) */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">{error}</div>
                  <button
                    onClick={() => setError(null)}
                    className="text-rose-400 hover:text-rose-700 p-0.5 rounded-lg transition"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* THE ONLY AUTHENTICATION BUTTON: Google OAuth */}
            <div className="w-full max-w-sm">
              <button
                id="btn-google-login"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-14 bg-white hover:bg-amber-50/40 text-slate-800 border border-slate-200/90 hover:border-amber-300 rounded-2xl shadow-[0_6px_20px_-4px_rgba(245,158,11,0.18),0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3.5 px-6 font-semibold text-base sm:text-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none"
              >
                {isLoading ? (
                  <>
                    <RotatingLogo size="xs" speedSec={1.5} />
                    <span className="text-slate-700 text-sm sm:text-base font-semibold">
                      {language === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Signing in with Google...'}
                    </span>
                  </>
                ) : (
                  <>
                    <GoogleGIcon />
                    <span>{language === 'hi' ? 'Google के साथ जारी रखें' : 'Continue with Google'}</span>
                  </>
                )}
              </button>

              {/* Under-button subtle security badge */}
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mt-3 select-none">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>
                  {language === 'hi' ? 'Google द्वारा संचालित सुरक्षित लॉगिन' : 'Secure login powered by Google'}
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM: Security Guarantee Notice */}
          <div className="relative z-10 pt-2 border-t border-slate-100/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#15803D] text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 font-medium leading-tight">
                {language === 'hi' 
                  ? 'आपका खाता सुरक्षित Google प्रमाणीकरण से सुरक्षित है।'
                  : 'Your account is protected with secure Google authentication.'}
              </p>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Premium Supermarket Visual & Info Cards     */}
        {/* ======================================================== */}
        <div className="w-full md:w-[52%] relative bg-emerald-950 overflow-hidden min-h-[360px] md:min-h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 select-none">
          
          {/* Background Visual Image */}
          <img
            src="/supermarket_banner.jpg"
            alt="Sasta Mini Bazaar Store"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-105"
            referrerPolicy="no-referrer"
          />

          {/* Elegant Dark & Warm Vignette Overlay for High Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/45 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20 pointer-events-none" />

          {/* TOP-RIGHT: Slogan "Fresh • Affordable • Everyday" */}
          <div className="relative z-10 flex justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white font-medium text-xs sm:text-sm tracking-wide shadow-lg">
              <span>{language === 'hi' ? 'ताज़ा' : 'Fresh'}</span>
              <span className="text-amber-400 font-bold">•</span>
              <span className="text-amber-300 font-bold underline decoration-amber-400 decoration-2 underline-offset-4">
                {language === 'hi' ? 'किफ़ायती' : 'Affordable'}
              </span>
              <span className="text-amber-400 font-bold">•</span>
              <span>{language === 'hi' ? 'रोज़ाना' : 'Everyday'}</span>
            </div>
          </div>

          {/* BOTTOM-RIGHT: Three Floating Information Cards */}
          <div className="relative z-10 flex flex-col items-end gap-3 pt-12 md:pt-0">
            
            {/* CARD 1: Best Prices */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.3)] border border-white/90 flex items-center gap-3 w-56 sm:w-64 hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                <Tag className="w-5 h-5 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'सर्वोत्तम मूल्य' : 'Best Prices'}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                  {language === 'hi' ? 'हर दिन ज़्यादा बचत' : 'Save More Every Day'}
                </span>
              </div>
            </motion.div>

            {/* CARD 2: Easy Shopping */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.3)] border border-white/90 flex items-center gap-3 w-56 sm:w-64 hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'आसान खरीदारी' : 'Easy Shopping'}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                  {language === 'hi' ? 'त्वरित एवं सुविधाजनक' : 'Quick & Convenient'}
                </span>
              </div>
            </motion.div>

            {/* CARD 3: Fresh Products */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.3)] border border-white/90 flex items-center gap-3 w-56 sm:w-64 hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-[#14532D] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'ताज़ा उत्पाद' : 'Fresh Products'}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5">
                  {language === 'hi' ? 'भरोसेमंद गुणवत्ता' : 'Quality You Can Trust'}
                </span>
              </div>
            </motion.div>

          </div>

        </div>

      </motion.div>

    </div>
  );
};
