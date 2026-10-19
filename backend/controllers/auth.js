const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const configs = require("../configs");
const { User } = require("../models");
const { generateTokens } = require("../helpers/generateToken");
const {
  storeRefreshToken,
  deleteRefreshToken,
  isRefreshTokenValid,
  setRefreshTokenCookie,
} = require("../helpers/storeRefreshToken");

// توجه: این ROLE مربوط به «نوع جدول/حساب» برای JWT است (user/consultant/admin)
// و ربطی به فیلد user.role (که مقدار "user" یا "student" می‌گیرد و پنل را مشخص می‌کند) ندارد.
const ROLE = "user";

exports.register = async (request, response, next) => {
  try {
    const {
      name,
      lastname,
      email,
      user_password,
      birthday,
      gender,
      city,
      student_number,
      father_number,
      mother_number,
      telegram_id,
      degree,
      grade_10_gpa,
      grade_11_gpa,
      grade_12_gpa,
      is_retaker,
      entrance_exam_attempts,
      prev_national_rank,
      preferred_major,
      preferred_universities,
      notes,
    } = request.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return response.status(409).json({
        success: false,
        message: "این ایمیل قبلاً ثبت‌نام کرده است",
      });

    const existingStudentNumber = await User.findOne({ where: { student_number } });
    if (existingStudentNumber)
      return response.status(409).json({
        success: false,
        message: "این شماره دانش‌آموزی قبلاً ثبت شده است",
      });

    const hashedPassword = await bcrypt.hash(user_password, 10);

    // هر کاربری که تازه ثبت‌نام می‌کند role اش "user" است.
    // فقط وقتی مشاوری او را به لیست دانش‌آموزانش اضافه کند، role به "student" تغییر می‌کند
    // و پنل دانش‌آموزی برایش باز می‌شود.
    const user = await User.create({
      name,
      lastname,
      email,
      birthday,
      gender,
      city,
      student_number,
      father_number,
      mother_number,
      telegram_id,
      degree,
      grade_10_gpa,
      grade_11_gpa,
      grade_12_gpa,
      is_retaker,
      entrance_exam_attempts,
      prev_national_rank,
      preferred_major,
      preferred_universities,
      notes,
      role: "user",
      user_password: hashedPassword,
    });

    user.user_password = undefined;

    const { accessToken, refreshToken } = generateTokens(user.id, ROLE);
    await storeRefreshToken(user.id, ROLE, refreshToken);
    setRefreshTokenCookie(response, refreshToken);

    return response.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (request, response, next) => {
  try {
    const user = request.user; // از verifyLoginCredentials("user")

    const { accessToken, refreshToken } = generateTokens(user.id, ROLE);
    await storeRefreshToken(user.id, ROLE, refreshToken);
    setRefreshTokenCookie(response, refreshToken);

    return response.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user,
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

    // rotation: توکن قدیمی باطل و توکن جدید صادر می‌شه
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
    const userId = request.user?.id || request.body.id;
    if (userId) await deleteRefreshToken(userId, ROLE);

    response.clearCookie("refreshToken");
    return response.status(200).json({
      success: true,
      message: "خروج با موفقیت انجام شد.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /auth/me -> فرانت با این اندپوینت متوجه می‌شود کدام پنل را نشان دهد
// (role === "user" -> پنل کاربر عادی, role === "student" -> پنل دانش‌آموزی)
exports.me = async (request, response, next) => {
  try {
    const { Consultant } = require("../models");
    let user = request.user;
    if (user.role === "student" && user.consultant_id) {
      const fresh = await User.findByPk(user.id, {
        include: [{ model: Consultant, as: "consultant", attributes: ["id", "name", "lastname", "phone_number", "telegram_id", "bio"] }],
      });
      if (fresh) user = fresh;
    }
    return response.status(200).json({
      success: true,
      accountType: "user",
      panel: user.role === "student" ? "student" : "user",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// کاربر/دانش‌آموز خودش می‌تونه بخشی از پروفایلش رو ویرایش کنه (نه role که فقط ادمین کنترلش می‌کنه)
exports.updateMe = async (request, response, next) => {
  try {
    const bcrypt = require("bcryptjs");
    const { User } = require("../models");
    const user = await User.findByPk(request.user.id);
    if (!user)
      return response.status(404).json({ success: false, message: "کاربر یافت نشد!" });

    const {
      name, lastname, birthday, gender, city,
      student_number, father_number, mother_number, telegram_id,
      degree, grade_10_gpa, grade_11_gpa, grade_12_gpa,
      is_retaker, entrance_exam_attempts, prev_national_rank,
      preferred_major, preferred_universities, notes, user_password,
    } = request.body;

    const updateData = {
      name: name ?? user.name,
      lastname: lastname ?? user.lastname,
      birthday: birthday ?? user.birthday,
      gender: gender ?? user.gender,
      city: city ?? user.city,
      student_number: student_number ?? user.student_number,
      father_number: father_number ?? user.father_number,
      mother_number: mother_number ?? user.mother_number,
      telegram_id: telegram_id ?? user.telegram_id,
      degree: degree ?? user.degree,
      grade_10_gpa: grade_10_gpa ?? user.grade_10_gpa,
      grade_11_gpa: grade_11_gpa ?? user.grade_11_gpa,
      grade_12_gpa: grade_12_gpa ?? user.grade_12_gpa,
      is_retaker: is_retaker ?? user.is_retaker,
      entrance_exam_attempts: entrance_exam_attempts ?? user.entrance_exam_attempts,
      prev_national_rank: prev_national_rank ?? user.prev_national_rank,
      preferred_major: preferred_major ?? user.preferred_major,
      preferred_universities: preferred_universities ?? user.preferred_universities,
      notes: notes ?? user.notes,
    };
    if (user_password) {
      if (user_password.length < 8)
        return response.status(400).json({ success: false, message: "رمز عبور باید حداقل ۸ کاراکتر باشد" });
      updateData.user_password = await bcrypt.hash(user_password, 10);
    }

    await user.update(updateData);

    return response.status(200).json({
      success: true,
      message: "اطلاعات با موفقیت به‌روزرسانی شد.",
      user,
    });
  } catch (error) {
    next(error);
  }
};
