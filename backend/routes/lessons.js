const express = require("express");
const controller = require("../controllers/lesson");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

router.get("/course/:courseId", controller.getCourselessons);

router.route("/:id")
    .get(controller.getLessonById)
    .put(authenticateAccessToken("admin", "consultant"), controller.updateLesson)
    .delete(authenticateAccessToken("admin", "consultant"), controller.deleteLesson);

router.post("/", authenticateAccessToken("admin", "consultant"), controller.createLesson);

module.exports = router;
