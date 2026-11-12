import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { formatDateTime } from '../utils/formatters.ts';
import {
  Shield,
  Lock,
  KeyRound,
  EyeOff,
  Eye,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Trash2,
  Sliders
} from 'lucide-react';

export const SecurityCenterView: React.FC = () => {
  const {
    user,
    lockScreen,
    securityConfig,
    updateSecurityConfig,
    clearSecurityLogs,
    switchRole,
    requireDukandarPin
  } = useAuth();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pinHint, setPinHint] = useState(securityConfig.pinHint || '');
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(securityConfig.autoLockMinutes || 0);
  const [lockSettings, setLockSettings] = useState<boolean>(securityConfig.lockSettings ?? true);
  const [lockInventoryEdits, setLockInventoryEdits] = useState<boolean>(securityConfig.lockInventoryEdits ?? true);
  const [lockKhataSettlement, setLockKhataSettlement] = useState<boolean>(securityConfig.lockKhataSettlement ?? false);
  const [hideFinancials, setHideFinancials] = useState<boolean>(securityConfig.hideFinancials ?? false);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(securityConfig.maxDiscountPercent ?? 15);

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isCashierMode = user?.role === 'cashier';

  const handleSaveSecurityPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await updateSecurityConfig({
        autoLockMinutes,
        lockSettings,
        lockInventoryEdits,
        lockKhataSettlement,
        hideFinancials,
        maxDiscountPercent,
        pinHint,
        currentPin: currentPin || undefined,
        newPin: newPin || undefined,
        newPassword: newPassword || undefined
      });
      setCurrentPin('');
      setNewPin('');
      setNewPassword('');
      setStatusMsg({
        type: 'ok',
        text: 'Dukandar security policy, PIN, and privacy settings updated!'
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.message || 'Could not update security configuration'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePrivacyShield = async () => {
    const nextVal = !securityConfig.hideFinancials;
    if (!nextVal) {
      // Revealing financials requires Dukandar PIN
      requireDukandarPin('Reveal Store Profit & Daily Sales', async () => {
        setHideFinancials(false);
        await updateSecurityConfig({ hideFinancials: false });
      });
    } else {
      setHideFinancials(true);
      await updateSecurityConfig({ hideFinancials: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Security Command Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <Shield className="w-4 h-4" />
            <span>Dukandar Security & Counter Protection Center</span>
            <span>·</span>
            <span>{securityConfig.hasCustomPin ? 'Custom PIN Active' : 'Default PIN: 1234'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Store Security, Staff Lock & Financial Privacy
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Protect your shop’s UPI QR ID, inventory stock, profit margins, and Khata settlements with a 4-digit Dukandar PIN when handing the counter over to staff or stepping away.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Toggle Profit/Sales Privacy Shield */}
          <button
            type="button"
            onClick={handleTogglePrivacyShield}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
              securityConfig.hideFinancials
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {securityConfig.hideFinancials ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Sales & Profit Hidden (Unlock)</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Hide Profit & Sales</span>
              </>
            )}
          </button>

          {/* Switch Owner vs Staff Mode */}
          <button
            type="button"
            onClick={() => {
              if (isCashierMode) {
                requireDukandarPin('Switch Back to Dukandar (Owner) Mode', () => switchRole('admin'));
              } else {
                switchRole('cashier');
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
              isCashierMode
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>{isCashierMode ? 'Active: Staff Mode (Unlock Owner)' : 'Activate Staff / Cashier Mode'}</span>
          </button>

          {/* 1-Click Terminal Lock */}
          <button
            type="button"
            onClick={lockScreen}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Terminal Now</span>
          </button>
        </div>
      </div>

      {/* 4 Security Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Current Access Role</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {isCashierMode ? 'Staff / Cashier (Restricted)' : 'Dukandar (Full Owner)'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isCashierMode ? 'Requires PIN for edits & settings' : 'Full store management unlocked'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Inactivity Auto-Lock</span>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
            {securityConfig.autoLockMinutes > 0 ? `${securityConfig.autoLockMinutes} Minutes` : 'Manual Only'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Locks to 3D PIN screen when idle
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Max Staff Discount Limit</span>
          <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-1">
            Up to {securityConfig.maxDiscountPercent ?? 15}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Higher discounts require Owner PIN
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Profit & Margin Privacy</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {securityConfig.hideFinancials ? 'Masked (Protected)' : 'Visible on Dashboard'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Hides daily revenue from counter view
          </p>
        </div>
      </div>

      {/* Main Two-Column Grid: Left = Security Policy & PIN Setup, Right = Live Security Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveSecurityPolicy}
          className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-5 text-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Sliders className="w-4 h-4 text-slate-700" />
              <span>01. Configure Dukandar PIN, Password & Action Locks</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {securityConfig.hasCustomPin ? 'Custom PIN' : 'Default: 1234'}
            </span>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl font-semibold flex items-center gap-2 ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* PIN & Password Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block">
                Current PIN (Default 1234)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block">
                New 4–6 Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="New PIN (e.g. 5678)"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block">
                New Admin Password
              </label>
              <input
                type="password"
                placeholder="Optional new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block">
                PIN Reminder Hint
              </label>
              <input
                type="text"
                placeholder="e.g. Default PIN is 1234"
                value={pinHint}
                onChange={e => setPinHint(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block">
                Max Discount Allowed Without PIN (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={maxDiscountPercent}
                onChange={e => setMaxDiscountPercent(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Inactivity Auto-Lock Selector */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Auto-Lock Terminal When Idle</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Disabled', val: 0 },
                { label: '1 Min', val: 1 },
                { label: '3 Min', val: 3 },
                { label: '5 Min', val: 5 },
                { label: '10 Min', val: 10 }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setAutoLockMinutes(opt.val)}
                  className={`py-2 px-2 rounded-lg font-semibold text-xs border transition-colors cursor-pointer ${
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

          {/* Granular Feature Protection Checkboxes */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <span className="font-bold text-slate-800 block">
              Protected Store Operations (Requires Owner PIN):
            </span>

            <label className="flex items-center justify-between py-1.5 border-b border-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">
                  Lock Shop Name & UPI QR ID Settings
                </span>
                <span className="text-[11px] text-slate-400">
                  Prevents unauthorized staff from altering the payment UPI ID
                </span>
              </div>
              <input
                type="checkbox"
                checked={lockSettings}
                onChange={e => setLockSettings(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-1.5 border-b border-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">
                  Lock Inventory Product Deletion & Price Changes
                </span>
                <span className="text-[11px] text-slate-400">
                  Requires Dukandar PIN before deleting any item or changing prices in Staff mode
                </span>
              </div>
              <input
                type="checkbox"
                checked={lockInventoryEdits}
                onChange={e => setLockInventoryEdits(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-1.5 border-b border-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">
                  Lock Customer Khata / Udhar Settlement
                </span>
                <span className="text-[11px] text-slate-400">
                  Requires Owner PIN to mark customer dues as paid
                </span>
              </div>
              <input
                type="checkbox"
                checked={lockKhataSettlement}
                onChange={e => setLockKhataSettlement(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between py-1.5 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">
                  Hide Daily Sales & Gross Profit on Dashboard (Counter Privacy)
                </span>
                <span className="text-[11px] text-slate-400">
                  Masks revenue & margin figures with •••• until unlocked with PIN
                </span>
              </div>
              <input
                type="checkbox"
                checked={hideFinancials}
                onChange={e => setHideFinancials(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Saving Security Policy...' : 'Save Security & PIN Settings'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Security Activity & Audit Log */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <History className="w-4 h-4 text-slate-700" />
              <span>02. Security Activity & Access Log</span>
            </div>
            <button
              type="button"
              onClick={() => {
                requireDukandarPin('Clear Security Audit History', () => {
                  clearSecurityLogs();
                });
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto text-xs">
            {securityConfig.logs && securityConfig.logs.length > 0 ? (
              securityConfig.logs.map(entry => (
                <div key={entry.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{entry.action}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{entry.actor}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{formatDateTime(entry.timestamp)}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-semibold shrink-0 ${
                      entry.status === 'blocked'
                        ? 'text-red-600'
                        : entry.status === 'warning'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {entry.status === 'blocked'
                      ? 'Blocked'
                      : entry.status === 'warning'
                      ? 'Updated'
                      : 'Verified'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                No security events recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
