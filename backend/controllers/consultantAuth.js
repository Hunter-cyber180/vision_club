const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const configs = require("../configs");
const { generateTokens } = require("../helpers/generateToken");
const {
  storeRefreshToken,
  deleteRefreshToken,
  isRefreshTokenValid,
  setRefreshTokenCookie,
} = require("../helpers/storeRefreshToken");

const ROLE = "consultant";

// ثبت‌نام مشاور از طریق فرم عمومی سایت (منتظر تایید ادمین می‌مونه؛ is_active=false
// تا وقتی ادمین از پنل خودش تاییدش کنه). برخلاف قبل که فقط ادمین می‌تونست
// حساب مشاور بسازه، این مسیر self-service عمومیه.
exports.register = async (request, response, next) => {
  try {
    const { Consultant } = require("../models");
    const {
      name, lastname, email, consultant_password, phone_number,
      telegram_id, counseling_fields, consultation_type,
      experience_years, education, skills, bio,
    } = request.body;

    const existing = await Consultant.findOne({ where: { email } });
    if (existing)
      return response.status(409).json({ success: false, message: "این ایمیل قبلاً ثبت شده است" });

    const hashedPassword = await bcrypt.hash(consultant_password, 10);

    const consultant = await Consultant.create({
      name, lastname, email,
      consultant_password: hashedPassword,
      phone_number, telegram_id,
      counseling_fields, consultation_type,
      experience_years, education, skills, bio,
      is_active: false, // تا وقتی ادمین تایید نکرده، نمی‌تونه لاگین کنه
    });

    return response.status(201).json({
      success: true,
      message: "درخواستت با موفقیت ثبت شد. بعد از بررسی و تایید توسط تیم ما، می‌تونی وارد پنل مشاور بشی.",
      consultant,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (request, response, next) => {
  try {
    const consultant = request.user; // از verifyLoginCredentials("consultant")

    if (consultant.is_active === false)
      return response.status(403).json({
        success: false,
        message: "حساب مشاوری‌ات هنوز توسط تیم ما تایید نشده. لطفاً کمی صبر کن یا با پشتیبانی تماس بگیر.",
      });

    const { accessToken, refreshToken } = generateTokens(consultant.id, ROLE);
    await storeRefreshToken(consultant.id, ROLE, refreshToken);
    setRefreshTokenCookie(response, refreshToken);

    return response.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      consultant,
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (request, response, next) => {
  try {
    const refreshToken = request.body.refreshToken || request.cookies?.refreshToken;
    if (!refreshToken)
      return response.status(401).json({
        success: false,
        message: "توکن رفرش ارسال نشده است",
      });

    let payload;
    try {
      payload = jwt.verify(refreshToken, configs.auth.refreshTokenSecretKey);
    } catch (e) {
      return response.status(401).json({
        success: false,
        message: "توکن رفرش نامعتبر یا منقضی شده است",
      });
    }

    if (payload.role !== ROLE)
      return response.status(401).json({ success: false, message: "توکن نامعتبر است" });

    const isValid = await isRefreshTokenValid(payload.id, ROLE, refreshToken);
    if (!isValid)
      return response.status(401).json({
        success: false,
        message: "توکن رفرش معتبر نیست!",
      });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.id, ROLE);
    await storeRefreshToken(payload.id, ROLE, newRefreshToken);
    setRefreshTokenCookie(response, newRefreshToken);

    return response.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (request, response, next) => {
  try {
    const consultantId = request.user?.id || request.body.id;
    if (consultantId) await deleteRefreshToken(consultantId, ROLE);

    response.clearCookie("refreshToken");
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
      accountType: "consultant",
      consultant: request.user,
    });
  } catch (error) {
    next(error);
  }
};

// مشاور خودش می‌تونه بخشی از پروفایلش رو ویرایش کنه (نه ایمیل/is_active که فقط ادمین کنترلشون می‌کنه)
exports.updateMe = async (request, response, next) => {
  try {
    const bcrypt = require("bcryptjs");
    const { Consultant } = require("../models");
    const consultant = await Consultant.findByPk(request.user.id);
    if (!consultant)
      return response.status(404).json({ success: false, message: "مشاور یافت نشد!" });

    const {
      name, lastname, phone_number, telegram_id, profile_image,
      counseling_fields, consultation_type, experience_years,
      education, skills, bio, consultant_password,
    } = request.body;

    const updateData = {
      name: name ?? consultant.name,
      lastname: lastname ?? consultant.lastname,
      phone_number: phone_number ?? consultant.phone_number,
      telegram_id: telegram_id ?? consultant.telegram_id,
      profile_image: profile_image ?? consultant.profile_image,
      counseling_fields: counseling_fields ?? consultant.counseling_fields,
      consultation_type: consultation_type ?? consultant.consultation_type,
      experience_years: experience_years ?? consultant.experience_years,
      education: education ?? consultant.education,
      skills: skills ?? consultant.skills,
      bio: bio ?? consultant.bio,
    };
    if (consultant_password) {
      if (consultant_password.length < 8)
        return response.status(400).json({ success: false, message: "رمز عبور باید حداقل ۸ کاراکتر باشد" });
      updateData.consultant_password = await bcrypt.hash(consultant_password, 10);
    }

    await consultant.update(updateData);

    return response.status(200).json({
      success: true,
      message: "پروفایل با موفقیت به‌روزرسانی شد.",
      consultant,
    });
  } catch (error) {
    next(error);
  }
};
