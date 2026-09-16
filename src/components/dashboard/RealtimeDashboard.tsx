import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Printer, 
  Calendar,
  Sparkles,
  BarChart3,
  CreditCard,
  QrCode,
  Banknote,
  ChevronRight,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { MallSettings, Product, SaleReceipt, User } from '../../types';
import { storageService } from '../../services/storageService';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { useLanguage } from '../../context/LanguageContext';

interface RealtimeDashboardProps {
  currentUser: User;
  settings: MallSettings;
  onNavigateToPOS: () => void;
  onNavigateToInventory: () => void;
  onNavigateToReports: () => void;
}

export const RealtimeDashboard: React.FC<RealtimeDashboardProps> = ({
  currentUser,
  settings,
  onNavigateToPOS,
  onNavigateToInventory,
  onNavigateToReports,
}) => {
  const { t, language, getProductName } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleReceipt[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'month' | 'all'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    // Initial load
    setProducts(storageService.getProducts());
    setSales(storageService.getSales());

    // Subscribe to real-time storage events
    const unsubscribe = storageService.subscribe(() => {
      setProducts(storageService.getProducts());
      setSales(storageService.getSales());
    });

    return () => unsubscribe();
  }, []);

  // Filter sales based on active tab
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter(s => {
      const saleTime = new Date(s.date).getTime();
      if (timeRange === 'today') return saleTime >= startOfToday;
      if (timeRange === 'yesterday') return saleTime >= startOfYesterday && saleTime < startOfToday;
      if (timeRange === 'month') return saleTime >= startOfMonth;
      return true; // all-time (permanent)
    });
  }, [sales, timeRange]);

  // Aggregated Real-Time KPI Metrics
  const periodRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.grandTotal, 0), [filteredSales]);
  const lifetimeRevenue = useMemo(() => sales.reduce((acc, s) => acc + s.grandTotal, 0), [sales]);

  const periodProfit = useMemo(() => {
    return filteredSales.reduce((totalProfit, sale) => {
      const saleCost = sale.items.reduce((acc, it) => {
        const prod = products.find(p => p.id === it.productId);
        const costPrice = prod ? prod.costPrice : it.unitPrice * 0.75;
        return acc + (costPrice * it.quantity);
      }, 0);
      return totalProfit + (sale.grandTotal - saleCost);
    }, 0);
  }, [filteredSales, products]);

  const lifetimeProfit = useMemo(() => {
    return sales.reduce((totalProfit, sale) => {
      const saleCost = sale.items.reduce((acc, it) => {
        const prod = products.find(p => p.id === it.productId);
        const costPrice = prod ? prod.costPrice : it.unitPrice * 0.75;
        return acc + (costPrice * it.quantity);
      }, 0);
      return totalProfit + (sale.grandTotal - saleCost);
    }, 0);
  }, [sales, products]);

  const periodItemsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.items.reduce((sum, it) => sum + it.quantity, 0), 0);
  }, [filteredSales]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= (p.minStockAlert || 5));
  }, [products]);

  const avgOrderValue = filteredSales.length > 0 ? Math.round(periodRevenue / filteredSales.length) : 0;

  // Payment Breakdown
  const paymentStats = useMemo(() => {
    const counts = { CASH: 0, UPI: 0, CARD: 0 };
    filteredSales.forEach(s => {
      if (s.paymentMethod === 'CASH') counts.CASH += s.grandTotal;
      else if (s.paymentMethod === 'UPI') counts.UPI += s.grandTotal;
      else if (s.paymentMethod === 'CARD') counts.CARD += s.grandTotal;
      else counts.CASH += s.grandTotal;
    });
    return counts;
  }, [filteredSales]);

  // Hourly checkout velocity
  const hourlyData = useMemo(() => {
    const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const todaySales = sales.filter(s => {
      const d = new Date(s.date);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });

    return hours.map(h => {
      const count = todaySales.filter(s => new Date(s.date).getHours() === h).reduce((sum, s) => sum + s.grandTotal, 0);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h;
      return {
        hourLabel: `${displayHour} ${ampm}`,
        revenue: count,
      };
    });
  }, [sales]);

  const maxHourlyRevenue = Math.max(...hourlyData.map(d => d.revenue), 100);

  const handleRestock = (productId: string) => {
    storageService.adjustProductStock(productId, 20);
  };

  const handleDeleteReceipt = (receipt: SaleReceipt) => {
    const confirmMessage = language === 'hi'
      ? `${t('confirmDeleteInvoice')} #${receipt.invoiceNumber} (${settings.currencySymbol}${receipt.grandTotal})?\n\n${t('deleteIrreversibleNotice')}`
      : `${t('confirmDeleteInvoice')} #${receipt.invoiceNumber} (${settings.currencySymbol}${receipt.grandTotal})?\n\n${t('deleteIrreversibleNotice')}`;

    if (window.confirm(confirmMessage)) {
      storageService.deleteSale(receipt.id);
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return t('timeFilterToday');
      case 'yesterday': return t('timeFilterYesterday');
      case 'month': return t('timeFilterMonth');
      case 'all': return t('timeFilterAllTime');
    }
  };

  return (
    <div id="realtime-dashboard-view" className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Permanent Data Protection Notice Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border border-emerald-700/50">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  {t('dataProtectionTitle')}
                </h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-medium">
                  {t('autoDeleteOff')}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {t('dataProtectionDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-800/60 shrink-0">
            <div>
              <span className="text-emerald-400 font-semibold">{products.length}</span> {t('totalProductsCount')}
            </div>
            <div className="h-3 w-px bg-emerald-700/60" />
            <div>
              <span className="text-emerald-400 font-semibold">{sales.length}</span> {t('totalInvoicesCount')}
            </div>
          </div>
        </div>

        {/* Welcome & Live Status Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {t('realTimePosLive')}
              </span>
              <span className="text-xs text-slate-400">• {t('secureSyncActive')}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('dashTitle')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('welcomeBack')}, <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role === 'admin' ? t('roleAdmin') : t('roleCashier')})
            </p>
          </div>

          {/* Time Filter Tabs & Fast Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-lg transition ${timeRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {t('timeFilterAllTime')}
              </button>
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-lg transition ${timeRange === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {t('timeFilterToday')}
              </button>
              <button
                onClick={() => setTimeRange('yesterday')}
                className={`px-3 py-1.5 rounded-lg transition ${timeRange === 'yesterday' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {t('timeFilterYesterday')}
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-lg transition ${timeRange === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {t('timeFilterMonth')}
              </button>
            </div>

            <button
              id="dash-btn-open-pos"
              onClick={onNavigateToPOS}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center gap-1.5 transition active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              {t('startBillingNow')}
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="dash-btn-open-reports"
                onClick={onNavigateToReports}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
              >
                <BarChart3 className="w-4 h-4" />
                {t('quickNavReports')}
              </button>
            )}
          </div>
        </div>

        {/* 4 Main Real-Time Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{getTimeRangeLabel()} {t('totalRevenue')}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                {settings.currencySymbol}
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                {settings.currencySymbol}{periodRevenue.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-emerald-600 font-semibold">{filteredSales.length} {t('totalInvoices')}</span>
                <span className="text-slate-400">{t('timeFilterAllTime')}: {settings.currencySymbol}{lifetimeRevenue.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Profit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {currentUser.role === 'admin' ? `${getTimeRangeLabel()} ${t('grossProfit')}` : t('todaysSales')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-indigo-950 tracking-tight">
                {currentUser.role === 'admin'
                  ? `${settings.currencySymbol}${periodProfit.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}`
                  : `${settings.currencySymbol}${periodRevenue.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}`
                }
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-indigo-600 font-medium">
                  {t('estimatedNetMargin')}: {periodRevenue > 0 ? Math.round((periodProfit / periodRevenue) * 100) : 0}%
                </span>
                <span className="text-slate-400">{t('timeFilterAllTime')}: {settings.currencySymbol}{lifetimeProfit.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Items Sold */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('itemsCount')}</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                {periodItemsSold} <span className="text-sm font-medium text-slate-400">{t('unitsSold')}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>{settings.currencySymbol}{avgOrderValue} / {t('invoiceNo')}</span>
                <span>{products.length} {t('totalProductsCount')}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Low Stock Warnings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{t('stockAlertTitle')}</span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-red-600 tracking-tight">
                {lowStockProducts.length} <span className="text-sm font-medium text-slate-400">{t('itemsCount')}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-red-600 font-medium">
                <span>{t('lowStockWarning')}</span>
                <span className="text-slate-400">{t('minStockAlert')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hourly Sales Activity (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t('hourlySalesTraffic')}</h3>
                <p className="text-xs text-slate-400">{t('dashSubtitle')}</p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {hourlyData.reduce((prev, curr) => curr.revenue > prev.revenue ? curr : prev, hourlyData[0]).hourLabel}
              </span>
            </div>

            {/* Bar Chart */}
            <div className="flex-1 flex items-end gap-2 pt-6 pb-2 min-h-[180px]">
              {hourlyData.map((d, i) => {
                const heightPercent = maxHourlyRevenue > 0 ? Math.round((d.revenue / maxHourlyRevenue) * 100) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded shadow-xs">
                      {settings.currencySymbol}{d.revenue}
                    </div>
                    <div className="w-full bg-slate-100 rounded-t-lg h-[120px] flex items-end p-0.5">
                      <div
                        style={{ height: `${Math.max(6, heightPercent)}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          d.revenue > 0
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                            : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap transform -rotate-45 sm:rotate-0 origin-left">
                      {d.hourLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Share */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{t('paymentBreakdown')}</h3>
              <p className="text-xs text-slate-400 mb-4">{t('paymentMethod')}</p>

              <div className="space-y-3">
                {/* UPI */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      {t('payUpi')}
                    </span>
                    <span className="font-mono font-bold text-indigo-950">
                      {settings.currencySymbol}{paymentStats.UPI.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-indigo-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${periodRevenue > 0 ? (paymentStats.UPI / periodRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Cash */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      {t('payCash')}
                    </span>
                    <span className="font-mono font-bold text-emerald-950">
                      {settings.currencySymbol}{paymentStats.CASH.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${periodRevenue > 0 ? (paymentStats.CASH / periodRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Card */}
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      {t('payCard')}
                    </span>
                    <span className="font-mono font-bold text-purple-950">
                      {settings.currencySymbol}{paymentStats.CARD.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-purple-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${periodRevenue > 0 ? (paymentStats.CARD / periodRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>{t('gstinLabel')}:</span>
              <span className="font-mono font-semibold text-slate-700">{settings.gstin}</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts & Recent Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Low Stock Warning Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  {t('stockAlertTitle')}
                </h3>
                <p className="text-xs text-slate-400">{t('lowStockWarning')}</p>
              </div>
              <button
                onClick={onNavigateToInventory}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                {t('quickNavInventory')} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-72">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t('allStockHealthy')}
                </div>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{getProductName(p)}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.barcode} • {p.rackLocation || 'Shelf'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        p.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.stock} {t('stockLeft')}
                      </span>
                      {currentUser.role === 'admin' && (
                        <button
                          id={`btn-restock-${p.id}`}
                          onClick={() => handleRestock(p.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
                        >
                          {t('restock20Units')}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices Feed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  {t('recentInvoices')}
                </h3>
                <p className="text-xs text-slate-400">{t('recentInvoicesDesc')}</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {sales.length} {t('totalInvoices')}
              </span>
            </div>

            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-72">
              {sales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t('noSalesRecorded')}
                </div>
              ) : (
                sales.slice(0, 10).map(receipt => (
                  <div key={receipt.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-1 rounded-lg transition">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>#{receipt.invoiceNumber}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {receipt.paymentMethod === 'CASH' ? t('payCash') : receipt.paymentMethod === 'UPI' ? t('payUpi') : receipt.paymentMethod === 'CARD' ? t('payCard') : receipt.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {receipt.customerName || t('walkInCustomer')} • {new Date(receipt.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')} {new Date(receipt.date).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })} • {receipt.cashierName.split(' ')[0]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {settings.currencySymbol}{receipt.grandTotal}
                      </span>
                      <button
                        id={`btn-view-receipt-${receipt.id}`}
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setIsReceiptModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title={t('viewReceipt')}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-receipt-${receipt.id}`}
                        onClick={() => handleDeleteReceipt(receipt)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title={t('deleteInvoice')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Receipt Modal for Re-printing from Dashboard */}
      <ReceiptModal
        receipt={selectedReceipt}
        settings={settings}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
