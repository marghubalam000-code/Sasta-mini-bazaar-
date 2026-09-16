import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageToggleProps {
  variant?: 'pill' | 'compact' | 'button';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  variant = 'pill', 
  className = '' 
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        id="btn-language-toggle"
        onClick={toggleLanguage}
        title={language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
          language === 'hi'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
        } ${className}`}
      >
        <Languages className="w-3.5 h-3.5 shrink-0" />
        <span>{language === 'en' ? 'English' : 'हिंदी'}</span>
      </button>
    );
  }

  return (
    <div 
      id="container-language-toggle"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold shadow-xs ${className}`}
    >
      <button
        type="button"
        id="btn-lang-en"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
          language === 'en'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        }`}
      >
        <span>English</span>
      </button>

      <button
        type="button"
        id="btn-lang-hi"
        onClick={() => setLanguage('hi')}
        className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
          language === 'hi'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        }`}
      >
        <span>हिंदी</span>
      </button>
    </div>
  );
};
