const jwt = require("jsonwebtoken");
const configs = require("../configs");

/**
 * @param {string|number} id - آیدی کاربر (user/consultant/admin)
 * @param {"user"|"consultant"|"admin"} role
 * @param {object} [options]
 * @param {boolean} [options.withRefresh=true] - false باشه => refreshToken ساخته نمی‌شه (برای ادمین)
 * @param {string} [options.accessExpiresIn] - اگه بدی، مدت اعتبار پیش‌فرض accessToken رو override می‌کنه
 */
exports.generateTokens = function (id, role, options = {}) {
  const { withRefresh = true, accessExpiresIn } = options;

  const accessToken = jwt.sign(
    { id, role },
    configs.auth.accessTokenSecretKey,
    { expiresIn: accessExpiresIn || configs.auth.accessTokenExpiresInSeconds }
  );

  if (!withRefresh)
    return { accessToken, refreshToken: null };

  const refreshToken = jwt.sign(
    { id, role },
    configs.auth.refreshTokenSecretKey,
    { expiresIn: configs.auth.refreshTokenExpiresInSeconds }
  );

  return { accessToken, refreshToken };
};
