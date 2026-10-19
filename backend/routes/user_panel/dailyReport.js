const express = require("express");
const controller = require("../../controllers/user_panel/dailyReport");
const lessonController = require("../../controllers/user_panel/dailyReportLesson");
const validate = require("../../middlewares/validate");
const dailyReportSchema = require("../../validators/dailyReport");
const { authenticateAccessToken, requireStudentAccountRole } = require("../../middlewares/auth");

const router = express.Router();

// دانش‌آموز (فقط role=student — کاربر عادی به این قابلیت دسترسی نداره)
router.post("/", authenticateAccessToken("user"), requireStudentAccountRole, validate(dailyReportSchema), controller.create);
router.get("/mine", authenticateAccessToken("user"), requireStudentAccountRole, controller.getMine);

// مشاور/ادمین
router.get("/user/:user_id", authenticateAccessToken("consultant", "admin"), controller.getAllByUser);
router.get("/:id", authenticateAccessToken("user", "consultant", "admin"), controller.getOne);
router.put("/:id", authenticateAccessToken("user", "consultant", "admin"), controller.update);
router.delete("/:id", authenticateAccessToken("user", "consultant", "admin"), controller.delete);

// دروسِ گزارش کار
router.get("/:report_id/lessons", authenticateAccessToken("user", "consultant", "admin"), lessonController.getAllByReportId);
router.post("/lessons", authenticateAccessToken("user"), requireStudentAccountRole, lessonController.createLesson);
router.delete("/lessons/:lesson_id", authenticateAccessToken("user", "consultant", "admin"), lessonController.deleteLesson);

module.exports = router;
