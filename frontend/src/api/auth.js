import api from "./client";
import { authBasePathFor, saveAuth, clearAuth } from "./authStorage";

// role: "user" | "consultant" | "admin"

export async function login(role, { email, password }) {
  const base = authBasePathFor(role);
  const { data } = await api.post(`${base}/login`, { email, password });
  const auth = {
    role,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    profile: data.user || data.consultant || data.admin || null,
  };
  saveAuth(auth);
  return auth;
}

export async function registerUser(payload) {
  const { data } = await api.post(`/auth/register`, payload);
  const auth = {
    role: "user",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    profile: data.user,
  };
  saveAuth(auth);
  return auth;
}

// ثبت‌نام مشاور خودکار وارد پنل نمی‌کنه — حساب تا تایید ادمین is_active:false می‌مونه
// (طبق controllers/consultantAuth.js) پس فقط پیام برمی‌گردونیم، نه توکن.
export async function registerConsultant(payload) {
  const { data } = await api.post(`/consultant/auth/register`, payload);
  return data; // { success, message, consultant }
}

export async function fetchMe(role) {
  const base = authBasePathFor(role);
  const { data } = await api.get(`${base}/me`);
  return data;
}

export async function logout(role) {
  const base = authBasePathFor(role);
  try {
    await api.post(`${base}/logout`);
  } finally {
    clearAuth();
  }
}
