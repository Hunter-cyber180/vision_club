// نگهداری وضعیت لاگین (نقش + توکن‌ها + پروفایل) در localStorage.
// چون سایت از سه نوع حساب جدا (user / consultant / admin) پشتیبانی می‌کند،
// همیشه فقط یکی از این‌ها هم‌زمان روی مرورگر لاگین است.

const STORAGE_KEY = "va_auth";

export function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.role) return null;
    // توکن ادمین توی یک کوکی httpOnly نگه‌داری می‌شه (نه در localStorage و نه
    // در پاسخ JSON لاگین)، پس برای نقش admin نیازی به accessToken نیست؛
    // برای user/consultant که واقعاً accessToken دارن، بدونش نامعتبره.
    if (parsed.role !== "admin" && !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

// مسیر پایه‌ی auth برای هر نقش، دقیقاً منطبق با app.js بکند
export function authBasePathFor(role) {
  if (role === "consultant") return "/consultant/auth";
  if (role === "admin") return "/admin/auth";
  return "/auth";
}
