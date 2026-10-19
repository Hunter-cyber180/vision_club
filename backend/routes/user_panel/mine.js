const express = require("express");
const controller = require("../../controllers/user_panel/mine");
const { authenticateAccessToken, requireStudentAccountRole } = require("../../middlewares/auth");

const router = express.Router();

router.use(authenticateAccessToken("user"));

router.get("/tuition-payments", controller.getMyTuitionPayments);
// پرداخت شهریه‌ی ماه جاری از کیف پول — فقط دانش‌آموز
router.post("/tuition-payments/pay", requireStudentAccountRole, controller.payTuitionFromWallet);
router.get("/charges", controller.getMyCharges);
// برنامه‌ی هفتگی فقط برای دانش‌آموزها (role=student) معنی داره
router.get("/weekly-schedules", requireStudentAccountRole, controller.getMyWeeklySchedules);
router.get("/weekly-stats", requireStudentAccountRole, controller.getMyWeeklyStats);

module.exports = router;
