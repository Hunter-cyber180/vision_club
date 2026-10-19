import axios from "axios";
import { loadAuth, saveAuth, clearAuth, authBasePathFor } from "./authStorage";

// آدرس بکند از فایل .env (کلید VITE_API_BASE_URL) خوانده می‌شود.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.visionacademii.ir";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // برای اینکه کوکی refreshToken هم رد و بدل بشه
});

// هر ریکوئست: اگه لاگین هستیم، Authorization رو ضمیمه کن
api.interceptors.request.use((config) => {
  const auth = loadAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function attemptRefresh(auth) {
  // پنل ادمین اصلاً روت /refresh نداره (routes/adminAuth.js) — فقط لاگین دوباره.
  if (auth.role === "admin") return null;

  const base = authBasePathFor(auth.role);
  const response = await axios.post(
    `${API_BASE_URL}${base}/refresh`,
    { refreshToken: auth.refreshToken },
    { withCredentials: true }
  );
  const { accessToken, refreshToken } = response.data;
  const nextAuth = { ...auth, accessToken, refreshToken };
  saveAuth(nextAuth);
  return nextAuth;
}

// وقتی یک درخواست ۴۰۱ برگردونه، یک‌بار تلاش برای رفرش توکن می‌کنیم
// و اگه موفق بود همون درخواست رو دوباره می‌فرستیم.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const auth = loadAuth();

    if (status === 401 && auth && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) refreshPromise = attemptRefresh(auth);
        const nextAuth = await refreshPromise;
        refreshPromise = null;
        if (!nextAuth) throw new Error("refresh-not-supported");
        original.headers.Authorization = `Bearer ${nextAuth.accessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        clearAuth();
        window.dispatchEvent(new CustomEvent("va-auth-expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
