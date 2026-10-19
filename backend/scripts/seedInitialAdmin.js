const bcrypt = require("bcryptjs");
const { Admin } = require("../models");

/**
 * روی یک دیتابیس کاملاً خالی، هیچ راهی برای ساختن اولین ادمین وجود نداره
 * (هیچ کاربری نمی‌تونه از فرانت خودش رو ادمین کنه). این تابع، اگه جدول
 * admins خالی باشه، یک ادمین اولیه از روی متغیرهای محیطی می‌سازه.
 */
async function seedInitialAdmin() {
    const count = await Admin.count();
    if (count > 0) return;

    const email = process.env.SEED_ADMIN_EMAIL || "admin@visionacademy.ir";
    const password = process.env.SEED_ADMIN_PASSWORD || "admin12345";
    const username = process.env.SEED_ADMIN_USERNAME || "مدیر سایت";

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ username, email, password: hashedPassword });

    console.log("============================================================");
    console.log("🔑 هیچ ادمینی توی دیتابیس نبود؛ یک ادمین پیش‌فرض ساخته شد:");
    console.log(`   ایمیل:      ${email}`);
    console.log(`   رمز عبور:   ${password}`);
    console.log("   ⚠️  حتماً بعد از اولین ورود، رمز عبور رو از تنظیمات پنل عوض کن.");
    console.log("   (می‌تونی مقادیر پیش‌فرض بالا رو با SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD در .env عوض کنی)");
    console.log("============================================================");
}

module.exports = { seedInitialAdmin };
