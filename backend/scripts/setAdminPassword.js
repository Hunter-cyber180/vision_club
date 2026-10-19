/**
 * استفاده:
 *   node scripts/setAdminPassword.js <email> <password>
 *
 * مثال:
 *   node scripts/setAdminPassword.js admin@visionacademy.ir MySecurePass123
 *
 * این اسکریپت مستقیم توی دیتابیس، یک ادمین با همین ایمیل/رمز عبور می‌سازه
 * (یا اگه از قبل با همین ایمیل وجود داشت، فقط رمزش رو عوض می‌کنه) — کاملاً
 * جدا از هر مقداری که توی .env هست، پس هیچ ابهامی توی اینکه "دقیقاً رمز
 * واقعی چیه" باقی نمی‌مونه: همینی که همین الان بهش دادی.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, Admin } = require("../models");

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error("❌ استفاده: node scripts/setAdminPassword.js <email> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("❌ رمز عبور باید حداقل ۸ کاراکتر باشه.");
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    const hashedPassword = await bcrypt.hash(password, 10);

    const [admin, created] = await Admin.findOrCreate({
      where: { email },
      defaults: { username: "مدیر سایت", email, password: hashedPassword },
    });

    if (!created) {
      await admin.update({ password: hashedPassword });
    }

    console.log("============================================================");
    console.log(created ? "✅ ادمین جدید ساخته شد:" : "✅ رمز عبور ادمین موجود به‌روزرسانی شد:");
    console.log(`   ایمیل:      ${email}`);
    console.log(`   رمز عبور:   ${password}`);
    console.log("   همین الان با همین دو مقدار وارد پنل ادمین شو.");
    console.log("============================================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ خطا:", error.message);
    process.exit(1);
  }
}

main();
