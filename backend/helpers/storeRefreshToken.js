const bcrypt = require("bcryptjs");
const redis = require("../redis");
const configs = require("../configs");

// کلید ردیس رو با role namespace می‌کنیم تا id تکراری بین جدول‌های مختلف تداخل نکنه
exports.storeRefreshToken = async function (id, role, refreshToken) {
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await redis.set(
    `refreshToken:${role}:${id}`,
    hashedRefreshToken,
    "EX",
    configs.auth.refreshTokenExpiresInSeconds
  );
};

exports.deleteRefreshToken = async function (id, role) {
  await redis.del(`refreshToken:${role}:${id}`);
};

exports.isRefreshTokenValid = async function (id, role, refreshToken) {
  const storedHashedToken = await redis.get(`refreshToken:${role}:${id}`);
  if (!storedHashedToken) return false;
  return bcrypt.compare(refreshToken, storedHashedToken);
};

// httpOnly cookie برای کاربر/دانش‌آموز و مشاور — persistent تا زمان انقضا (maxAge ست شده)
exports.setRefreshTokenCookie = function (response, refreshToken) {
  response.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: configs.isProduction,
    sameSite: configs.isProduction ? "none" : "lax",
    maxAge: configs.auth.refreshTokenExpiresInSeconds * 1000,
  });
};

// httpOnly session cookie برای ادمین
// عمداً maxAge/expires ست نشده => "session cookie" که با بسته‌شدن کامل مرورگر پاک می‌شه
exports.setAdminAccessTokenCookie = function (response, accessToken) {
  response.cookie("adminAccessToken", accessToken, {
    httpOnly: true,
    secure: configs.isProduction,
    sameSite: configs.isProduction ? "none" : "lax",
  });
};
