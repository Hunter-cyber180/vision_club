const express = require("express");
const controller = require("../../controllers/user_panel/analysisExam");
const lessonController = require("../../controllers/user_panel/analysisExamLesson");
const validate = require("../../middlewares/validate");
const analysisExamSchema = require("../../validators/analysisExam");
const { authenticateAccessToken, requireStudentAccountRole } = require("../../middlewares/auth");

const router = express.Router();

// دانش‌آموز فرم تحلیل آزمون رو ثبت می‌کنه (فقط role=student)
router.post("/", authenticateAccessToken("user"), requireStudentAccountRole, validate(analysisExamSchema), controller.create);
router.get("/mine", authenticateAccessToken("user"), requireStudentAccountRole, controller.getMine);
router.get("/:id", authenticateAccessToken("user", "consultant", "admin"), controller.getOne);

// ریز نمرات دروس
router.get("/:exam_id/lessons", authenticateAccessToken("user", "consultant", "admin"), lessonController.getAllByExamId);
router.post("/lessons", authenticateAccessToken("user"), requireStudentAccountRole, lessonController.createLesson);
router.put("/lessons/:lesson_id", authenticateAccessToken("user"), requireStudentAccountRole, lessonController.updateLesson);
router.delete("/lessons/:lesson_id", authenticateAccessToken("user", "consultant", "admin"), lessonController.deleteLesson);

module.exports = router;
