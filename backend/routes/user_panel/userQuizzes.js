const express = require("express");
const controller = require("../../controllers/user_panel/userQuizzes");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.use(authenticateAccessToken("user", "consultant", "admin"));

router.get("/user/:userId", controller.getUserQuizzes);
router.get("/quiz/:quizId", controller.getQuizUsers);
router.get("/:id", controller.getUserQuiz);
router.post("/", controller.createUserQuiz);
router.put("/:id", controller.updateUserQuiz);
router.delete("/:id", controller.deleteUserQuiz);

module.exports = router;
