import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { MallSettings, User } from './types';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { LoginView } from './components/auth/LoginView';
import { POSBillingTerminal } from './components/pos/POSBillingTerminal';
import { RealtimeDashboard } from './components/dashboard/RealtimeDashboard';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ProfitLossReports } from './components/reports/ProfitLossReports';
import { BackupManager } from './components/backup/BackupManager';
import { SettingsManager } from './components/settings/SettingsManager';
import { auth, fbSignOut, onAuthStateChanged } from './lib/firebase';
import { PageLoadingScreen } from './components/common/PageLoadingScreen';

import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<MallSettings>(storageService.getSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [unauthorizedEmailError, setUnauthorizedEmailError] = useState<string | null>(null);

  useEffect(() => {
    storageService.init();
    setSettings(storageService.getSettings());

    // Listen to Firebase Authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userEmail = fbUser.email?.trim().toLowerCase();
        
        // Strict whitelist authorization check
        const isAuthorized = await storageService.isEmailAuthorized(userEmail);
        if (!isAuthorized) {
          console.warn('Unauthorized Firebase Auth session detected, signing out immediately:', userEmail);
          try {
            await fbSignOut(auth);
          } catch (e) {
            console.error('Signout error:', e);
          }
          storageService.setCurrentUser(null);
          setCurrentUser(null);
          setUnauthorizedEmailError(userEmail || null);
          setIsAuthChecking(false);
          return;
        }

        // Clear previous unauthorized error if authorized
        setUnauthorizedEmailError(null);

        // User is authenticated and authorized with Firebase
        const adminName = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Store Administrator');

        const adminUser: User = {
          id: fbUser.uid,
          username: fbUser.email ? fbUser.email.split('@')[0] : 'admin',
          name: adminName,
          role: 'admin',
          pin: '1234',
          avatarColor: 'bg-emerald-700',
          email: fbUser.email || undefined
        };

        storageService.setCurrentUser(adminUser);
        setCurrentUser(adminUser);
      } else {
        // No active Firebase Auth session: check if valid local admin session exists
        const localUser = storageService.getCurrentUser();
        if (localUser && localUser.role === 'admin') {
          setCurrentUser(localUser);
        } else {
          storageService.setCurrentUser(null);
          setCurrentUser(null);
        }
      }
      setIsAuthChecking(false);
    });

    const handleDataChange = () => {
      setSettings(storageService.getSettings());
      const stored = storageService.getCurrentUser();
      if (stored) setCurrentUser(stored);
    };

    window.addEventListener('megamall:datachange', handleDataChange);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('megamall:datachange', handleDataChange);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setUnauthorizedEmailError(null);
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
    setUnauthorizedEmailError(null);
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  // Rotating Logo Loading Screen while verifying Firebase Authentication status
  if (isAuthChecking) {
    return <PageLoadingScreen />;
  }

  // If not authenticated via Firebase -> Mandatory Admin Login Screen
  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess} 
        unauthorizedEmailFromAuth={unauthorizedEmailError}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
      />

      {/* Main Work Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <RealtimeDashboard
            currentUser={currentUser}
            settings={settings}
            onNavigateToPOS={() => setActiveTab('pos')}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'pos' && (
          <POSBillingTerminal
            currentUser={currentUser}
            settings={settings}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            settings={settings}
          />
        )}

        {activeTab === 'reports' && (
          <ProfitLossReports
            settings={settings}
          />
        )}

        {activeTab === 'backup' && (
          <BackupManager
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            settings={settings}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
