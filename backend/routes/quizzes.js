const express = require("express");
const controller = require("../controllers/quiz");
const questionController = require("../controllers/question");
const optionController = require("../controllers/option");
const userAnswerController = require("../controllers/userAnswer");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

// آزمون‌ها (خواندن برای هر نقشی که لاگین کرده، نوشتن فقط ادمین)
router.get("/", authenticateAccessToken("user", "consultant", "admin"), controller.index);
router.get("/:id", authenticateAccessToken("user", "consultant", "admin"), controller.getOne);
router.put("/:quizId", authenticateAccessToken("admin"), controller.update);
router.delete("/:id", authenticateAccessToken("admin"), controller.delete);

// سوالات یک آزمون
router.post("/:quizId/questions", authenticateAccessToken("admin"), questionController.addQuestion);
router.post("/:quizId/questions/bulk", authenticateAccessToken("admin"), questionController.addMultipleQuestions);
router.put("/questions/:id", authenticateAccessToken("admin"), questionController.updateQuestion);
router.delete("/questions/:id", authenticateAccessToken("admin"), questionController.deleteQuestion);

// گزینه‌های یک سوال
router.post("/questions/:questionId/options", authenticateAccessToken("admin"), optionController.addOption);
router.post("/questions/:questionId/options/bulk", authenticateAccessToken("admin"), optionController.addMultipleOptions);
router.put("/options/:id", authenticateAccessToken("admin"), optionController.updateOption);
router.delete("/options/:id", authenticateAccessToken("admin"), optionController.deleteOption);

// ثبت پاسخ‌های دانش‌آموز و مشاهده‌ی کارنامه
router.post("/:quizId/submit", authenticateAccessToken("user"), userAnswerController.submitAnswers);
router.get("/:quizId/results/:userId", authenticateAccessToken("user", "consultant", "admin"), userAnswerController.getUserResult);

module.exports = router;
