const express = require("express");
const controller = require("../../controllers/admin/consultant");
const validate = require("../../middlewares/validate");
const consultantSchema = require("../../validators/consultant");
const { authenticateAccessToken } = require("../../middlewares/auth");

const router = express.Router();

router.use(authenticateAccessToken("admin"));

router.get("/", controller.getAll);
router.post("/", validate(consultantSchema), controller.create);
router.get("/:id", controller.getOne);
router.get("/:id/students", controller.getStudents);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
