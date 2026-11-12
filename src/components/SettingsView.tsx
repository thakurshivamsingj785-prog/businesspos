import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StoreSettings } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage, LANGUAGE_OPTIONS, AppLanguage } from '../context/LanguageContext.tsx';
import { Save, Store, CheckCircle2, Globe, Shield, Lock, KeyRound } from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (updates: Partial<StoreSettings>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const { user, lockScreen, securityConfig, updateSecurityConfig, switchRole } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dukandar PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(securityConfig.autoLockMinutes || 0);
  const [pinSavedMsg, setPinSavedMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      setSavedSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePinLock = async () => {
    setPinSavedMsg(null);
    try {
      await updateSecurityConfig({
        currentPin: currentPin || undefined,
        newPin: newPin || undefined,
        autoLockMinutes
      });
      setCurrentPin('');
      setNewPin('');
      setPinSavedMsg('Dukandar PIN & Auto-Lock updated!');
      setTimeout(() => setPinSavedMsg(null), 3000);
    } catch (err: any) {
      setPinSavedMsg(err.message || 'Could not update PIN');
    }
  };

  const testUpiUri = `upi://pay?pa=${encodeURIComponent(formData.upiId || 'shivamretail@okaxis')}&pn=${encodeURIComponent(formData.storeName || 'Retail Store')}&am=1.00&cu=INR&tn=UPI%20Test`;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings & Dukandar Security</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure Dukandar PIN lock, language, shop name, and UPI QR code</p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* DUKANDAR SECURITY LOCK CARD */}
      <div className="bg-white p-5 rounded-xl border-2 border-emerald-600/20 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Dukandar Security Lock (दुकानदार सुरक्षा पिन और लॉक)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchRole(user?.role === 'cashier' ? 'admin' : 'cashier')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              Mode: {user?.role === 'cashier' ? 'Staff / Cashier (Restricted)' : 'Dukandar (Owner)'}
            </button>
            <button
              type="button"
              onClick={lockScreen}
              className="px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Lock Screen Now</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block">Current PIN (Default 1234)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Current PIN"
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Set New 4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="New 4-6 digit PIN"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block">Auto-Lock Inactivity Timer</label>
            <select
              value={autoLockMinutes}
              onChange={e => setAutoLockMinutes(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
            >
              <option value={0}>Disabled (Manual Lock Only)</option>
              <option value={1}>Auto-Lock after 1 Minute</option>
              <option value={3}>Auto-Lock after 3 Minutes</option>
              <option value={5}>Auto-Lock after 5 Minutes</option>
              <option value={10}>Auto-Lock after 10 Minutes</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            {pinSavedMsg ? (
              <strong className="text-emerald-700">{pinSavedMsg}</strong>
            ) : (
              'Protects store settings, inventory deletion, and 3D lock screen.'
            )}
          </span>
          <button
            type="button"
            onClick={handleSavePinLock}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Update Dukandar PIN</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE SELECTION CARD */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>App Language / भाषा चुनें (Change Language)</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
            Instant Switch
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {LANGUAGE_OPTIONS.map(opt => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code as AppLanguage)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{opt.nativeLabel}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className={`text-[10px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* CORE SHOP NAME & UPI ID CONFIGURATION (PROMINENT TOP CARD) */}
        <div className="bg-white p-5 rounded-xl border-2 border-slate-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Shop Name & UPI Payment ID</span>
            </div>
            <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
              Live QR Generator
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Inputs: Shop Name & UPI ID */}
            <div className="sm:col-span-8 space-y-3">
              <div>
                <label className="font-bold text-slate-800 block">
                  Name of Your Shop / Store *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shivam Kirana & General Store"
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  This name prints on every customer invoice and shows on the top bar.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block">
                  Store UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. yourshop@okaxis or 9876543210@paytm"
                  value={formData.upiId}
                  onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-600 text-purple-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  When a bill is generated, the QR code uses this UPI ID for instant customer payments.
                </span>
              </div>
            </div>

            {/* Live QR Preview */}
            <div className="sm:col-span-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <span className="text-[11px] font-semibold text-slate-700 mb-1.5">Live Dynamic QR</span>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                <QRCodeSVG value={testUpiUri} size={95} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5 truncate max-w-[130px]" title={formData.upiId}>
                {formData.upiId || 'no-upi-id'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Store Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-slate-600" />
            <span>Store Address & Tax Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Helpline / Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">GSTIN Number (Optional)</label>
              <input
                type="text"
                placeholder="27AAACG0564M1Z2"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Default GST Rate (%)</label>
              <select
                value={formData.defaultGstRate}
                onChange={e => setFormData({ ...formData, defaultGstRate: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
              >
                <option value={0}>0% (Tax Exempted)</option>
                <option value={5}>5% (Standard Grocery / Daily Essentials)</option>
                <option value={12}>12% (Processed Goods / Snacks)</option>
                <option value={18}>18% (Consumer Goods / Detergent)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Store Address</label>
              <input
                type="text"
                placeholder="Shop number, Street, Market, City"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Receipt / Invoice Footer Terms</label>
              <input
                type="text"
                value={formData.footerNote}
                onChange={e => setFormData({ ...formData, footerNote: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Shop Name & UPI ID'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
