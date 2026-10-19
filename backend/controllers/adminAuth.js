const configs = require("../configs");
const { generateTokens } = require("../helpers/generateToken");
const { setAdminAccessTokenCookie } = require("../helpers/storeRefreshToken");

const ROLE = "admin";

// accessToken فقط توی یه httpOnly session cookie قرار می‌گیره (بدون maxAge)
// و اصلاً به صورت JSON به فرانت برگردونده نمی‌شه.
// نتیجه: با بسته‌شدن کامل مرورگر، کوکی پاک می‌شه و ادمین باید دوباره لاگین کنه.

exports.login = async (request, response, next) => {
  try {
    const admin = request.user; // از verifyLoginCredentials("admin")

    const { accessToken } = generateTokens(admin.id, ROLE, {
      withRefresh: false,
      accessExpiresIn: configs.auth.adminAccessTokenExpiresInSeconds,
    });

    setAdminAccessTokenCookie(response, accessToken);

    return response.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (request, response, next) => {
  try {
    response.clearCookie("adminAccessToken");
    return response.status(200).json({
      success: true,
      message: "خروج با موفقیت انجام شد.",
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (request, response, next) => {
  try {
    return response.status(200).json({
      success: true,
      accountType: "admin",
      admin: request.user,
    });
  } catch (error) {
    next(error);
  }
};

// یک accessToken کوتاه‌مدت جدا فقط برای اتصال Socket.io (چت زنده) صادر می‌کنه.
// چون accessToken اصلی ادمین httpOnly cookie‌ست و به JS در دسترس نیست، ولی
// اتصال سوکت به یه توکن قابل دسترس در جاوااسکریپت نیاز داره (handshake.auth.token).
// این endpoint خودش پشت authenticateAccessToken("admin") (یعنی همون کوکی) قرار داره.
exports.getSocketToken = async (request, response, next) => {
  try {
    const admin = request.user;
    const { accessToken } = generateTokens(admin.id, ROLE, {
      withRefresh: false,
      accessExpiresIn: 60 * 60, // ۱ ساعت، فقط برای هندشیک سوکت
    });
    return response.status(200).json({ success: true, socketToken: accessToken });
  } catch (error) {
    next(error);
  }
};

// ادمین خودش می‌تونه نام کاربری/رمز عبورش رو تغییر بده (ایمیل قابل تغییر نیست)
exports.updateMe = async (request, response, next) => {
  try {
    const bcrypt = require("bcryptjs");
    const { Admin } = require("../models");
    const admin = await Admin.findByPk(request.user.id);
    if (!admin)
      return response.status(404).json({ success: false, message: "ادمین یافت نشد!" });

    const { username, password } = request.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (password) {
      if (password.length < 8)
        return response.status(400).json({ success: false, message: "رمز عبور باید حداقل ۸ کاراکتر باشد" });
      updateData.password = await bcrypt.hash(password, 10);
    }

    await admin.update(updateData);

    return response.status(200).json({
      success: true,
      message: "پروفایل با موفقیت به‌روزرسانی شد.",
      admin: { id: admin.id, username: admin.username, email: admin.email },
    });
  } catch (error) {
    next(error);
  }
};
