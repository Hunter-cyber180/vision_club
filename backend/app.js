const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const configs = require("./configs");

// routes
const authRoutes = require("./routes/auth");
const adminAuthRoutes = require("./routes/adminAuth");
const consultantAuthRoutes = require("./routes/consultantAuth");

const workshopRoutes = require("./routes/workshops");
const courseRoutes = require("./routes/courses");
const lessonRoutes = require("./routes/lessons");
const quizRoutes = require("./routes/quizzes");

const userCourseRoutes = require("./routes/user_panel/userCourses");
const userWorkshopRoutes = require("./routes/user_panel/userWorkshops");
const userQuizRoutes = require("./routes/user_panel/userQuizzes");
const dailyReportRoutes = require("./routes/user_panel/dailyReport");
const analysisExamRoutes = require("./routes/user_panel/analysisExam");
const chargeRoutes = require("./routes/user_panel/charge");
const mineRoutes = require("./routes/user_panel/mine");
const cartRoutes = require("./routes/user_panel/cart");

const consultantUserRoutes = require("./routes/consultant/user");

const adminQuizRoutes = require("./routes/admin/quiz");
const adminCategoryRoutes = require("./routes/admin/category");
const adminConsultantRoutes = require("./routes/admin/consultant");
const adminUserRoutes = require("./routes/admin/user");
const adminExamScheduleRoutes = require("./routes/admin/examSchedule");
const adminFinanceRoutes = require("./routes/admin/finance");

const pannelRoutes = require("./routes/pannel");
const checkoutRoutes = require("./routes/checkout");
const chatRoutes = require("./routes/chat");
const supportRoutes = require("./routes/support");
const uploadRoutes = require("./routes/upload");

const app = express();

app.use(cors({
    origin: "https://visionacademii.ir",
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "public")));

// توجه: به‌روزرسانی وضعیت آزمون‌ها (not-held/ongoing/held) دیگه توی میدلور
// هر ریکوئست انجام نمی‌شه (سنگین بود)، این کار الان به‌صورت cron هر دقیقه انجام میشه:
// جدا از این، cron shomaresh زیر هم فعال هستن: jobs/quizStatusJob.js

// --- auth ---
app.use("/auth", authRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/consultant/auth", consultantAuthRoutes);

// --- محتوا (کارگاه/دوره/آزمون) ---
app.use("/workshops", workshopRoutes);
app.use("/courses", courseRoutes);
app.use("/lessons", lessonRoutes);
app.use("/quizzes", quizRoutes);

// --- پنل کاربر/دانش‌آموز ---
app.use("/user-panel/user-courses", userCourseRoutes);
app.use("/user-panel/user-workshops", userWorkshopRoutes);
app.use("/user-panel/user-quizzes", userQuizRoutes);
app.use("/user-panel/daily-reports", dailyReportRoutes);
app.use("/user-panel/analysis-exams", analysisExamRoutes);
app.use("/user-panel/charge", chargeRoutes);
app.use("/user-panel/mine", mineRoutes); // /user-panel/mine/tuition-payments ، /charges ، /weekly-schedules
app.use("/user-panel/cart", cartRoutes);

// --- پنل مشاور ---
app.use("/consultant", consultantUserRoutes);
app.use("/pannel", pannelRoutes); // خلاصه‌ی چک‌های خودکار (گزارش کار نفرستاده / فرم تحلیل آزمون نفرستاده)

// --- پنل ادمین ---
app.use("/admin/quizzes", adminQuizRoutes);
app.use("/admin/categories", adminCategoryRoutes);
app.use("/admin/consultants", adminConsultantRoutes);
app.use("/admin", adminUserRoutes); // /admin/users ، /admin/students ، /admin/:userId/role
app.use("/admin/exam-schedules", adminExamScheduleRoutes);
app.use("/admin/finance", adminFinanceRoutes);

// --- پرداخت ---
app.use("/checkout", checkoutRoutes);

// --- چت و پشتیبانی ---
app.use("/chat", chatRoutes);
app.use("/support", supportRoutes);

// --- آپلود فایل (عکس/ویدیو/pdf/zip و...) — فایل‌های ذخیره‌شده از همون
// express.static بالا و مستقیم زیر مسیر /uploads/<دسته>/<نام‌فایل> در دسترسن ---
app.use("/uploads", uploadRoutes);

// 404
app.use((request, response) => {
    response.status(404).json({ success: false, message: "مسیر یافت نشد!" });
});

// خطای عمومی (سکوئلایز/JWT/هر چیز دیگه‌ای که با next(error) پاس داده بشه)
app.use((error, request, response, next) => {
    console.error(error);
    response.status(error.status || 500).json({
        success: false,
        message: error.message || "خطای داخلی سرور",
    });
});

module.exports = app;
