const express = require("express");
const controller = require("../../controllers/admin/examSchedule");
const validate = require("../../middlewares/validate");
const examScheduleSchema = require("../../validators/examSchedule");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.get("/", authenticateAccessToken("admin", "consultant"), controller.getAll);
router.post("/", authenticateAccessToken("admin"), validate(examScheduleSchema), controller.create);
router.put("/:id", authenticateAccessToken("admin"), controller.update);
router.delete("/:id", authenticateAccessToken("admin"), controller.remove);

module.exports = router;
