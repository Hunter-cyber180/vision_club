const express = require("express");
const controller = require("../../controllers/admin/quiz");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.use(authenticateAccessToken("admin"));

router.get("/", controller.getAllQuizzes);
router.post("/", controller.createQuiz);
router.patch("/:quizId/status", controller.updateQuizStatus);
router.delete("/:quizId", controller.deleteQuizById);

module.exports = router;
