const express = require("express");
const controller = require("../controllers/workshop");
const validate = require("../middlewares/validate");
const workshopSchema = require("../validators/workshop");
const { authenticateAccessToken } = require("../middlewares/auth");

const router = express.Router();

router.route("/")
    .get(controller.getAllWorkshops)
    .post(authenticateAccessToken("admin", "consultant"), validate(workshopSchema), controller.createWorkshop);

router.route("/:id")
    .get(controller.getWorkshopById)
    .put(authenticateAccessToken("admin", "consultant"), validate(workshopSchema), controller.updateWorkshop)
    .delete(authenticateAccessToken("admin", "consultant"), controller.deleteWorkshop);

router.patch("/:id/toggle-active", authenticateAccessToken("admin", "consultant"), controller.toggleWorkshopActive);
router.patch("/:id/approval", authenticateAccessToken("admin"), controller.changeApprovalStatus);

module.exports = router;
