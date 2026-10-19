require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const configs = require("./configs");
const { sequelize } = require("./models"); // بارگذاری همه‌ی مدل‌ها + روابط
const { initSocket } = require("./sockets");
const { seedInitialAdmin } = require("./scripts/seedInitialAdmin");
const { initRedis } = require("./redis");

// cron-jobs
require("./jobs/quizStatusJob");
require("./jobs/tuitionPaymentJob");
require("./jobs/tuitionPaymentCheckJob");
require("./jobs/dailyReportCheckJob");
require("./jobs/analysisExamCheckJob");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: configs.domain || true,
        credentials: true,
    },
});
initSocket(io);
app.set("io", io);

async function start() {
    try {
        // این باید قبل از باز شدن سرور برای ریکوئست‌ها تموم بشه — وگرنه
        // ممکنه یک ریکوئست اول (قبل از وصل‌شدن Redis) توی حافظه‌ی موقت
        // ذخیره بشه ولی ریکوئست‌های بعدی (بعد از وصل‌شدن Redis) دنبالش
        // توی Redis واقعی بگردن و پیداش نکنن — همون چیزی که باعث می‌شد
        // کاربر بی‌دلیل و نامنظم از سشنش پرت بشه بیرون.
        await initRedis();

        await sequelize.authenticate();
        console.log("✅ Database connection established.");

        // نکته‌ی مهم: این پروژه اصلاً سیستم migration نداره — تنها راهی که یک
        // فیلد/جدول جدید توی models/*.js (مثلاً یک ستون تازه یا مقدار تازه‌ی
        // ENUM) واقعاً روی دیتابیسِ واقعی هم اعمال بشه، همینه. قبلاً این خط
        // فقط وقتی NODE_ENV !== "production" اجرا می‌شد — یعنی روی سرور واقعی
        // (که معمولاً NODE_ENV=production ست می‌شه) هیچ‌وقت اجرا نمی‌شد و در
        // نتیجه هر تغییر مدلی که در فازهای مختلف اضافه شده بود (مثل
        // consultant_id روی جدول کارگاه‌ها، یا مقدار not_done توی
        // ENUM ستون activity_type) هیچ‌وقت واقعاً روی دیتابیس سرور اعمال
        // نمی‌شد و همون باگ‌های عجیب «تغییر دادی ولی هیچی عوض نشده» رو ایجاد
        // می‌کرد. پس این‌جا همیشه (چه dev چه production) اجرا می‌شه تا اسکیمای
        // دیتابیس همیشه با مدل‌های فعلی کد یکی باشه.
        await sequelize.sync({ alter: true });
        console.log("✅ Models synced with database (alter mode).");

        await seedInitialAdmin();

        server.listen(configs.port, () => {
            console.log(`🚀 Server running on http://localhost:${configs.port}`);
        });
    } catch (error) {
        console.error("❌ Unable to start server:", error);
        process.exit(1);
    }
}

start();
