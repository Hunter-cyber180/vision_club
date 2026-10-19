import { io } from "socket.io-client";
import api, { API_BASE_URL } from "./client";
import { loadAuth } from "./authStorage";

// چون توکن ادمین توی یه کوکی httpOnly ذخیره می‌شه و به جاوااسکریپت دسترسی
// نداره، ولی اتصال Socket.io به یه توکن قابل‌خوندن نیاز داره، برای ادمین
// یه توکن کوتاه‌مدت مخصوص هندشیک سوکت از بکند گرفته می‌شه (endpoint خودش
// پشت همون کوکی ادمینه). برای user/consultant همون accessToken معمولی کافیه.
async function resolveSocketToken(auth) {
  if (auth.role === "admin") {
    const { data } = await api.get("/admin/auth/socket-token");
    return data.socketToken;
  }
  return auth.accessToken;
}

let socket = null;
let connecting = null;

export async function connectSocket() {
  const auth = loadAuth();
  if (!auth) return null;
  if (socket && socket.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await resolveSocketToken(auth);
    if (socket) socket.disconnect();
    socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    return socket;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
