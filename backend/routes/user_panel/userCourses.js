const express = require("express");
const validate = require("../../middlewares/validate");
const controller = require("../../controllers/user_panel/userCourses");
const userCoursesSchema = require("../../validators/userCourses");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.get("/user/:user_id", authenticateAccessToken("user", "consultant", "admin"), controller.getAllByUser);
router.post("/purchase", authenticateAccessToken("user"), controller.purchase);
router.post("/", authenticateAccessToken("admin", "consultant"), validate(userCoursesSchema), controller.create);

router.route("/:id")
    .get(authenticateAccessToken("user", "consultant", "admin"), controller.getOne)
    .put(authenticateAccessToken("admin", "consultant"), validate(userCoursesSchema), controller.update)
    .delete(authenticateAccessToken("admin", "consultant"), controller.delete);

router.patch("/:id/status", authenticateAccessToken("user", "admin", "consultant"), controller.updateStatus);
router.patch("/:id/last-lesson", authenticateAccessToken("user", "admin", "consultant"), controller.updateLastLesson);

module.exports = router;
