import React, { useState, useEffect } from 'react';
import { 
  Store, ShoppingCart, LayoutDashboard, Package, 
  BarChart3, Database, Settings, LogOut, UserCheck, 
  Clock, Download, Sparkles 
} from 'lucide-react';
import { MallSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../common/LanguageToggle';

export type ActiveTab = 'dashboard' | 'pos' | 'inventory' | 'reports' | 'backup' | 'settings';

interface NavbarProps {
  currentUser: User;
  settings: MallSettings;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  const { t, language } = useLanguage();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickBackup = () => {
    storageService.downloadBackupFile();
  };

  const displayName = language === 'hi' && (!settings.mallName || settings.mallName.toLowerCase().includes('sasta'))
    ? 'सस्ता मिनी बाज़ार'
    : settings.mallName;

  const displayTagline = language === 'hi'
    ? 'सबसे सस्ता, सबसे अच्छा • सुपरमार्केट स्टोर'
    : (settings.tagline || 'Supermarket POS');

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 select-none print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-16">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-md shadow-emerald-950/40 border border-slate-700 overflow-hidden shrink-0">
            <img 
              src={settings.logoUrl || '/logo.png'} 
              alt={displayName} 
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm tracking-tight uppercase text-white">
                {displayName}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('firebaseLive')}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              {displayTagline}
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs font-medium">
          {/* Dashboard */}
          <button
            id="nav-tab-dashboard"
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t('navDashboard')}</span>
          </button>

          {/* POS Billing Terminal */}
          <button
            id="nav-tab-pos"
            onClick={() => onSelectTab('pos')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{t('navPos')}</span>
          </button>

          {/* Admin Restricted Tabs */}
          {currentUser.role === 'admin' && (
            <>
              {/* Inventory */}
              <button
                id="nav-tab-inventory"
                onClick={() => onSelectTab('inventory')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'inventory'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{t('navInventory')}</span>
              </button>

              {/* Profit & Loss Reports */}
              <button
                id="nav-tab-reports"
                onClick={() => onSelectTab('reports')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'reports'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t('navReports')}</span>
              </button>

              {/* Database Backup */}
              <button
                id="nav-tab-backup"
                onClick={() => onSelectTab('backup')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'backup'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{t('navBackup')}</span>
              </button>

              {/* Settings */}
              <button
                id="nav-tab-settings"
                onClick={() => onSelectTab('settings')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t('navSettings')}</span>
              </button>
            </>
          )}
        </nav>

        {/* Right: Language Switcher, Operator Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Toggle Control */}
          <LanguageToggle variant="pill" />

          {/* Quick Backup Icon for Admin */}
          {currentUser.role === 'admin' && (
            <button
              onClick={handleQuickBackup}
              title={t('downloadBackupJson')}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('navQuickBackup')}</span>
            </button>
          )}

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1 text-slate-400 font-mono text-xs px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr}</span>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-xs ${currentUser.avatarColor}`}>
              {currentUser.role === 'admin' ? (language === 'hi' ? 'ए' : 'A') : (language === 'hi' ? 'कै' : 'C')}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold leading-tight">{currentUser.name.split(' ')[0]}</div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {currentUser.role === 'admin' ? t('roleAdmin') : t('roleCashier')}
              </div>
            </div>

            <button
              id="btn-nav-logout"
              onClick={onLogout}
              title={t('navLogout')}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition ml-0.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-800 border-t border-slate-700 p-1 text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`p-2 flex flex-col items-center gap-0.5 ${activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{t('navDashboard')}</span>
        </button>
        <button
          onClick={() => onSelectTab('pos')}
          className={`p-2 flex flex-col items-center gap-0.5 ${activeTab === 'pos' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('navPos')}</span>
        </button>
        {currentUser.role === 'admin' && (
          <>
            <button
              onClick={() => onSelectTab('inventory')}
              className={`p-2 flex flex-col items-center gap-0.5 ${activeTab === 'inventory' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
            >
              <Package className="w-4 h-4" />
              <span>{t('navInventory')}</span>
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`p-2 flex flex-col items-center gap-0.5 ${activeTab === 'reports' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('navReports')}</span>
            </button>
            <button
              onClick={() => onSelectTab('backup')}
              className={`p-2 flex flex-col items-center gap-0.5 ${activeTab === 'backup' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
            >
              <Database className="w-4 h-4" />
              <span>{t('navBackup')}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

