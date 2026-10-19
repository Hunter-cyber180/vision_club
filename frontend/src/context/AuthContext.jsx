import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadAuth, clearAuth } from "../api/authStorage";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth());
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (current) => {
    if (!current) return;
    try {
      const data = await authApi.fetchMe(current.role);
      const profile = data.user || data.consultant || data.admin || null;
      setAuth((prev) => (prev ? { ...prev, profile } : prev));
    } catch {
      // اینترسپتور axios خودش در صورت لزوم توکن رو رفرش/پاک می‌کنه
    }
  }, []);

  useEffect(() => {
    const initial = loadAuth();
    setAuth(initial);
    if (initial) refreshProfile(initial).finally(() => setLoading(false));
    else setLoading(false);

    const onExpired = () => setAuth(null);
    window.addEventListener("va-auth-expired", onExpired);
    return () => window.removeEventListener("va-auth-expired", onExpired);
  }, [refreshProfile]);

  const login = useCallback(async (role, credentials) => {
    const nextAuth = await authApi.login(role, credentials);
    setAuth(nextAuth);
    return nextAuth;
  }, []);

  const registerUser = useCallback(async (payload) => {
    const nextAuth = await authApi.registerUser(payload);
    setAuth(nextAuth);
    return nextAuth;
  }, []);

  const registerConsultant = useCallback(async (payload) => {
    // مشاور تازه‌ثبت‌نام‌شده مستقیم لاگین نمی‌شه، منتظر تایید ادمینه
    return authApi.registerConsultant(payload);
  }, []);

  const logout = useCallback(async () => {
    if (auth) await authApi.logout(auth.role).catch(() => {});
    clearAuth();
    setAuth(null);
  }, [auth]);

  // "role" (auth?.role) یعنی «حساب از کدوم جدوله»: user / consultant / admin.
  // این با فیلد profile.role ("user" یا "student") که تعیین‌کننده‌ی نوع پنل دانش‌آموزیه فرق داره.
  // panelRole همون چیزیه که برای تصمیم‌گیری بین پنل «کاربر عادی» و «دانش‌آموز» باید استفاده بشه.
  const panelRole = auth?.role === "user" ? (auth?.profile?.role || "user") : auth?.role || null;

  const value = {
    auth,
    role: auth?.role || null,
    panelRole,
    profile: auth?.profile || null,
    isAuthenticated: !!auth,
    loading,
    login,
    registerUser,
    registerConsultant,
    logout,
    // برای صفحاتی مثل کیف پول که باید مطمئن بشن profile (مثلاً tuition_amount
    // که مشاور تازه تعیین کرده) به‌روزه، نه چیزی که موقع لاگین کش شده.
    refreshProfile: () => refreshProfile(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth باید داخل AuthProvider استفاده بشه");
  return ctx;
}
