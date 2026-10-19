require("dotenv").config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT) || 8080,
  domain: process.env.DOMAIN,
  // آدرس کامل بک‌اند برای ساخت URL مطلق فایل‌های آپلودی (ویدیو/عکس و ...).
  // اگه ست نشه، از روی همون درخواست وارده (پروتکل + host) ساخته می‌شه.
  backendBaseUrl: process.env.BACKEND_BASE_URL || null,

  db: {
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "vision_club",
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || "mysql",
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
  },

  auth: {
    accessTokenSecretKey: process.env.ACCESS_TOKEN_SECRET_KEY,
    refreshTokenSecretKey: process.env.REFRESH_TOKEN_SECRET_KEY,
    accessTokenExpiresInSeconds: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS) || 1800,
    refreshTokenExpiresInSeconds: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS) || 2592000,
    adminAccessTokenExpiresInSeconds: parseInt(process.env.ADMIN_ACCESS_TOKEN_EXPIRES_IN_SECONDS) || 1800,
  },

  redis: {
    uri: process.env.REDIS_URI || "",
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  zarinpal: {
    merchantId: process.env.ZARINPAL_MERCHANT_ID,
    callbackUrl: process.env.ZARINPAL_PAYMENT_CALLBACK_URL,
    apiBaseUrl: process.env.ZARINPAL_API_BASE_URL,
    merchantBaseUrl: process.env.ZARINPAL_MERCHANT_BASE_URL,
  },

  cron: {
    dailyReportCheck: process.env.DAILY_REPORT_CHECK_CRON || "*/30 * * * *",
    tuitionPayment: process.env.TUITION_PAYMENT_CRON || "10 0 * * *",
    tuitionPaymentCheck: process.env.TUITION_PAYMENT_CHECK_CRON || "*/30 * * * *",
    analysisExamCheck: process.env.ANALYSIS_EXAM_CHECK_CRON || "*/30 * * * *",
  },

  // پشتیبانی سایت فقط یک نفره؛ این اطلاعات برای همه‌ی نقش‌ها (کاربر/دانش‌آموز/مشاور/ادمین) یکسانه
  support: {
    phoneNumber: process.env.SUPPORT_PHONE_NUMBER || "09165613709",
    name: process.env.SUPPORT_NAME || "پشتیبانی ویژن آکادمی",
  },
};
