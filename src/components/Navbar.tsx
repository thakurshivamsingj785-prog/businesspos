import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage, LANGUAGE_OPTIONS, AppLanguage } from '../context/LanguageContext.tsx';
import {
  Store,
  ShoppingCart,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Lock,
  Shield,
  KeyRound,
  Clock,
  Globe,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'pos' | 'inventory' | 'orders' | 'dues' | 'security' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'pos' | 'inventory' | 'orders' | 'dues' | 'security' | 'settings') => void;
  lowStockCount: number;
  duesCount?: number;
  storeName?: string;
  upiId?: string;
}

interface NavItem {
  id: 'dashboard' | 'pos' | 'inventory' | 'orders' | 'dues' | 'security' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lowStockCount,
  duesCount = 0,
  storeName,
  upiId
}) => {
  const { user, lockScreen, securityConfig, updateSecurityConfig, switchRole, requireDukandarPin } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinHint, setPinHint] = useState(securityConfig.pinHint || '');
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(securityConfig.autoLockMinutes || 0);
  const [lockSettings, setLockSettings] = useState<boolean>(securityConfig.lockSettings ?? true);
  const [lockInventoryEdits, setLockInventoryEdits] = useState<boolean>(securityConfig.lockInventoryEdits ?? true);
  const [lockKhataSettlement, setLockKhataSettlement] = useState<boolean>(securityConfig.lockKhataSettlement ?? false);
  const [secMessage, setSecMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [secSaving, setSecSaving] = useState(false);

  const openSecurityModal = () => {
    setPinHint(securityConfig.pinHint || '');
    setAutoLockMinutes(securityConfig.autoLockMinutes || 0);
    setLockSettings(securityConfig.lockSettings ?? true);
    setLockInventoryEdits(securityConfig.lockInventoryEdits ?? true);
    setLockKhataSettlement(securityConfig.lockKhataSettlement ?? false);
    setCurrentPin('');
    setNewPin('');
    setSecMessage(null);
    setShowSecurityModal(true);
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecSaving(true);
    setSecMessage(null);
    try {
      await updateSecurityConfig({
        autoLockMinutes,
        lockSettings,
        lockInventoryEdits,
        lockKhataSettlement,
        pinHint,
        currentPin: currentPin || undefined,
        newPin: newPin || undefined
      });
      setCurrentPin('');
      setNewPin('');
      setSecMessage({ type: 'ok', text: 'Dukandar Security Lock settings saved!' });
    } catch (err: any) {
      setSecMessage({ type: 'err', text: err.message || 'Failed to update PIN settings' });
    } finally {
      setSecSaving(false);
    }
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: t('nav_dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: t('nav_pos', 'POS Billing'), icon: ShoppingCart },
    { id: 'inventory', label: t('nav_inventory', 'Inventory'), icon: Package, badge: lowStockCount },
    { id: 'orders', label: t('nav_invoices', 'Invoices'), icon: Receipt },
    { id: 'dues', label: t('nav_dues', 'Customer Dues'), icon: Store, badge: duesCount },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: t('nav_settings', 'Settings'), icon: Settings }
  ];

  const isCashierMode = user?.role === 'cashier';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15">
            {/* Brand & Shop Name */}
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Store className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold tracking-tight text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded leading-none">
                    BusinessPOS
                  </span>
                  <span className="text-sm font-bold tracking-tight text-slate-900 truncate max-w-[140px] sm:max-w-[200px] leading-tight">
                    {storeName || 'Business Retail Store'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {upiId ? `BusinessPOS • UPI: ${upiId}` : 'Business Retail Suite'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isPOS = item.id === 'pos';
                const isSettingsProtected = item.id === 'settings' && securityConfig.lockSettings && isCashierMode;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? isPOS
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-900'
                        : isPOS
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {isSettingsProtected && <Lock className="w-3 h-3 text-amber-600" />}
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Right Action: Language Switcher, Dukandar Security Setup & Instant Lock */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as AppLanguage)}
                  aria-label="Select Language"
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  {LANGUAGE_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      {opt.nativeLabel} ({opt.label})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dukandar Security Setup Button */}
              <button
                type="button"
                onClick={() => {
                  if (isCashierMode) {
                    requireDukandarPin('Open Dukandar Security Settings', openSecurityModal);
                  } else {
                    openSecurityModal();
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isCashierMode
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                }`}
                title="Dukandar Security Lock & PIN Setup"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">
                  {isCashierMode ? 'Staff Mode (Locked)' : 'Dukandar Lock'}
                </span>
              </button>

              {/* 1-Click Terminal Lock */}
              <button
                type="button"
                onClick={lockScreen}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Lock Terminal Screen Immediately"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Lock</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around overflow-x-auto border-t border-slate-100 bg-white px-2 py-1.5 text-xs gap-1">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] whitespace-nowrap cursor-pointer ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Dukandar Security Lock Control Panel Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Dukandar Security Lock (दुकानदार सुरक्षा लॉक)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Set your secret PIN, auto-lock timer, and staff restrictions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions Row: Lock Now or Hand Over to Staff/Cashier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowSecurityModal(false);
                  lockScreen();
                }}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Lock Terminal Screen Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextRole = isCashierMode ? 'admin' : 'cashier';
                  switchRole(nextRole);
                  setSecMessage({
                    type: 'ok',
                    text: nextRole === 'cashier'
                      ? 'Switched to Staff/Cashier Mode. Protected actions now require Dukandar PIN!'
                      : 'Switched to Dukandar (Owner) Mode.'
                  });
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                  isCashierMode
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {isCashierMode ? 'Active: Staff Mode (Switch to Owner)' : 'Enable Staff / Cashier Lock Mode'}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4 text-xs">
              {/* Set / Change 4-Digit Dukandar PIN */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    Change Dukandar PIN Code
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {securityConfig.hasCustomPin ? 'Custom PIN Active' : 'Default PIN: 1234'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Current PIN (Default: 1234)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter current PIN"
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full mt-1 px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      New 4-6 Digit PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="New PIN (e.g. 9999)"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full mt-1 px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    PIN Reminder Hint (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop opening year"
                    value={pinHint}
                    onChange={e => setPinHint(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Inactivity Auto-Lock Timer */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Lock When Away from Counter
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { label: 'Off', val: 0 },
                    { label: '1 Min', val: 1 },
                    { label: '3 Min', val: 3 },
                    { label: '5 Min', val: 5 },
                    { label: '10 Min', val: 10 }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAutoLockMinutes(opt.val)}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border cursor-pointer ${
                        autoLockMinutes === opt.val
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Locks */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-900 block">
                  Require Dukandar PIN For Sensitive Actions:
                </span>

                <label className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-slate-700 font-medium">
                    Lock Shop Settings & UPI ID Changes
                  </span>
                  <input
                    type="checkbox"
                    checked={lockSettings}
                    onChange={e => setLockSettings(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-slate-700 font-medium">
                    Lock Inventory Product Delete & Price Edits
                  </span>
                  <input
                    type="checkbox"
                    checked={lockInventoryEdits}
                    onChange={e => setLockInventoryEdits(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-slate-700 font-medium">
                    Lock Customer Khata / Udhar Settlement
                  </span>
                  <input
                    type="checkbox"
                    checked={lockKhataSettlement}
                    onChange={e => setLockKhataSettlement(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                  />
                </label>
              </div>

              {secMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    secMessage.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{secMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={secSaving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                >
                  {secSaving ? 'Saving...' : 'Save Dukandar Lock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
