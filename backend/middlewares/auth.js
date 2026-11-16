const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const configs = require("../configs");
const { User, Consultant, Admin } = require("../models");

const roleModels = {
  user: User,
  consultant: Consultant,
  admin: Admin,
};

const passwordField = {
  user: "user_password",
  consultant: "consultant_password",
  admin: "password",
};

exports.verifyLoginCredentials = (role) => async (request, response, next) => {
  try {
    const Model = roleModels[role];
    const { email, password } = request.body;

    if (!email || !password)
      return response.status(400).json({
        success: false,
        message: "ایمیل و رمز عبور الزامی است",
      });

    console.log(`🔎 [login:${role}] تلاش برای ورود با ایمیل: "${email}" (طول رمز وارد‌شده: ${password.length})`);

    const account = await Model.scope("withPassword").findOne({ where: { email } });
    if (!account) {
      console.log(`❌ [login:${role}] هیچ حسابی با ایمیل "${email}" توی جدول ${Model.tableName} پیدا نشد.`);
      return response.status(401).json({
        success: false,
        message: "ایمیل یا رمز عبور اشتباه است",
      });
    }

    const storedHash = account[passwordField[role]];
    console.log(`✅ [login:${role}] حساب پیدا شد (id=${account.id}). طول هش ذخیره‌شده: ${storedHash ? storedHash.length : "خالی/null!"}`);

    const isPasswordValid = await bcrypt.compare(password, storedHash || "");
    if (!isPasswordValid) {
      console.log(`❌ [login:${role}] رمز عبور با هش ذخیره‌شده مطابقت نداره (id=${account.id}).`);
      return response.status(401).json({
        success: false,
        message: "ایمیل یا رمز عبور اشتباه است",
      });
    }

    console.log(`✅ [login:${role}] ورود موفق (id=${account.id}).`);

    account[passwordField[role]] = undefined;

    request.user = account;
    request.role = role;
    next();
  } catch (error) {
    next(error);
  }
};

exports.authenticateAccessToken = (...allowedRoles) => async (request, response, next) => {
  try {
    let token;

    const authHeader = request.headers.authorization; // "Bearer <token>"
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (allowedRoles.includes("admin") && request.cookies?.adminAccessToken) {
      token = request.cookies.adminAccessToken;
    }

    if (!token)
      return response.status(401).json({
        success: false,
        message: "توکن ارسال نشده است!",
      });

    let payload;
    try {
      payload = jwt.verify(token, configs.auth.accessTokenSecretKey);
    } catch (error) {
      const message =
        error.name === "TokenExpiredError" ? "توکن منقضی شده است!" : "توکن نامعتبر است!";
      return response.status(401).json({ success: false, message });
    }

    if (!allowedRoles.includes(payload.role))
      return response.status(403).json({
        success: false,
        message: "دسترسی برای این نقش مجاز نیست",
      });

    const Model = roleModels[payload.role];
    const account = await Model.findOne({ where: { id: payload.id } });
    if (!account)
      return response.status(404).json({
        success: false,
        message: "کاربر یافت نشد!",
      });

    request.user = account;
    request.role = payload.role;
    next();
  } catch (error) {
    next(error);
  }
};

exports.requireStudentAccountRole = (request, response, next) => {
  if (!request.user || request.user.role !== "student") {
    return response.status(403).json({
      success: false,
      message: "این قابلیت فقط برای دانش‌آموزهایی که مشاور دارند در دسترس است.",
    });
  }
  next();
};
