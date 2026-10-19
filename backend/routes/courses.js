const express = require("express");
const controller = require("../controllers/course");
const noteController = require("../controllers/courseNote");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

router.route("/")
    .get(controller.getAllCourses)
    .post(authenticateAccessToken("admin", "consultant"), controller.create);

router.route("/:id")
    .get(controller.getCourseById)
    .put(authenticateAccessToken("admin", "consultant"), controller.update)
    .delete(authenticateAccessToken("admin", "consultant"), controller.delete);

router.patch("/:id/status", authenticateAccessToken("admin", "consultant"), controller.changeStatus);
router.patch("/:id/approval", authenticateAccessToken("admin"), controller.changeApprovalStatus);

router.get("/:courseId/notes", authenticateAccessToken("user", "consultant", "admin"), noteController.getByCourse);
router.post("/:courseId/notes", authenticateAccessToken("admin", "consultant"), noteController.create);
router.delete("/notes/:id", authenticateAccessToken("admin", "consultant"), noteController.remove);

module.exports = router;
