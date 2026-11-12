import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';

interface User {
  username: string;
  role: 'admin' | 'cashier';
}

export interface SecurityLogItem {
  id: string;
  action: string;
  actor: string;
  status: 'success' | 'warning' | 'blocked';
  timestamp: string;
}

export interface SecurityConfigState {
  autoLockMinutes: number;
  lockSettings: boolean;
  lockInventoryEdits: boolean;
  lockKhataSettlement: boolean;
  hideFinancials: boolean;
  maxDiscountPercent: number;
  pinHint?: string;
  hasCustomPin?: boolean;
  logs?: SecurityLogItem[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  securityConfig: SecurityConfigState;
  login: (credentials: { username?: string; email?: string; password?: string; pin?: string }) => Promise<void>;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => Promise<boolean>;
  switchRole: (role: 'admin' | 'cashier') => void;
  updateSecurityConfig: (payload: Partial<SecurityConfigState> & { currentPin?: string; newPin?: string; newPassword?: string }) => Promise<void>;
  clearSecurityLogs: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  requireDukandarPin: (actionLabel: string, onAuthorized: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : { username: 'admin', role: 'admin' };
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return sessionStorage.getItem('pos_locked') === 'true';
  });
  const [securityConfig, setSecurityConfig] = useState<SecurityConfigState>({
    autoLockMinutes: 0,
    lockSettings: true,
    lockInventoryEdits: true,
    lockKhataSettlement: false,
    hideFinancials: false,
    maxDiscountPercent: 15,
    pinHint: 'Default PIN is 1234',
    hasCustomPin: false,
    logs: []
  });

  // Quick Dukandar PIN verification modal state for protected actions
  const [pendingAction, setPendingAction] = useState<{ label: string; callback: () => void } | null>(null);
  const [gatePin, setGatePin] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pos_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pos_user');
    }
  }, [user]);

  const refreshSecurityConfig = useCallback(() => {
    api.getSecurityConfig()
      .then(cfg => setSecurityConfig(cfg))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshSecurityConfig();
  }, [refreshSecurityConfig]);

  const lockScreen = useCallback(() => {
    setIsLocked(true);
    sessionStorage.setItem('pos_locked', 'true');
  }, []);

  // Auto-lock inactivity timer when securityConfig.autoLockMinutes > 0
  useEffect(() => {
    if (isLocked || !securityConfig.autoLockMinutes || securityConfig.autoLockMinutes <= 0) {
      return;
    }

    const timeoutMs = securityConfig.autoLockMinutes * 60 * 1000;
    let timerId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        lockScreen();
      }, timeoutMs);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timerId);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [isLocked, securityConfig.autoLockMinutes, lockScreen]);

  const login = async (credentials: { username?: string; email?: string; password?: string; pin?: string }) => {
    const res = await api.login(credentials);
    if (res.success && res.user) {
      setUser(res.user);
      setIsLocked(false);
      sessionStorage.setItem('pos_locked', 'false');
      refreshSecurityConfig();
    }
  };

  const logout = () => {
    setUser(null);
    setIsLocked(true);
    localStorage.removeItem('pos_user');
    sessionStorage.setItem('pos_locked', 'true');
  };

  const unlockScreen = async (pin: string): Promise<boolean> => {
    try {
      const res = await api.login({ pin });
      if (res.success) {
        setIsLocked(false);
        sessionStorage.setItem('pos_locked', 'false');
        refreshSecurityConfig();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const switchRole = (role: 'admin' | 'cashier') => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const updateSecurityConfig = async (
    payload: Partial<SecurityConfigState> & { currentPin?: string; newPin?: string; newPassword?: string }
  ) => {
    const updated = await api.updateSecurityConfig(payload);
    setSecurityConfig(updated);
  };

  const clearSecurityLogs = async () => {
    const updated = await api.clearSecurityLogs();
    setSecurityConfig(updated);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const ok = await api.verifyPin(pin);
    refreshSecurityConfig();
    return ok;
  };

  const requireDukandarPin = (actionLabel: string, onAuthorized: () => void) => {
    setPendingAction({ label: actionLabel, callback: onAuthorized });
    setGatePin('');
    setGateError(null);
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAction) return;
    setGateLoading(true);
    setGateError(null);
    try {
      const valid = await api.verifyPin(gatePin);
      refreshSecurityConfig();
      if (valid) {
        const cb = pendingAction.callback;
        setPendingAction(null);
        setGatePin('');
        cb();
      } else {
        setGateError('Incorrect Dukandar PIN. Please try again.');
      }
    } catch {
      setGateError('Incorrect Dukandar PIN.');
    } finally {
      setGateLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLocked,
        securityConfig,
        login,
        logout,
        lockScreen,
        unlockScreen,
        switchRole,
        updateSecurityConfig,
        clearSecurityLogs,
        verifyPin,
        requireDukandarPin
      }}
    >
      {children}

      {/* Global Dukandar PIN Gate Modal for Protected Actions */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-amber-700">
                  Dukandar Security Verification
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Owner PIN Required
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-2.5">
              Enter your 4-digit Dukandar PIN to authorize: <strong className="text-slate-900">{pendingAction.label}</strong>
            </p>

            <form onSubmit={handleGateSubmit} className="mt-3 space-y-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                required
                placeholder="••••"
                value={gatePin}
                onChange={e => setGatePin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2.5 text-center font-mono text-xl font-bold tracking-[0.4em] bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />

              {securityConfig.pinHint && (
                <p className="text-[11px] text-slate-400 text-center">
                  Hint: {securityConfig.pinHint}
                </p>
              )}

              {gateError && (
                <p className="text-xs text-red-600 font-semibold text-center bg-red-50 py-1.5 px-2 rounded-lg border border-red-200">
                  {gateError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gateLoading || gatePin.length < 4}
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {gateLoading ? 'Verifying...' : 'Unlock & Proceed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
