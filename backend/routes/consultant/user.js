const express = require("express");
const controller = require("../../controllers/consultant/user");
const tuitionController = require("../../controllers/consultant/tuitionPayment");
const weeklyScheduleController = require("../../controllers/consultant/weeklySchedule");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

// نکته: "admin" هم به این روتر دسترسی داره (فقط برای endpoint های فقط-خواندنیِ
// جزئیات دانش‌آموز که وابسته به مالکیت مشاور نیستن) تا پنل ادمین بتونه دقیقاً
// همون نمای جزئیات دانش‌آموز رو که پنل مشاور داره نشون بده. اکشن‌های نوشتنی
// (افزودن/حذف از لیست، چت) رو ادمین از مسیرهای اختصاصی خودش (/admin/:id/role،
// /chat/admin-start) انجام می‌ده، نه از این‌جا.
router.use(authenticateAccessToken("consultant", "admin"));

// جستجوی کاربران عادی (role=user) که هنوز به هیچ مشاوری تخصیص داده نشدن —
// برای دکمه‌ی «افزودن دانش‌آموز جدید» توی پنل مشاور. فقط با عبارت جستجو
// (حداقل ۲ کاراکتر) کار می‌کنه تا کل جدول کاربران رو لو نده.
router.get("/candidates", controller.searchCandidateUsers);

// لیست دانش‌آموزان مشاور
router.get("/students", controller.getUsers);
router.post("/students/:userId", controller.addToUsers);
router.delete("/students/:userId", controller.deleteFromUsers);

// تعیین/ویرایش مبلغ شهریه‌ی ماهانه‌ی دانش‌آموز
router.patch("/students/:userId/tuition-amount", controller.setTuitionAmount);

// اطلاعات یک دانش‌آموز خاص
router.get("/students/:userId", controller.getUserInformations);
router.get("/students/:userId/daily-reports", controller.getUserDailyReports);
router.get("/students/:userId/analysis-exams", controller.getUserAnalysisExams);
router.get("/students/:userId/tuition-payments", controller.getUserTuitionPayments);
router.get("/students/:userId/weekly-schedules", controller.getUserWeeklySchedules);
router.get("/students/:userId/weekly-stats", controller.getUserWeeklyStats);

// دکمه‌ی «چت با دانش‌آموز»
router.post("/students/:userId/chat", controller.startChatWithUser);

// برنامه‌ی هفتگی
router.post("/students/:userId/weekly-schedule", weeklyScheduleController.sendweeklySchedule);

// شهریه
router.get("/tuition-payments/unpaid", tuitionController.getUnpaidTuitionPayments);
router.get("/tuition-payments/paid", tuitionController.getPaidTuitionPayments);
router.patch("/tuition-payments/:userId", tuitionController.changeTuitionPaymentStatus);

module.exports = router;
